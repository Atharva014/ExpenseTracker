import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadData, saveData } from '../utils/storage';
import { getTheme, subscribeToTheme } from '../utils/theme';

const AddExpenseScreen = () => {
  const [amount, setAmount]                       = useState('');
  const [description, setDescription]             = useState('');
  const [selectedCategory, setSelectedCategory]   = useState(null);
  const [selectedPayment, setSelectedPayment]     = useState(null);
  const [categories, setCategories]               = useState([]);
  const [paymentMethods, setPaymentMethods]       = useState([]);
  const [date, setDate]                           = useState(new Date().toISOString().split('T')[0]);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [theme, setThemeState]                    = useState(getTheme());

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

    if (data?.paymentMethods) {
      setPaymentMethods(data.paymentMethods);
      const cash = data.paymentMethods.find(p => p.name?.toLowerCase() === 'cash');
      setSelectedPayment(cash ?? data.paymentMethods[0] ?? null);
    }
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
      paymentMethodId: selectedPayment?.id ?? null,
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

  // Split categories into two rows of 4 for a tight grid
  const catRow1 = categories.slice(0, 4);
  const catRow2 = categories.slice(4);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Non-scrollable root */}
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

        {/* ── Date & Payment Mode side by side ── */}
        <View style={styles.rowSection}>
          <View style={[styles.halfSection, { marginRight: 6 }]}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.textInput}
              value={date}
              onChangeText={setDate}
              placeholderTextColor={theme.textMuted}
            />
          </View>
          <View style={[styles.halfSection, { marginLeft: 6 }]}>
            <Text style={styles.label}>Payment</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowPaymentDropdown(true)}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownLeft}>
                {selectedPayment && (
                  <Text style={styles.dropdownIcon}>{selectedPayment.icon ?? '💵'}</Text>
                )}
                <Text style={styles.dropdownValue} numberOfLines={1}>
                  {selectedPayment?.name ?? 'Select'}
                </Text>
              </View>
              <Text style={styles.dropdownArrow}>▾</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Category chips ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
          {/* Row 1 */}
          <View style={styles.chipRow}>
            {catRow1.map(cat => {
              const isSelected = selectedCategory?.id === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipIcon}>{cat.icon}</Text>
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Row 2 */}
          {catRow2.length > 0 && (
            <View style={[styles.chipRow, { marginTop: 6 }]}>
              {catRow2.map(cat => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipIcon}>{cat.icon}</Text>
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]} numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Save Button ── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Expense</Text>
        </TouchableOpacity>
      </View>

      {/* ── Payment Mode Modal ── */}
      <Modal
        visible={showPaymentDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPaymentDropdown(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Payment Mode</Text>
            <FlatList
              data={paymentMethods}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isActive = selectedPayment?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isActive && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedPayment(item);
                      setShowPaymentDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalItemIcon}>{item.icon ?? '💵'}</Text>
                    <Text style={[styles.modalItemText, isActive && styles.modalItemTextActive]}>
                      {item.name}
                    </Text>
                    {isActive && <Text style={styles.modalCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
            />
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
    paddingTop: 12,
    paddingBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },

  // ── Sections ──
  section: {
    paddingHorizontal: 20,
    marginTop: 14,
  },
  rowSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 14,
  },
  halfSection: { flex: 1 },

  label: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  required: { color: theme.red },
  optional: {
    fontSize: 10,
    color: theme.textMuted,
    fontWeight: '400',
    textTransform: 'none',
  },

  // ── Amount ──
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    height: 46,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    padding: 0,
  },

  // ── Text input ──
  textInput: {
    backgroundColor: theme.bgSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    height: 44,
    fontSize: 13,
    color: theme.textPrimary,
  },

  // ── Dropdown ──
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.bgSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    height: 44,
  },
  dropdownLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  dropdownIcon:  { fontSize: 14 },
  dropdownValue: { fontSize: 12, fontWeight: '500', color: theme.textPrimary, flex: 1 },
  dropdownArrow: { fontSize: 12, color: theme.textMuted, marginLeft: 4 },

  // ── Category chips (2 rows of 4) ──
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: theme.bgSecondary,
  },
  chipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  chipIcon: { fontSize: 12 },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  chipTextSelected: {
    color: '#1C2128',
  },

  // ── Save button ──
  saveBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C2128',
    letterSpacing: 0.3,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 16,
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
  modalItemIcon:       { fontSize: 20 },
  modalItemText:       { flex: 1, fontSize: 15, fontWeight: '500', color: theme.textPrimary },
  modalItemTextActive: { fontWeight: '700', color: theme.green },
  modalCheck:          { fontSize: 16, fontWeight: '700', color: theme.green },
  modalDivider:        { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 58 },
});

export default AddExpenseScreen;