import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TouchableWithoutFeedback, TextInput, Modal, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { loadData, saveData } from '../utils/storage';
import { getTheme, subscribeToTheme } from '../utils/theme';
import { useFocusEffect } from '@react-navigation/native';

// ─── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} />
    <Line x1="16.5" y1="16.5" x2="22" y2="22" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const FilterIcon = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="10" y1="18" x2="14" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const EditIcon = ({ color }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const TrashIcon = ({ color }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ─── Payment types ────────────────────────────────────────────────────────────
const PAYMENT_TYPES = [
  { id: 'upi',  label: 'UPI',  icon: '📲' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'cash', label: 'Cash', icon: '💵' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const groupByMonth = (expenses) => {
  const groups = {};
  expenses.forEach(exp => {
    const d   = new Date(exp.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = { key, label, items: [], total: 0 };
    groups[key].items.push(exp);
    groups[key].total += parseFloat(exp.amount);
  });
  return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
};

const PERIODS = ['All', 'This Month', 'Last Month', 'This Week'];

// ─── Component ────────────────────────────────────────────────────────────────
const HistoryScreen = () => {
  const [data, setData]                         = useState(null);
  const [search, setSearch]                     = useState('');
  const [searchVisible, setSearchVisible]       = useState(false);
  const [filterVisible, setFilterVisible]       = useState(false);
  const [selectedPeriod, setSelectedPeriod]     = useState('All');
  const [selectedCats, setSelectedCats]         = useState([]);
  const [theme, setThemeState]                  = useState(getTheme());

  // ── Edit sheet state ──
  const [editExpense, setEditExpense]           = useState(null); // the expense being edited
  const [editAmount, setEditAmount]             = useState('');
  const [editDescription, setEditDescription]   = useState('');
  const [editDate, setEditDate]                 = useState('');
  const [editCategoryId, setEditCategoryId]     = useState(null);
  const [editPaymentType, setEditPaymentType]   = useState('cash');
  const [editSubAccount, setEditSubAccount]     = useState(null);
  const [showSubDropdown, setShowSubDropdown]   = useState(false);
  const [paymentMethods, setPaymentMethods]     = useState([]);

  useEffect(() => {
    loadAppData();
    const unsubscribe = subscribeToTheme(() => setThemeState(getTheme()));
    return unsubscribe;
  }, []);

  useFocusEffect(useCallback(() => { loadAppData(); }, []));

  const loadAppData = async () => {
    const appData = await loadData();
    setData(appData);
    const methods = (appData?.paymentMethods ?? []).filter(
      p => p.type !== 'cash' && p.name?.toLowerCase() !== 'cash'
    );
    setPaymentMethods(methods);
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  // ── Open edit sheet pre-filled ──
  const openEdit = (expense) => {
    setEditExpense(expense);
    setEditAmount(parseFloat(expense.amount).toString());
    setEditDescription(expense.description ?? '');
    setEditDate(expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditCategoryId(expense.categoryId ?? null);
    const pType = expense.paymentType ?? 'cash';
    setEditPaymentType(pType);

    const methods = paymentMethods;
    if (pType !== 'cash' && expense.paymentMethodId) {
      const found = methods.find(m => m.id === expense.paymentMethodId);
      setEditSubAccount(found ?? (methods[0] ?? null));
    } else {
      setEditSubAccount(methods[0] ?? null);
    }
  };

  const closeEdit = () => setEditExpense(null);

  // ── Sub-account list for edit sheet ──
  const editSubList = useMemo(() => {
    if (editPaymentType === 'card') return paymentMethods.filter(p => p.type === 'card');
    if (editPaymentType === 'upi')  return paymentMethods;
    return [];
  }, [editPaymentType, paymentMethods]);

  const handleEditPaymentType = (typeId) => {
    setEditPaymentType(typeId);
    const list = typeId === 'card'
      ? paymentMethods.filter(p => p.type === 'card')
      : typeId === 'upi' ? paymentMethods : [];
    setEditSubAccount(list[0] ?? null);
  };

  // ── Save edits ──
  const handleSaveEdit = async () => {
    if (!editAmount || isNaN(parseFloat(editAmount)) || parseFloat(editAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!editCategoryId) {
      Alert.alert('Select Category', 'Please select a category.');
      return;
    }

    const appData = await loadData();
    const updatedExpenses = (appData.expenses ?? []).map(e => {
      if (e.id !== editExpense.id) return e;
      return {
        ...e,
        amount:          parseFloat(editAmount).toFixed(2),
        description:     editDescription.trim() || (data?.categories?.find(c => c.id === editCategoryId)?.name ?? ''),
        categoryId:      editCategoryId,
        paymentType:     editPaymentType,
        paymentMethodId: editPaymentType === 'cash' ? 'cash' : (editSubAccount?.id ?? null),
        date:            new Date(editDate).toISOString(),
      };
    });

    await saveData({ ...appData, expenses: updatedExpenses });
    await loadAppData();
    closeEdit();
  };

  // ── Delete ──
  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const appData = await loadData();
            const updatedExpenses = (appData.expenses ?? []).filter(e => e.id !== editExpense.id);
            await saveData({ ...appData, expenses: updatedExpenses });
            await loadAppData();
            closeEdit();
          },
        },
      ]
    );
  };

  // ── Filter logic ──
  const filterExpenses = useMemo(() => {
    if (!data?.expenses) return [];
    let filtered = [...data.expenses];

    const now              = new Date();
    const startOfWeek      = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0);

    if (selectedPeriod === 'This Week')  filtered = filtered.filter(e => new Date(e.date) >= startOfWeek);
    if (selectedPeriod === 'This Month') filtered = filtered.filter(e => new Date(e.date) >= startOfMonth);
    if (selectedPeriod === 'Last Month') filtered = filtered.filter(e => {
      const d = new Date(e.date);
      return d >= startOfLastMonth && d <= endOfLastMonth;
    });
    if (selectedCats.length > 0) filtered = filtered.filter(e => selectedCats.includes(e.categoryId));
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(e =>
        e.description?.toLowerCase().includes(q) ||
        data.categories?.find(c => c.id === e.categoryId)?.name?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [data, search, selectedPeriod, selectedCats]);

  const grouped = useMemo(() => groupByMonth(filterExpenses), [filterExpenses]);

  // ── Edit sheet category list — declared here so it's always above any return ──
  const editCategories = useMemo(() => {
    let cats = data?.categories ?? [];
    if (!cats.find(c => c.name?.toLowerCase() === 'others' || c.name?.toLowerCase() === 'other')) {
      cats = [...cats, { id: 'others', name: 'Others', icon: '📦' }];
    }
    return cats;
  }, [data]);

  const toggleCat   = (id) => setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  const clearFilters = () => { setSelectedPeriod('All'); setSelectedCats([]); };
  const activeFilters = selectedPeriod !== 'All' || selectedCats.length > 0;

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // ── Transaction row ──
  const renderExpenseRow = (expense, isLast) => {
    const cat = data.categories?.find(c => c.id === expense.categoryId);
    return (
      <View key={expense.id}>
        <TouchableOpacity
          style={styles.txRow}
          onLongPress={() => openEdit(expense)}
          delayLongPress={400}
          activeOpacity={0.75}
        >
          <View style={styles.txAvatar}>
            <Text style={styles.txAvatarText}>{cat?.icon ?? '📦'}</Text>
          </View>
          <View style={styles.txInfo}>
            <Text style={styles.txName} numberOfLines={1}>{expense.description}</Text>
            <Text style={styles.txDate}>{fmtDate(expense.date)}</Text>
            <View style={styles.txTag}>
              <Text style={styles.txTagText}>{cat?.name ?? 'Other'}</Text>
            </View>
          </View>
          <View style={styles.txRight}>
            <Text style={styles.txAmount}>-₹{parseFloat(expense.amount).toLocaleString('en-IN')}</Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => openEdit(expense)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.6}
            >
              <EditIcon color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        {!isLast && <View style={styles.divider} />}
      </View>
    );
  };

  const renderItem = ({ item: group }) => (
    <View style={styles.group}>
      <View style={styles.monthHeader}>
        <Text style={styles.monthLabel}>{group.label}</Text>
        <Text style={styles.monthTotal}>
          Total Spent{'\n'}
          <Text style={styles.monthTotalAmt}>₹{group.total.toLocaleString('en-IN')}</Text>
        </Text>
      </View>
      {group.items.map((expense, idx) =>
        renderExpenseRow(expense, idx === group.items.length - 1)
      )}
    </View>
  );

  if (!data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.center}><Text style={styles.loadingText}>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Payment History</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={[styles.iconBtn, searchVisible && styles.iconBtnActive]}
            onPress={() => setSearchVisible(!searchVisible)}
            activeOpacity={0.7}
          >
            <SearchIcon color={searchVisible ? '#FFFFFF' : '#8B9BAE'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, activeFilters && styles.iconBtnActive]}
            onPress={() => setFilterVisible(true)}
            activeOpacity={0.7}
          >
            <FilterIcon color={activeFilters ? '#FFFFFF' : '#8B9BAE'} />
            {activeFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search bar ── */}
      {searchVisible && (
        <View style={styles.searchBar}>
          <SearchIcon color={theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
      )}

      {/* ── Active filter pills ── */}
      {activeFilters && (
        <View style={styles.activePills}>
          {selectedPeriod !== 'All' && (
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>{selectedPeriod}</Text>
            </View>
          )}
          {selectedCats.map(id => {
            const cat = data.categories?.find(c => c.id === id);
            return cat ? (
              <View key={id} style={styles.activePill}>
                <Text style={styles.activePillText}>{cat.icon} {cat.name}</Text>
              </View>
            ) : null;
          })}
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── List ── */}
      {grouped.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyText}>No transactions found</Text>
          <Text style={styles.emptySub}>Try adjusting your filters or add a new expense.</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════
          ── Edit Sheet Modal ──
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={!!editExpense}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}
      >
        <TouchableWithoutFeedback onPress={closeEdit}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.editSheet}>
          <View style={styles.editHandle} />

          {/* Sheet header with Delete */}
          <View style={styles.editHeader}>
            <Text style={styles.editTitle}>Edit Transaction</Text>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
              <TrashIcon color={theme.red} />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.editScroll}
          >
            {/* Amount */}
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Amount <Text style={styles.required}>*</Text></Text>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  keyboardType="decimal-pad"
                  value={editAmount}
                  onChangeText={setEditAmount}
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Description</Text>
              <TextInput
                style={styles.textInput}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="What did you spend on?"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* Date & Payment type */}
            <View style={styles.editRow}>
              <View style={[styles.editHalf, { marginRight: 8 }]}>
                <Text style={styles.editLabel}>Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={editDate}
                  onChangeText={setEditDate}
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={[styles.editHalf, { marginLeft: 8 }]}>
                <Text style={styles.editLabel}>Payment</Text>
                <View style={styles.paymentPills}>
                  {PAYMENT_TYPES.map(pt => {
                    const isActive = editPaymentType === pt.id;
                    return (
                      <TouchableOpacity
                        key={pt.id}
                        style={[styles.paymentPill, isActive && styles.paymentPillActive]}
                        onPress={() => handleEditPaymentType(pt.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.paymentPillIcon}>{pt.icon}</Text>
                        <Text style={[styles.paymentPillText, isActive && styles.paymentPillTextActive]}>
                          {pt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Sub-account (UPI / Card) */}
            {editPaymentType !== 'cash' && editSubList.length > 0 && (
              <View style={styles.editField}>
                <Text style={styles.editLabel}>
                  {editPaymentType === 'card' ? 'Select Card' : 'Pay via'}
                </Text>
                <TouchableOpacity
                  style={styles.subDropdown}
                  onPress={() => setShowSubDropdown(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.subDropdownLeft}>
                    <Text style={styles.subDropdownIcon}>
                      {editSubAccount?.icon ?? (editPaymentType === 'card' ? '💳' : '🏦')}
                    </Text>
                    <Text style={styles.subDropdownValue} numberOfLines={1}>
                      {editSubAccount?.name ?? 'Select account'}
                    </Text>
                  </View>
                  <Text style={styles.subDropdownArrow}>▾</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Category pills */}
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Category <Text style={styles.required}>*</Text></Text>
              <View style={styles.pillGrid}>
                {editCategories.map(cat => {
                  const isSelected = editCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                      onPress={() => setEditCategoryId(cat.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categoryPillIcon}>{cat.icon}</Text>
                      <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextSelected]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Save button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Sub-account modal nested inside edit modal */}
        <Modal
          visible={showSubDropdown}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSubDropdown(false)}
        >
          <TouchableOpacity
            style={styles.subModalOverlay}
            activeOpacity={1}
            onPress={() => setShowSubDropdown(false)}
          >
            <View style={styles.subModalSheet}>
              <View style={styles.editHandle} />
              <Text style={styles.subModalTitle}>
                {editPaymentType === 'card' ? 'Select Card' : 'Select Account'}
              </Text>
              <FlatList
                data={editSubList}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                  const isActive = editSubAccount?.id === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.subModalItem, isActive && styles.subModalItemActive]}
                      onPress={() => { setEditSubAccount(item); setShowSubDropdown(false); }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.subModalIcon}>{item.icon ?? '💳'}</Text>
                      <Text style={[styles.subModalText, isActive && styles.subModalTextActive]}>
                        {item.name}
                      </Text>
                      {isActive && <Text style={styles.subModalCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                }}
                ItemSeparatorComponent={() => <View style={styles.subModalDivider} />}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </Modal>

      {/* ── Filter Modal ── */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterVisible(false)}
        />
        <View style={styles.filterSheet}>
          <View style={styles.filterHandle} />
          <Text style={styles.filterTitle}>Filter Transactions</Text>

          <Text style={styles.filterSection}>TIME PERIOD</Text>
          <View style={styles.filterChips}>
            {PERIODS.map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.filterChip, selectedPeriod === p && styles.filterChipActive]}
                onPress={() => setSelectedPeriod(p)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, selectedPeriod === p && styles.filterChipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSection}>CATEGORY</Text>
          <View style={styles.filterChips}>
            {data.categories?.map(cat => {
              const active = selectedCats.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => toggleCat(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterChipText}>{cat.icon} </Text>
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.filterBtns}>
            <TouchableOpacity style={styles.filterBtnClear} onPress={clearFilters} activeOpacity={0.7}>
              <Text style={styles.filterBtnClearText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterBtnApply} onPress={() => setFilterVisible(false)} activeOpacity={0.85}>
              <Text style={styles.filterBtnApplyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme) => StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: theme.bgPrimary },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { color: theme.textPrimary, fontSize: 16, fontWeight: '600' },

  // ── Header ──
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
  },
  title:        { fontSize: 24, fontWeight: '700', color: theme.textPrimary, letterSpacing: -0.5 },
  headerIcons:  { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: theme.bgSecondary,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  iconBtnActive: { backgroundColor: theme.bgElevated, borderColor: 'rgba(255,255,255,0.2)' },
  filterDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 4, backgroundColor: theme.green,
  },

  // ── Search ──
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: theme.bgSecondary,
    borderRadius: 14, paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: { flex: 1, fontSize: 14, color: theme.textPrimary, padding: 0 },

  // ── Active filter pills ──
  activePills: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 20, marginBottom: 8, alignItems: 'center',
  },
  activePill: {
    backgroundColor: 'rgba(78,205,196,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: theme.green,
  },
  activePillText: { fontSize: 11, fontWeight: '600', color: theme.green },
  clearText:      { fontSize: 11, fontWeight: '600', color: theme.red },

  // ── List ──
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },

  // ── Month group ──
  group: {
    marginBottom: 24,
    backgroundColor: theme.bgSecondary,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
  },
  monthHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
    backgroundColor: theme.bgElevated,
  },
  monthLabel:    { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  monthTotal:    { fontSize: 11, color: theme.textPrimary, opacity: 0.55, textAlign: 'right' },
  monthTotalAmt: { fontSize: 13, fontWeight: '700', color: theme.green, opacity: 1 },

  // ── Transaction row ──
  txRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  txAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1C2841',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  txAvatarText: { fontSize: 20 },
  txInfo:       { flex: 1 },
  txName:       { fontSize: 14, fontWeight: '600', color: theme.textPrimary, marginBottom: 2 },
  txDate:       { fontSize: 11, color: theme.textPrimary, opacity: 0.5, marginBottom: 5 },
  txTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  txTagText:  { fontSize: 10, fontWeight: '600', color: theme.textPrimary, opacity: 0.7 },
  txRight:    { alignItems: 'flex-end', gap: 6, paddingTop: 2 },
  txAmount:   { fontSize: 14, fontWeight: '700', color: theme.red },
  editBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 72 },

  // ── Empty ──
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 6 },
  emptySub:  { fontSize: 13, color: theme.textPrimary, opacity: 0.45, textAlign: 'center', lineHeight: 18 },

  // ══ Edit Sheet ══
  editSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: theme.bgCard,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 16,
    maxHeight: '92%',
  },
  editHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginBottom: 16,
  },
  editHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 4,
  },
  editTitle:   { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20, backgroundColor: 'rgba(255,80,80,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,80,80,0.25)',
  },
  deleteBtnText: { fontSize: 13, fontWeight: '600', color: theme.red },
  editScroll:    { paddingHorizontal: 20, paddingBottom: 40 },

  // Edit form fields
  editField:   { marginTop: 16 },
  editRow:     { flexDirection: 'row', marginTop: 16, alignItems: 'flex-start' },
  editHalf:    { flex: 1 },
  editLabel: {
    fontSize: 11, fontWeight: '600', color: theme.textPrimary,
    opacity: 0.6, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8,
  },
  required: { color: theme.red, opacity: 1 },

  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.bgSecondary, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, height: 50,
  },
  currencySymbol: { fontSize: 17, fontWeight: '700', color: theme.textPrimary, marginRight: 6 },
  amountInput:    { flex: 1, fontSize: 20, fontWeight: '700', color: theme.textPrimary, padding: 0 },

  textInput: {
    backgroundColor: theme.bgSecondary, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, height: 48, fontSize: 14, color: theme.textPrimary,
  },

  // Payment pills in edit sheet
  paymentPills: { flexDirection: 'row', gap: 5, height: 48 },
  paymentPill: {
    flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    borderRadius: 50, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)', backgroundColor: theme.bgSecondary, gap: 2,
  },
  paymentPillActive:     { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  paymentPillIcon:       { fontSize: 13 },
  paymentPillText:       { fontSize: 9, fontWeight: '700', color: theme.textPrimary, letterSpacing: 0.3 },
  paymentPillTextActive: { color: '#1C2128' },

  // Sub-account dropdown
  subDropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.bgSecondary, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, height: 48,
  },
  subDropdownLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  subDropdownIcon:  { fontSize: 18 },
  subDropdownValue: { fontSize: 14, fontWeight: '500', color: theme.textPrimary, flex: 1 },
  subDropdownArrow: { fontSize: 14, color: theme.textMuted },

  // Category pills in edit sheet
  pillGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 50,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: theme.bgSecondary, gap: 6,
  },
  categoryPillSelected:     { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  categoryPillIcon:         { fontSize: 15 },
  categoryPillText:         { fontSize: 12, fontWeight: '600', color: theme.textPrimary },
  categoryPillTextSelected: { color: '#1C2128' },

  // Save button
  saveBtn: {
    marginTop: 20, backgroundColor: '#FFFFFF',
    borderRadius: 16, height: 54, justifyContent: 'center', alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#1C2128', letterSpacing: 0.3 },

  // Sub-account nested modal
  subModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  subModalSheet: {
    backgroundColor: theme.bgCard,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 16, paddingBottom: 44, maxHeight: '55%',
  },
  subModalTitle: {
    fontSize: 15, fontWeight: '700', color: theme.textPrimary,
    textAlign: 'center', marginBottom: 12, paddingHorizontal: 20,
  },
  subModalItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14, gap: 14,
  },
  subModalItemActive: { backgroundColor: 'rgba(255,255,255,0.07)' },
  subModalIcon:       { fontSize: 22 },
  subModalText:       { flex: 1, fontSize: 15, fontWeight: '500', color: theme.textPrimary },
  subModalTextActive: { fontWeight: '700', color: theme.green },
  subModalCheck:      { fontSize: 16, fontWeight: '700', color: theme.green },
  subModalDivider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 60 },

  // ── Overlay ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },

  // ── Filter sheet ──
  filterSheet: {
    backgroundColor: theme.bgCard,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  filterHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginBottom: 20,
  },
  filterTitle:       { fontSize: 17, fontWeight: '700', color: theme.textPrimary, marginBottom: 20 },
  filterSection:     { fontSize: 10, fontWeight: '700', color: theme.textPrimary, opacity: 0.5, letterSpacing: 1, marginBottom: 10 },
  filterChips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)', backgroundColor: theme.bgSecondary,
  },
  filterChipActive:     { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  filterChipText:       { fontSize: 12, fontWeight: '600', color: theme.textPrimary },
  filterChipTextActive: { color: '#1C2128' },
  filterBtns:           { flexDirection: 'row', gap: 10, marginTop: 4 },
  filterBtnClear: {
    flex: 1, height: 48, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  filterBtnClearText: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, opacity: 0.7 },
  filterBtnApply: {
    flex: 1, height: 48, borderRadius: 14,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  filterBtnApplyText: { fontSize: 15, fontWeight: '700', color: '#1C2128' },
});

export default HistoryScreen;