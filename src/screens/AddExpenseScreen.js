import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Modal, FlatList, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Circle, Path, G, Text as SvgText, Defs, LinearGradient, Stop, ClipPath } from 'react-native-svg';
import { loadData, saveData } from '../utils/storage';
import { getTheme, subscribeToTheme } from '../utils/theme';

// ── UPI App brand icons — accurate SVG recreations ───────────────────────────

// Google Pay — white bg, coloured G mark + "pay" text
const GPay = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Rect width="40" height="40" rx="10" fill="#FFFFFF"/>
    {/* Blue G arc */}
    <Path d="M26 19.6h-5.8v2.4h3.4c-.3 1.7-1.8 2.8-3.4 2.8-2.1 0-3.8-1.7-3.8-3.8s1.7-3.8 3.8-3.8c1 0 1.8.4 2.5 1l1.7-1.7C23.3 15.2 21.8 14.5 20 14.5c-3.1 0-5.5 2.5-5.5 5.5s2.4 5.5 5.5 5.5c2.8 0 5.3-2 5.3-5.5 0-.3 0-.6-.3-.9z" fill="#4285F4"/>
    {/* Red */}
    <Path d="M14.5 20c0-.6.1-1.2.3-1.7l-2.1-1.6C12.3 17.6 12 18.8 12 20s.3 2.4.8 3.3l2.1-1.7c-.3-.5-.4-1-.4-1.6z" fill="#EA4335"/>
    {/* Yellow */}
    <Path d="M20 25.5c-1.6 0-3-.8-3.8-2l-2.1 1.7C15.4 27 17.6 28 20 28c1.7 0 3.2-.5 4.4-1.5l-2-1.6c-.7.4-1.5.6-2.4.6z" fill="#FBBC05"/>
    {/* Green */}
    <Path d="M28 20c0-.6-.1-1.2-.3-1.7H20v3.4h4.4c-.3 1-.9 1.8-1.8 2.4l2 1.6C26.8 24.1 28 22.2 28 20z" fill="#34A853"/>
  </Svg>
);

// PhonePe — purple bg, white ₱ letterform (circle with P tail)
const PhonePe = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Rect width="40" height="40" rx="10" fill="#5F259F"/>
    {/* Outer circle */}
    <Circle cx="20" cy="18" r="9" stroke="#FFFFFF" strokeWidth="2.2" fill="none"/>
    {/* P stem */}
    <Rect x="14.5" y="13" width="2.8" height="10" rx="1.2" fill="#FFFFFF"/>
    {/* P bowl */}
    <Path d="M17.3 13h3c2.2 0 4 1.6 4 3.6s-1.8 3.6-4 3.6h-3V13z" fill="#FFFFFF"/>
    {/* Tail below circle */}
    <Rect x="21" y="25" width="2.8" height="4" rx="1.2" fill="#FFFFFF"/>
  </Svg>
);

// Paytm — white bg, navy blue circle border, "pay" in navy + "tm" in sky blue
const Paytm = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Rect width="40" height="40" rx="10" fill="#FFFFFF"/>
    {/* Navy circle border */}
    <Circle cx="20" cy="20" r="17" stroke="#003087" strokeWidth="3" fill="none"/>
    {/* "p" — navy */}
    <Rect x="6" y="17" width="2.5" height="10" rx="1.2" fill="#003087"/>
    <Circle cx="10" cy="19.5" r="3" stroke="#003087" strokeWidth="2.2" fill="none"/>
    {/* "a" — navy */}
    <Circle cx="16.5" cy="21" r="3" stroke="#003087" strokeWidth="2.2" fill="none"/>
    <Rect x="19" y="18" width="2.5" height="9" rx="1.2" fill="#003087"/>
    {/* "y" — navy */}
    <Path d="M22.5 18l2.5 5 2.5-5" stroke="#003087" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <Rect x="24" y="22.5" width="2.5" height="5.5" rx="1.2" fill="#003087"/>
    {/* "t" — sky blue */}
    <Rect x="28.5" y="15" width="2.5" height="12" rx="1.2" fill="#00BAF2"/>
    <Rect x="26.5" y="17" width="6.5" height="2.2" rx="1.1" fill="#00BAF2"/>
    {/* "m" — sky blue */}
    <Rect x="33.5" y="18" width="2.2" height="9" rx="1.1" fill="#00BAF2"/>
  </Svg>
);

