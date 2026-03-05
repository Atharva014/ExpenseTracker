import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';

const requestStoragePermission = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    const sdkVersion = parseInt(Platform.Version, 10);
    if (sdkVersion >= 33) return true; // Android 13+ uses scoped storage
    const readGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      { title: 'Storage Permission', message: 'App needs storage access for backups.', buttonPositive: 'Allow' }
    );
    const writeGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      { title: 'Storage Permission', message: 'App needs storage access to save backups.', buttonPositive: 'Allow' }
    );
    return readGranted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (e) { return false; }
};

const DATA_FILE_PATH = `${RNFS.DocumentDirectoryPath}/expense_data.json`;

// Keys for month tracking and carryover
const LAST_INCOME_MONTH_KEY = 'lastIncomeMonth';    // 'YYYY-MM' of last income entry
const CARRYOVER_BALANCE_KEY = 'carryoverBalance';   // leftover from prev month

const getDefaultData = () => ({
  version: '1.0',
  lastUpdated: new Date().toISOString(),
  settings: {
    currency: '₹',
  },
  paymentMethods: [
    { id: 'cash', name: 'Cash', icon: '💵', type: 'cash' },
  ],
  categories: [
    { id: '1', name: 'Healthcare', icon: '🏥' },
    { id: '2', name: 'Food',       icon: '🍽️' },
    { id: '3', name: 'Grocery',    icon: '🛒' },
    { id: '4', name: 'Shopping',   icon: '🛍️' },
    { id: '5', name: 'Transport',  icon: '🚗' },
    { id: '6', name: 'Bills',      icon: '💡' },
    { id: '7', name: 'Entertainment', icon: '🎬' },
    { id: '9', name: 'Electronics',   icon: '💻' },
    { id: '8', name: 'Others',        icon: '📦' },
  ],
  expenses: [],
});

export const loadData = async () => {
  try {
    const fileExists = await RNFS.exists(DATA_FILE_PATH);
    if (!fileExists) {
      const defaultData = getDefaultData();
      await RNFS.writeFile(DATA_FILE_PATH, JSON.stringify(defaultData), 'utf8');
      return defaultData;
    }
    const fileContent = await RNFS.readFile(DATA_FILE_PATH, 'utf8');
    const parsed = JSON.parse(fileContent);

    // Migrate: add Others if missing
    if (parsed.categories && !parsed.categories.find(c => c.name?.toLowerCase() === 'others')) {
      parsed.categories.push({ id: '8', name: 'Others', icon: '📦' });
      await RNFS.writeFile(DATA_FILE_PATH, JSON.stringify(parsed), 'utf8');
    }

    // Migrate: update Food icon
    const foodCat = parsed.categories.find(c => c.id === '2');
    if (foodCat && foodCat.icon === '🍕') foodCat.icon = '🍽️';
    // Migrate: add Electronics if missing
    if (parsed.categories && !parsed.categories.find(c => c.name?.toLowerCase() === 'electronics')) {
      parsed.categories.push({ id: '9', name: 'Electronics', icon: '💻' });
      await RNFS.writeFile(DATA_FILE_PATH, JSON.stringify(parsed), 'utf8');
    }

    return parsed;
  } catch (error) {
    console.error('Error loading data:', error);
    return getDefaultData();
  }
};

