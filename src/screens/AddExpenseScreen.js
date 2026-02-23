import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadData, saveData } from '../utils/storage';
import { getTheme, subscribeToTheme } from '../utils/theme';

// ── Payment type definitions ──────────────────────────────────────────────────
const PAYMENT_TYPES = [
  { id: 'upi',  label: 'UPI',  icon: '📲' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'cash', label: 'Cash', icon: '💵' },
];

const AddExpenseScreen = () => {
  const [amount, setAmount]                           = useState('');
  const [description, setDescription]                 = useState('');
  const [selectedCategory, setSelectedCategory]       = useState(null);
  const [date, setDate]                               = useState(new Date().toISOString().split('T')[0]);
  const [categories, setCategories]                   = useState([]);
  const [paymentMethods, setPaymentMethods]           = useState([]);

  // Payment type pill: 'upi' | 'card' | 'cash'
  const [selectedPaymentType, setSelectedPaymentType] = useState('upi');
  // The specific sub-account selected (card / bank)
  const [selectedSubAccount, setSelectedSubAccount]   = useState(null);
  const [showSubDropdown, setShowSubDropdown]         = useState(false);

  const [theme, setThemeState] = useState(getTheme());

  useEffect(() => {
    loadFormData();
    const unsubscribe = subscribeToTheme(() => setThemeState(getTheme()));
    return unsubscribe;
  }, []);

  const loadFormData = async () => {
    const data = await loadData();

    // Ensure 'Others' category exists
    let cats = data?.categories ?? [];
    if (!cats.find(c => c.name?.toLowerCase() === 'others' || c.name?.toLowerCase() === 'other')) {
      cats = [...cats, { id: 'others', name: 'Others', icon: '📦' }];
    }
    setCategories(cats);

    // Non-cash payment methods (cards & banks)
    const methods = (data?.paymentMethods ?? []).filter(
      p => p.type !== 'cash' && p.name?.toLowerCase() !== 'cash'
    );
    setPaymentMethods(methods);

    // Default UPI — pick first available sub-account if any
    if (methods.length > 0) {
      setSelectedSubAccount(methods[0]);
    }
  };

  // Sub-accounts list based on selected payment type
  const subAccountList = () => {
    if (selectedPaymentType === 'card') {
      return paymentMethods.filter(p => p.type === 'card');
    }
    if (selectedPaymentType === 'upi') {
      return paymentMethods; // UPI can pay via any card or bank
    }
    return [];
  };

  const showSubAccountSelector = selectedPaymentType !== 'cash' && subAccountList().length > 0;

  const handlePaymentTypeSelect = (typeId) => {
    setSelectedPaymentType(typeId);
    const list = typeId === 'card'
      ? paymentMethods.filter(p => p.type === 'card')
      : typeId === 'upi'
        ? paymentMethods
        : [];
    setSelectedSubAccount(list[0] ?? null);
  };

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select a category.');
      return;
    }

    const data = await loadData();
    const newExpense = {
      id: Date.now().toString(),
      amount: parseFloat(amount).toFixed(2),
      description: description.trim() || selectedCategory.name,
      categoryId: selectedCategory.id,
      paymentType: selectedPaymentType,
      paymentMethodId: selectedPaymentType === 'cash' ? 'cash' : (selectedSubAccount?.id ?? null),
      date: new Date(date).toISOString(),
    };

    const updatedData = {
      ...data,
      expenses: [newExpense, ...(data.expenses ?? [])],
    };
    await saveData(updatedData);

    Alert.alert('Saved!', 'Expense recorded successfully.', [
      {
        text: 'OK', onPress: () => {
          setAmount('');
          setDescription('');
          setSelectedCategory(null);
          setDate(new Date().toISOString().split('T')[0]);
        },
      },
    ]);
  };

  const styles = createStyles(theme);
  const subList = subAccountList();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.root}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Expense</Text>
        </View>

        {/* ── Amount ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Amount <Text style={styles.required}>*</Text></Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        {/* ── Description ── */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Description <Text style={styles.optional}>(Optional)</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="What did you spend on?"
            placeholderTextColor={theme.textMuted}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* ── Date & Payment side by side ── */}
        <View style={styles.rowSection}>
          {/* Date */}
          <View style={[styles.halfSection, { marginRight: 8 }]}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.textInput}
              value={date}
              onChangeText={setDate}
              placeholderTextColor={theme.textMuted}
            />
          </View>

          {/* Payment type pills */}
          <View style={[styles.halfSection, { marginLeft: 8 }]}>
            <Text style={styles.label}>Payment</Text>
            <View style={styles.paymentPills}>
              {PAYMENT_TYPES.map(pt => {
                const isActive = selectedPaymentType === pt.id;
                return (
                  <TouchableOpacity
                    key={pt.id}
                    style={[styles.paymentPill, isActive && styles.paymentPillActive]}
                    onPress={() => handlePaymentTypeSelect(pt.id)}
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

        {/* ── Sub-account selector (shown for UPI / Card only) ── */}
        {showSubAccountSelector && (
          <View style={styles.section}>
            <Text style={styles.label}>
              {selectedPaymentType === 'card' ? 'Select Card' : 'Pay via'}
            </Text>
            <TouchableOpacity
              style={styles.subDropdown}
              onPress={() => setShowSubDropdown(true)}
              activeOpacity={0.7}
            >
              <View style={styles.subDropdownLeft}>
                <Text style={styles.subDropdownIcon}>
                  {selectedSubAccount?.icon ?? (selectedPaymentType === 'card' ? '💳' : '🏦')}
                </Text>
                <Text style={styles.subDropdownValue} numberOfLines={1}>
                  {selectedSubAccount?.name ?? `Select ${selectedPaymentType === 'card' ? 'card' : 'account'}`}
                </Text>
              </View>
              <Text style={styles.subDropdownArrow}>▾</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Category pills ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
          <View style={styles.pillGrid}>
            {categories.map(cat => {
              const isSelected = selectedCategory?.id === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                  onPress={() => setSelectedCategory(cat)}
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

        {/* ── Save Button ── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Expense</Text>
        </TouchableOpacity>
      </View>

      {/* ── Sub-account Modal ── */}
      <Modal
        visible={showSubDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSubDropdown(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {selectedPaymentType === 'card' ? 'Select Card' : 'Select Account'}
            </Text>
            {subList.length > 0 ? (
              <FlatList
                data={subList}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                  const isActive = selectedSubAccount?.id === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.modalItem, isActive && styles.modalItemActive]}
                      onPress={() => {
                        setSelectedSubAccount(item);
                        setShowSubDropdown(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalItemIcon}>{item.icon ?? '💳'}</Text>
                      <View style={styles.modalItemInfo}>
                        <Text style={[styles.modalItemText, isActive && styles.modalItemTextActive]}>
                          {item.name}
                        </Text>
                        {item.number && (
                          <Text style={styles.modalItemSub}>•••• {item.number.slice(-4)}</Text>
                        )}
                      </View>
                      {isActive && <Text style={styles.modalCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                }}
                ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
              />
            ) : (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>
                  No {selectedPaymentType === 'card' ? 'cards' : 'accounts'} added yet.
                </Text>
                <Text style={styles.modalEmptyHint}>
                  Go to Account → Payment Methods to add one.
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.bgPrimary },
  root:     { flex: 1, paddingBottom: 8 },

  // ── Header ──
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },

  // ── Sections ──
  section: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  rowSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  halfSection: { flex: 1 },

  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  required: { color: theme.red, opacity: 1 },
  optional: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '400',
    textTransform: 'none',
    opacity: 1,
  },

  // ── Amount ──
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    height: 54,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
    padding: 0,
  },

  // ── Text input ──
  textInput: {
    backgroundColor: theme.bgSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    color: theme.textPrimary,
  },

  // ── Payment type pills (3 equal pills in a row) ──
  paymentPills: {
    flexDirection: 'row',
    gap: 6,
    height: 50,
  },
  paymentPill: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: theme.bgSecondary,
    gap: 3,
  },
  paymentPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  paymentPillIcon:       { fontSize: 14 },
  paymentPillText:       { fontSize: 10, fontWeight: '700', color: theme.textPrimary, letterSpacing: 0.3 },
  paymentPillTextActive: { color: '#1C2128' },

  // ── Sub-account dropdown ──
  subDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.bgSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    height: 50,
  },
  subDropdownLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  subDropdownIcon:  { fontSize: 18 },
  subDropdownValue: { fontSize: 14, fontWeight: '500', color: theme.textPrimary, flex: 1 },
  subDropdownArrow: { fontSize: 14, color: theme.textMuted },

  // ── Category pills (pill shape, auto-wrap) ──
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: theme.bgSecondary,
    gap: 7,
  },
  categoryPillSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  categoryPillIcon:         { fontSize: 16 },
  categoryPillText:         { fontSize: 13, fontWeight: '600', color: theme.textPrimary },
  categoryPillTextSelected: { color: '#1C2128' },

  // ── Save button ──
  saveBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C2128',
    letterSpacing: 0.3,
  },

  // ── Sub-account Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingBottom: 44,
    maxHeight: '65%',
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 14,
  },
  modalItemActive:     { backgroundColor: 'rgba(255,255,255,0.07)' },
  modalItemIcon:       { fontSize: 22 },
  modalItemInfo:       { flex: 1 },
  modalItemText:       { fontSize: 15, fontWeight: '500', color: theme.textPrimary },
  modalItemTextActive: { fontWeight: '700', color: theme.green },
  modalItemSub:        { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  modalCheck:          { fontSize: 16, fontWeight: '700', color: theme.green },
  modalDivider:        { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 60 },
  modalEmpty: {
    paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 15, fontWeight: '600', color: theme.textPrimary, marginBottom: 6, textAlign: 'center',
  },
  modalEmptyHint: {
    fontSize: 12, color: theme.textMuted, textAlign: 'center', lineHeight: 18,
  },
});

export default AddExpenseScreen;