// Amazon Pay — dark grey circle bg, white "pay", orange amazon smile arc
const AmazonPay = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Rect width="40" height="40" rx="10" fill="#3D4548"/>
    {/* Dark circle background matching reference */}
    <Circle cx="20" cy="20" r="18" fill="#3D4548"/>
    {/* "p" — white */}
    <Rect x="8" y="13" width="2.8" height="15" rx="1.3" fill="#FFFFFF"/>
    <Circle cx="12.5" cy="17.5" r="4" stroke="#FFFFFF" strokeWidth="2.5" fill="none"/>
    {/* "a" — white */}
    <Circle cx="20.5" cy="19" r="4" stroke="#FFFFFF" strokeWidth="2.5" fill="none"/>
    <Rect x="24" y="15" width="2.8" height="10" rx="1.3" fill="#FFFFFF"/>
    {/* "y" — white */}
    <Path d="M28 15l3 6 3-6" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <Rect x="29.5" y="20.5" width="2.8" height="7.5" rx="1.3" fill="#FFFFFF"/>
    {/* Amazon smile — orange arc with arrow */}
    <Path d="M11 28.5 Q20 34 30 28.5" stroke="#FF9900" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <Path d="M28.5 27 l2.5 1.5 -1 2" stroke="#FF9900" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// MobiKwik — blue bg, white wallet shape, bold white M inside, small circle top-right
const MobiKwik = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Rect width="40" height="40" rx="10" fill="#1B5FD9"/>
    {/* Wallet body — white rounded rect */}
    <Rect x="5" y="11" width="28" height="22" rx="5" fill="#FFFFFF"/>
    {/* Wallet flap — slightly lighter, top-right overlap */}
    <Rect x="25" y="8" width="10" height="14" rx="4" fill="#FFFFFF"/>
    {/* Small wallet clasp circle top-right */}
    <Circle cx="34" cy="15" r="2.5" fill="#1B5FD9" stroke="#FFFFFF" strokeWidth="1.2"/>
    {/* Bold blue M inside wallet */}
    <Path
      d="M10 29 L10 16 L18 25 L26 16 L26 29"
      stroke="#1B5FD9"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
const Cred = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Rect width="40" height="40" rx="10" fill="#1C1C1C"/>
    {/* Shield outline */}
    <Path d="M20 9l10 4.5v8c0 5-4 9.5-10 11-6-1.5-10-6-10-11v-8L20 9z" fill="none" stroke="#FFFFFF" strokeWidth="2"/>
    {/* C shape inside shield */}
    <Path d="M23.5 17a5 5 0 1 0 0 6" stroke="#FFFFFF" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
  </Svg>
);

// BHIM — white bg, orange+green chevron arrows (exact BHIM logo)
const Bhim = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Rect width="40" height="40" rx="10" fill="#FFFFFF"/>
    {/* Orange upper-right arrow */}
    <Path d="M16 10l10 10-10 10" stroke="none" fill="none"/>
    <Path d="M13 10l9 9.5L13 29h5l9-9.5L18 10z" fill="#FF6B00"/>
    {/* Green lower arrow offset */}
    <Path d="M19 14l7 6-7 6h4l7-6-7-6z" fill="#2E8B2E"/>
  </Svg>
);

// CRED — black bg, white shield with C cutout (actual CRED logo) — orange bg, white lightning bolt
const Freecharge = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Rect width="40" height="40" rx="10" fill="#F26522"/>
    {/* Lightning bolt */}
    <Path d="M23 9l-8 13h7l-5 10 12-15h-7z" fill="#FFFFFF"/>
  </Svg>
);