export const saveData = async (data) => {
  try {
    const updatedData = { ...data, lastUpdated: new Date().toISOString() };
    await RNFS.writeFile(DATA_FILE_PATH, JSON.stringify(updatedData), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

// ─── Monthly income + carryover logic ────────────────────────────────────────
//
// Rules:
//  • Income for the current month is stored under key `income_YYYY-MM`
//  • On the first day of a new month, income starts at 0
//  • When the user sets income for the first time in a new month, the leftover
//    balance from the previous month (prevIncome - prevExpenses) is automatically
//    added to the new income as carryover
//  • Balance = currentIncome + carryover - thisMonthExpenses

const monthKey = (date = new Date()) =>
  `income_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const loadMonthlyIncomeData = async (expenses = []) => {
  const now        = new Date();
  const curKey     = monthKey(now);
  const curMonth   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Current month's set income (0 if not set yet)
  const savedIncome = await AsyncStorage.getItem(curKey);
  const income      = savedIncome ? parseFloat(savedIncome) : 0;

  // Carryover from previous month
  const savedCarryover = await AsyncStorage.getItem(CARRYOVER_BALANCE_KEY);
  const carryover      = savedCarryover ? parseFloat(savedCarryover) : 0;

  // This month's expenses (exclude income transactions)
  const thisMonthTotal = expenses
    .filter(e => {
      if (e.type === 'income') return false;
      const d = new Date(e.date);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth()    === now.getMonth()
      );
    })
    .reduce((s, e) => s + parseFloat(e.amount), 0);

  return {
    income,          // what user set for this month (0 on new month)
    carryover,       // leftover from last month
    thisMonthTotal,  // spent this month
    balance: income + carryover - thisMonthTotal,
  };
};

export const saveMonthlyIncome = async (newIncome, expenses = []) => {
  const now      = new Date();
  const curKey   = monthKey(now);
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Check if this is the first income entry for this month
  const existingIncome = await AsyncStorage.getItem(curKey);
  const isFirstEntry   = !existingIncome || parseFloat(existingIncome) === 0;

  if (isFirstEntry) {
    // Calculate carryover: find last month's income and expenses
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastKey       = monthKey(lastMonthDate);
    const lastYM        = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const lastIncomeSaved = await AsyncStorage.getItem(lastKey);
    const lastIncome      = lastIncomeSaved ? parseFloat(lastIncomeSaved) : 0;

    const lastMonthSpent = expenses
      .filter(e => {
        const d = new Date(e.date);
        return (
          d.getFullYear() === lastMonthDate.getFullYear() &&
          d.getMonth()    === lastMonthDate.getMonth()
        );
      })
      .reduce((s, e) => s + parseFloat(e.amount), 0);

    const leftover = Math.max(lastIncome - lastMonthSpent, 0);

    // Add previous carryover too (rolling balance)
    const prevCarryover = await AsyncStorage.getItem(CARRYOVER_BALANCE_KEY);
    const totalCarryover = leftover + (prevCarryover ? parseFloat(prevCarryover) : 0);

    await AsyncStorage.setItem(CARRYOVER_BALANCE_KEY, totalCarryover.toString());
  }

  await AsyncStorage.setItem(curKey, newIncome.toString());

  // ── Record income as a transaction (type:'income') — replaces any existing one for this month ──
  const appData  = await loadData();
  const now2     = new Date();
  const curYM    = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`;
  const filtered = (appData.expenses ?? []).filter(e => {
    if (e.type !== 'income') return true;
    const d   = new Date(e.date);
    const eYM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return eYM !== curYM;
  });
  const incomeTx = {
    id:          `income_${Date.now()}`,
    type:        'income',
    amount:      newIncome,
    description: 'Money Added',
    date:        now.toISOString(),
    createdAt:   now.toISOString(),
    categoryId:  null,
  };
  await saveData({ ...appData, expenses: [incomeTx, ...filtered] });

  return true;
};

export const getCarryoverBalance = async () => {
  const saved = await AsyncStorage.getItem(CARRYOVER_BALANCE_KEY);
  return saved ? parseFloat(saved) : 0;
};

// ── Add money directly to balance (additive, not replacing income) ──
export const addBalanceTopUp = async (amount) => {
  const now    = new Date();
  const data   = await loadData();
  const topUpTx = {
    id:          `topup_${Date.now()}`,
    type:        'income',          // treated as income so it adds to balance
    amount,
    description: 'Balance Added',
    date:        now.toISOString(),
    createdAt:   now.toISOString(),
    categoryId:  null,
  };
  await saveData({ ...data, expenses: [topUpTx, ...(data.expenses ?? [])] });
  // Also bump the current month's income key so balance calc stays correct
  const curKey      = monthKey(now);
  const savedIncome = await AsyncStorage.getItem(curKey);
  const curIncome   = savedIncome ? parseFloat(savedIncome) : 0;
  await AsyncStorage.setItem(curKey, (curIncome + amount).toString());
  return true;
};

// ─── Standard CRUD ───────────────────────────────────────────────────────────
export const addExpense = async (expense) => {
  try {
    const data = await loadData();
    const newExpense = {
      id: `exp_${Date.now()}`,
      ...expense,
      createdAt: new Date().toISOString(),
    };
    data.expenses.unshift(newExpense);
    await saveData(data);
    return newExpense;
  } catch (error) {
    console.error('Error adding expense:', error);
    return null;
  }
};

export const getExpenses = async () => {
  try {
    const data = await loadData();
    return data.expenses;
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
};

export const addPaymentMethod = async (paymentMethod) => {
  try {
    const data = await loadData();
    const newMethod = { id: `pm_${Date.now()}`, ...paymentMethod };
    data.paymentMethods.push(newMethod);
    await saveData(data);
    return newMethod;
  } catch (error) {
    console.error('Error adding payment method:', error);
    return null;
  }
};

export const getPaymentMethods = async () => {
  try {
    const data = await loadData();
    return data.paymentMethods;
  } catch (error) {
    console.error('Error getting payment methods:', error);
    return [];
  }
};

export const exportBackup = async () => {
  try {
    await requestStoragePermission();
    const data = await loadData();
    const backupFileName = `expense_backup_${Date.now()}.json`;
    // Save to Downloads folder - works on all Android versions
    const backupPath = `${RNFS.DownloadDirectoryPath}/${backupFileName}`;
    await RNFS.writeFile(backupPath, JSON.stringify(data, null, 2), 'utf8');
    return backupPath;
  } catch (error) {
    console.error('Error exporting backup:', error);
    return null;
  }
};

export const importBackup = async (filePath) => {
  try {
    await requestStoragePermission();
    const fileContent = await RNFS.readFile(filePath, 'utf8');
    const imported = JSON.parse(fileContent);
    // Validate it's a valid backup
    if (!imported.expenses || !imported.categories) return false;
    // Restore everything: expenses, categories, paymentMethods, settings, income
    const current = await loadData();
    const merged = {
      ...current,
      expenses:       imported.expenses       ?? current.expenses,
      categories:     imported.categories     ?? current.categories,
      paymentMethods: imported.paymentMethods ?? current.paymentMethods,
      settings:       imported.settings       ?? current.settings,
      monthlyIncome:  imported.monthlyIncome  ?? current.monthlyIncome,
      lastUpdated:    imported.lastUpdated     ?? current.lastUpdated,
    };
    await saveData(merged);
    return true;
  } catch (error) {
    console.error('Error importing backup:', error);
    return false;
  }
};