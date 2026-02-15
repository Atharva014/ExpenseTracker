import RNFS from 'react-native-fs';

const DATA_FILE_PATH = `${RNFS.DocumentDirectoryPath}/expense_data.json`;

// Default data structure
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
    { id: '2', name: 'Food', icon: '🍕' },
    { id: '3', name: 'Grocery', icon: '🛒' },
    { id: '4', name: 'Shopping', icon: '🛍️' },
    { id: '5', name: 'Transport', icon: '🚗' },
    { id: '6', name: 'Bills', icon: '💡' },
    { id: '7', name: 'Entertainment', icon: '🎬' },
  ],
  expenses: [],
});

// Load data from file
export const loadData = async () => {
  try {
    const fileExists = await RNFS.exists(DATA_FILE_PATH);
    
    if (!fileExists) {
      // Create file with default data
      const defaultData = getDefaultData();
      await RNFS.writeFile(DATA_FILE_PATH, JSON.stringify(defaultData), 'utf8');
      return defaultData;
    }
    
    const fileContent = await RNFS.readFile(DATA_FILE_PATH, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error loading data:', error);
    return getDefaultData();
  }
};

// Save data to file
export const saveData = async (data) => {
  try {
    const updatedData = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    await RNFS.writeFile(DATA_FILE_PATH, JSON.stringify(updatedData), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

// Add new expense
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

// Get all expenses
export const getExpenses = async () => {
  try {
    const data = await loadData();
    return data.expenses;
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
};

// Add payment method
export const addPaymentMethod = async (paymentMethod) => {
  try {
    const data = await loadData();
    const newMethod = {
      id: `pm_${Date.now()}`,
      ...paymentMethod,
    };
    data.paymentMethods.push(newMethod);
    await saveData(data);
    return newMethod;
  } catch (error) {
    console.error('Error adding payment method:', error);
    return null;
  }
};

// Get payment methods
export const getPaymentMethods = async () => {
  try {
    const data = await loadData();
    return data.paymentMethods;
  } catch (error) {
    console.error('Error getting payment methods:', error);
    return [];
  }
};

// Export backup
export const exportBackup = async () => {
  try {
    const data = await loadData();
    const backupFileName = `expense_backup_${Date.now()}.json`;
    const backupPath = `${RNFS.DownloadDirectoryPath}/${backupFileName}`;
    
    await RNFS.writeFile(backupPath, JSON.stringify(data, null, 2), 'utf8');
    return backupPath;
  } catch (error) {
    console.error('Error exporting backup:', error);
    return null;
  }
};

// Import backup
export const importBackup = async (filePath) => {
  try {
    const fileContent = await RNFS.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    await saveData(data);
    return true;
  } catch (error) {
    console.error('Error importing backup:', error);
    return false;
  }
};