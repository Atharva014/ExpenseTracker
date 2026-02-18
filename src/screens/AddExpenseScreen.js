import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadData, saveData } from '../utils/storage';
import { getTheme, subscribeToTheme } from '../utils/theme';

const AddExpenseScreen = () => {
  const [amount, setAmount]           = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPayment, setSelectedPayment]   = useState(null);
  const [categories, setCategories]   = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [date, setDate]               = useState(new Date().toISOString().split('T')[0]);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [theme, setThemeState]        = useState(getTheme());

  useEffect(() => {
    loadFormData();
    const unsubscribe = subscribeToTheme(() => setThemeState(getTheme()));
    return unsubscribe;
  }, []);

  const loadFormData = async () => {
    const data = await loadData();
    if (data?.categories) setCategories(data.categories);
    if (data?.paymentMethods) {
      setPaymentMethods(data.paymentMethods);
      // Default to Cash
      const cash = data.paymentMethods.find(p =>
        p.name?.toLowerCase() === 'cash'
      );
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
      description: description.trim() || selectedCategory.name, // fallback to category name if empty
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header — no subtitle ── */}
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

        {/* ── Description (optional) ── */}
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

        {/* ── Date ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.textInput}
            value={date}
            onChangeText={setDate}
            placeholderTextColor={theme.textMuted}
          />
        </View>

        {/* ── Payment Mode — dropdown ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Payment Mode</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowPaymentDropdown(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dropdownLeft}>
              {selectedPayment && (
                <Text style={styles.dropdownIcon}>{selectedPayment.icon ?? '💵'}</Text>
              )}
              <Text style={styles.dropdownValue}>
                {selectedPayment?.name ?? 'Select payment mode'}
              </Text>
            </View>
            <Text style={styles.dropdownArrow}>▾</Text>
          </TouchableOpacity>
        </View>

        {/* ── Category chips ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
          <View style={styles.chips}>
            {categories.map(cat => {
              const isSelected = selectedCategory?.id === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipIcon}>{cat.icon}</Text>
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
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
      </ScrollView>

      {/* ── Payment Mode Dropdown Modal ── */}
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
  safeArea:     { flex: 1, backgroundColor: theme.bgPrimary },
  container:    { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  // ── Header ──
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },

  // ── Section ──
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  required: { color: theme.red },
  optional: {
    fontSize: 11,
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
    height: 48,
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

  // ── Category chips ──
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: theme.bgSecondary,
  },
  chipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  chipIcon: { fontSize: 13 },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  chipTextSelected: {
    color: '#1C2128',
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
    paddingHorizontal: 14,
    height: 46,
  },
  dropdownLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dropdownIcon:  { fontSize: 16 },
  dropdownValue: { fontSize: 14, fontWeight: '500', color: theme.textPrimary },
  dropdownArrow: { fontSize: 14, color: theme.textMuted },

  // ── Text input ──
  textInput: {
    backgroundColor: theme.bgSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: theme.textPrimary,
  },

  // ── Save button ──
  saveBtn: {
    marginHorizontal: 20,
    marginTop: 32,
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
  modalItemActive: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  modalItemIcon: { fontSize: 20 },
  modalItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: theme.textPrimary,
  },
  modalItemTextActive: {
    fontWeight: '700',
    color: theme.green,
  },
  modalCheck: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.green,
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 58,
  },
});

export default AddExpenseScreen;