// Other UPI — generic teal with UPI letters
const OtherUpi = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40">
    <Rect width="40" height="40" rx="10" fill="#4ECDC4"/>
    {/* U */}
    <Path d="M10 13v9c0 3 2 5 5 5s5-2 5-5v-9" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* P */}
    <Rect x="22" y="13" width="2.5" height="14" rx="1.2" fill="#FFFFFF"/>
    <Path d="M24.5 13h2.5c2 0 3.5 1.5 3.5 3.5S29 20 27 20h-2.5V13z" fill="#FFFFFF"/>
    {/* I */}
    <Rect x="32" y="13" width="2.5" height="14" rx="1.2" fill="#FFFFFF"/>
  </Svg>
);

// ── Payment type definitions ──────────────────────────────────────────────────
const PAYMENT_TYPES = [
  { id: 'upi',  label: 'UPI',  icon: '📲' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'cash', label: 'Cash', icon: '💵' },
];

const UPI_APPS = [
  { id: 'phonepe',    label: 'PhonePe',    Icon: PhonePe },
  { id: 'gpay',       label: 'GPay',       Icon: GPay },
  { id: 'paytm',      label: 'Paytm',      Icon: Paytm },
  { id: 'bhim',       label: 'BHIM',       Icon: Bhim },
  { id: 'amazonpay',  label: 'Amazon Pay', Icon: AmazonPay },
  { id: 'mobikwik',   label: 'MobiKwik',   Icon: MobiKwik },
  { id: 'freecharge', label: 'Freecharge', Icon: Freecharge },
  { id: 'cred',       label: 'CRED',       Icon: Cred },
  { id: 'other',      label: 'Other UPI',  Icon: OtherUpi },
];

const AddExpenseScreen = () => {
  const [amount, setAmount]                           = useState('');
  const [description, setDescription]                 = useState('');
  const [selectedCategory, setSelectedCategory]       = useState(null);
  const [date, setDate]                               = useState(new Date().toISOString().split('T')[0]);
  const [categories, setCategories]                   = useState([]);
  const [paymentMethods, setPaymentMethods]           = useState([]);

  const [selectedPaymentType, setSelectedPaymentType] = useState('upi');
  const [selectedSubAccount, setSelectedSubAccount]   = useState(null);
  const [showSubDropdown, setShowSubDropdown]         = useState(false);
  const [selectedUpiApp, setSelectedUpiApp]           = useState(UPI_APPS[0]);  // PhonePe by default
  const [showUpiDropdown, setShowUpiDropdown]         = useState(false);
  const [otherUpiText, setOtherUpiText]               = useState('');

  // ── Themed dialog state ──
  const [dialog, setDialog] = useState(null);
  // dialog = { title, message, buttons: [{label, onPress, danger?}] }

  const showDialog = (title, message, buttons) => setDialog({ title, message, buttons });
  const closeDialog = () => setDialog(null);

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
      showDialog('Invalid Amount', 'Please enter a valid positive amount.', [
        { label: 'OK', onPress: closeDialog },
      ]);
      return;
    }
    if (!selectedCategory) {
      showDialog('Select Category', 'Please choose a category before saving.', [
        { label: 'OK', onPress: closeDialog },
      ]);
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
      upiApp: selectedPaymentType === 'upi' ? (selectedUpiApp.id === 'other' && otherUpiText.trim() ? otherUpiText.trim() : selectedUpiApp.id) : null,
      date: new Date(date).toISOString(),
    };

    await saveData({ ...data, expenses: [newExpense, ...(data.expenses ?? [])] });

    showDialog('Expense Saved', `₹${parseFloat(amount).toLocaleString('en-IN')} added successfully.`, [
      {
        label: 'OK', onPress: () => {
          closeDialog();
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

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
            <Text style={styles.label}>Payment Mode</Text>
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

        {/* ── Pay via (UPI app) — only shown when UPI is selected ── */}
        {selectedPaymentType === 'upi' && (
          <View style={styles.section}>
            <Text style={styles.label}>Pay via</Text>
            <View style={styles.payViaRow}>

              {/* 30% — dropdown trigger */}
              <TouchableOpacity
                style={[
                  styles.payViaDropdown,
                  selectedUpiApp?.id === 'other' && styles.payViaDropdownSplit,
                ]}
                onPress={() => setShowUpiDropdown(true)}
                activeOpacity={0.7}
              >
                <View style={styles.upiIconWrap}>
                  {selectedUpiApp && <selectedUpiApp.Icon size={26} />}
                </View>
                {selectedUpiApp?.id !== 'other' && (
                  <Text style={styles.payViaDropdownLabel} numberOfLines={1}>
                    {selectedUpiApp?.label}
                  </Text>
                )}
                <Text style={styles.subDropdownArrow}>▾</Text>
              </TouchableOpacity>

              {/* 70% — text input, only when Other is selected */}
              {selectedUpiApp?.id === 'other' && (
                <TextInput
                  style={styles.payViaTextInput}
                  placeholder="Enter UPI app name"
                  placeholderTextColor={theme.textMuted}
                  value={otherUpiText}
                  onChangeText={setOtherUpiText}
                  autoCapitalize="words"
                />
              )}

            </View>
          </View>
        )}

        {/* ── Payment Method (card / bank account) — for UPI and Card only ── */}
        {showSubAccountSelector && (
          <View style={styles.section}>
            <Text style={styles.label}>
              {selectedPaymentType === 'card' ? 'Select Card' : 'Payment Method'}
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

      </ScrollView>

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

      {/* ── UPI App Picker Modal ── */}
      <Modal
        visible={showUpiDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUpiDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUpiDropdown(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Pay via</Text>
            <FlatList
              data={UPI_APPS}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isActive = selectedUpiApp?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isActive && styles.modalItemActive]}
                    onPress={() => { setSelectedUpiApp(item); setShowUpiDropdown(false); }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.upiIconWrap}><item.Icon size={32} /></View>
                    <View style={styles.modalItemInfo}>
                      <Text style={[styles.modalItemText, isActive && styles.modalItemTextActive]}>
                        {item.label}
                      </Text>
                    </View>
                    {isActive && <Text style={styles.modalCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Themed Dialog ── */}
      {dialog && (
        <Modal visible transparent animationType="fade" onRequestClose={closeDialog}>
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogBox}>
              <Text style={styles.dialogTitle}>{dialog.title}</Text>
              <Text style={styles.dialogMessage}>{dialog.message}</Text>
              <View style={styles.dialogBtns}>
                {dialog.buttons.map((btn, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dialogBtn, btn.danger && styles.dialogBtnDanger, dialog.buttons.length === 1 && { flex: 1 }]}
                    onPress={btn.onPress}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dialogBtnText, btn.danger && styles.dialogBtnTextDanger]}>
                      {btn.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: theme.bgPrimary },
  scroll:      { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // ── Header ──
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
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
  upiIconWrap:      { width: 32, height: 32, borderRadius: 8, overflow: 'hidden', marginRight: 2 },

  // Pay via 30/70 split row
  payViaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payViaDropdown: {
    flex: 1,                          // full width when no Other text box
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgSecondary,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  payViaDropdownSplit: {
    flex: 0,
    width: '30%',                     // shrink to 30% when Other is selected
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  payViaDropdownLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  payViaTextInput: {
    flex: 1,                          // takes remaining 70%
    height: 52,
    backgroundColor: theme.bgSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500',
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
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
  categoryPillText:         { fontSize: 12, fontWeight: '600', color: theme.textPrimary },
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
    maxHeight: '80%',
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

  // ── Themed Dialog ──
  dialogOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  dialogBox: {
    width: '100%', backgroundColor: theme.bgCard,
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  dialogTitle:   { fontSize: 17, fontWeight: '700', color: theme.textPrimary, marginBottom: 8, textAlign: 'center' },
  dialogMessage: { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  dialogBtns:    { flexDirection: 'row', gap: 10 },
  dialogBtn: {
    flex: 1, height: 48, borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
  },
  dialogBtnDanger:     { backgroundColor: 'rgba(255,80,80,0.15)', borderWidth: 1, borderColor: 'rgba(255,80,80,0.3)' },
  dialogBtnText:       { fontSize: 15, fontWeight: '700', color: '#1C2128' },
  dialogBtnTextDanger: { color: theme.red },
});

export default AddExpenseScreen;