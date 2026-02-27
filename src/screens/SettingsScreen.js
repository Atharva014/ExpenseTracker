import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, getCurrentTheme, setTheme, subscribeToTheme } from '../utils/theme';

// ─── Icons ─────────────────────────────────────────────────────────────────────
const ChevronIcon = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M9 6 L15 12 L9 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDownIcon = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9 L12 15 L18 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CardIcon = ({ color }) => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth={2} />
    <Line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth={2} />
  </Svg>
);

const BankIcon = ({ color }) => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M3 21 L21 21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M3 10 L12 3 L21 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="5" y1="10" x2="5" y2="21" stroke={color} strokeWidth={2} />
    <Line x1="9" y1="10" x2="9" y2="21" stroke={color} strokeWidth={2} />
    <Line x1="15" y1="10" x2="15" y2="21" stroke={color} strokeWidth={2} />
    <Line x1="19" y1="10" x2="19" y2="21" stroke={color} strokeWidth={2} />
  </Svg>
);

const PlusIcon = ({ color }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

const SettingsScreen = () => {
  const [isDarkMode, setIsDarkMode]           = useState(getCurrentTheme() === 'dark');
  const [theme, setThemeState]                = useState(getTheme());
  const [userName, setUserName]               = useState('Atharva');
  const [userEmail, setUserEmail]             = useState('user@example.com');
  const [showEditModal, setShowEditModal]     = useState(false);
  const [tempName, setTempName]               = useState('');
  const [tempEmail, setTempEmail]             = useState('');
  const [paymentMethodsExpanded, setPaymentMethodsExpanded] = useState(false);
  const [paymentMethods, setPaymentMethods]   = useState([]);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [addType, setAddType]                 = useState('card');
  const [newMethodName, setNewMethodName]     = useState('');
  const [newMethodNumber, setNewMethodNumber] = useState('');

  // ── Themed dialog ──
  const [dialog, setDialog] = useState(null);
  const showDialog = (title, message, buttons) => setDialog({ title, message, buttons });
  const closeDialog = () => setDialog(null);

  useEffect(() => {
    loadUserData();
    loadPaymentMethods();
    setIsDarkMode(getCurrentTheme() === 'dark');
    const unsubscribe = subscribeToTheme((newTheme) => {
      setIsDarkMode(newTheme === 'dark');
      setThemeState(getTheme());
    });
    return unsubscribe;
  }, []);

  const loadUserData = async () => {
    try {
      const name  = await AsyncStorage.getItem('userName');
      const email = await AsyncStorage.getItem('userEmail');
      if (name) setUserName(name);
      if (email) setUserEmail(email);
    } catch (error) { console.error('Error loading user data:', error); }
  };

  const loadPaymentMethods = async () => {
    try {
      const { loadData } = await import('../utils/storage');
      const data = await loadData();
      setPaymentMethods(data.paymentMethods ?? []);
    } catch (error) { console.error('Error loading payment methods:', error); }
  };

  const handleAddMethod = async () => {
    if (!newMethodName.trim()) {
      showDialog('Missing Name', 'Please enter a name for this payment method.', [
        { label: 'OK', onPress: closeDialog },
      ]);
      return;
    }
    try {
      const { loadData, saveData } = await import('../utils/storage');
      const data = await loadData();
      const newMethod = {
        id: `pm_${Date.now()}`,
        name: newMethodName.trim(),
        type: addType,
        icon: addType === 'card' ? '💳' : '🏦',
        number: newMethodNumber.trim() || '*',
      };
      await saveData({ ...data, paymentMethods: [...(data.paymentMethods ?? []), newMethod] });
      setShowAddModal(false);
      setNewMethodName('');
      setNewMethodNumber('');
      loadPaymentMethods();
      showDialog('Added!', `${addType === 'card' ? 'Card' : 'Bank account'} added successfully.`, [
        { label: 'OK', onPress: closeDialog },
      ]);
    } catch (error) {
      showDialog('Error', 'Failed to add payment method.', [
        { label: 'OK', onPress: closeDialog },
      ]);
    }
  };

  const handleDeleteMethod = (method) => {
    showDialog(
      'Remove Payment Method',
      `Remove "${method.name}" from your payment methods? This cannot be undone.`,
      [
        { label: 'Cancel', onPress: closeDialog },
        {
          label: 'Remove',
          danger: true,
          onPress: async () => {
            closeDialog();
            try {
              const { loadData, saveData } = await import('../utils/storage');
              const data = await loadData();
              await saveData({ ...data, paymentMethods: (data.paymentMethods ?? []).filter(m => m.id !== method.id) });
              loadPaymentMethods();
            } catch (e) {
              showDialog('Error', 'Failed to remove payment method.', [{ label: 'OK', onPress: closeDialog }]);
            }
          },
        },
      ]
    );
  };

  const openAddModal = (type) => {
    setAddType(type);
    setNewMethodName('');
    setNewMethodNumber('');
    setShowAddModal(true);
  };

  const saveUserData = async () => {
    try {
      await AsyncStorage.setItem('userName', tempName);
      await AsyncStorage.setItem('userEmail', tempEmail);
      setUserName(tempName);
      setUserEmail(tempEmail);
      setShowEditModal(false);
      showDialog('Profile Updated', 'Your profile has been saved successfully.', [
        { label: 'OK', onPress: closeDialog },
      ]);
    } catch (error) {
      showDialog('Error', 'Failed to update profile.', [
        { label: 'OK', onPress: closeDialog },
      ]);
    }
  };

  const openEditModal = () => {
    setTempName(userName);
    setTempEmail(userEmail);
    setShowEditModal(true);
  };

  const toggleTheme = (value) => {
    setIsDarkMode(value);
    setTheme(value ? 'dark' : 'light');
  };

  const handleClearData = () => {
    showDialog(
      'Clear All Data',
      'This will permanently delete all your transactions. Categories and payment methods will be kept. This cannot be undone.',
      [
        { label: 'Cancel', onPress: closeDialog },
        {
          label: 'Clear Data',
          danger: true,
          onPress: async () => {
            closeDialog();
            try {
              const { loadData, saveData } = await import('../utils/storage');
              const data = await loadData();
              await saveData({ ...data, expenses: [] });
              showDialog('Done', 'All transaction data has been cleared.', [
                { label: 'OK', onPress: closeDialog },
              ]);
            } catch (e) {
              showDialog('Error', 'Failed to clear data.', [
                { label: 'OK', onPress: closeDialog },
              ]);
            }
          },
        },
      ]
    );
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  const sections = [
    {
      title: 'YOUR ACCOUNT',
      items: [
        { icon: '👤', label: 'My Profile', subtitle: userName, onPress: openEditModal },
        {
          icon: '💳',
          label: 'Payment Methods',
          subtitle: 'Manage banks and cards',
          isExpandable: true,
          expanded: paymentMethodsExpanded,
          onPress: () => setPaymentMethodsExpanded(!paymentMethodsExpanded),
        },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        { icon: '🌙', label: 'Dark Mode', isSwitch: true, value: isDarkMode, onToggle: toggleTheme },
        { icon: '🌐', label: 'Language', subtitle: 'English', onPress: () => {} },
      ],
    },
    {
      title: 'ABOUT',
      items: [
        { icon: '📄', label: 'Terms & Privacy Policy', onPress: () => {} },
        { icon: 'ℹ️', label: 'Version', rightText: '1.0.0' },
      ],
    },
    {
      title: 'DANGER ZONE',
      isDanger: true,
      items: [
        { icon: '🗑️', label: 'Clear All Data', subtitle: 'Remove all recorded expenses', onPress: handleClearData, isDanger: true },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ── Header — consistent font across all screens ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account & Settings</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={[styles.sectionTitle, section.isDanger && styles.sectionTitleDanger]}>
              {section.title}
            </Text>
            {section.items.map((item, iIdx) => (
              <View key={iIdx}>
                <View style={[
                  styles.menuItem,
                  item.isDanger && styles.menuItemDanger,
                  item.isExpandable && item.expanded && styles.menuItemExpanded,
                ]}>
                  <TouchableOpacity
                    style={styles.menuItemClickable}
                    onPress={item.onPress}
                    activeOpacity={item.isSwitch ? 1 : 0.7}
                    disabled={!item.onPress && !item.isSwitch}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[styles.iconBox, item.isDanger && styles.iconBoxDanger]}>
                        <Text style={styles.menuItemIcon}>{item.icon}</Text>
                      </View>
                      <View style={styles.menuItemTextWrap}>
                        <Text style={[styles.menuItemText, item.isDanger && styles.menuItemTextDanger]}>
                          {item.label}
                        </Text>
                        {item.subtitle && (
                          <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.menuItemRight}>
                      {item.badge && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                      {item.rightText && (
                        <Text style={styles.rightText}>{item.rightText}</Text>
                      )}
                      {item.isSwitch ? (
                        <Switch
                          value={item.value}
                          onValueChange={item.onToggle}
                          trackColor={{ false: theme.bgElevated, true: theme.green }}
                          thumbColor={'#FFFFFF'}
                          style={{ marginLeft: 8 }}
                        />
                      ) : item.isExpandable ? (
                        item.expanded
                          ? <ChevronDownIcon color={theme.textMuted} />
                          : <ChevronIcon color={theme.textMuted} />
                      ) : item.onPress ? (
                        <ChevronIcon color={theme.textMuted} />
                      ) : null}
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Payment Methods */}
                  {item.isExpandable && item.expanded && (
                    <View style={styles.expandedSection}>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.cardsScrollContent}
                      >
                        {paymentMethods
                          .filter(m => m.name?.toLowerCase() !== 'cash' && m.type !== 'cash' && m.id !== 'cash')
                          .map((method) => {
                          const isCard    = method.type === 'card';
                          const cardColor = isCard ? '#EF4444' : '#4A90E2';
                          return (
                            <View key={method.id} style={[styles.paymentCard, { backgroundColor: cardColor }]}>
                              {/* Delete button top-right */}
                              <View style={styles.cardHeader}>
                                <TouchableOpacity
                                  onPress={() => handleDeleteMethod(method)}
                                  activeOpacity={0.7}
                                  style={styles.cardDeleteBtn}
                                >
                                  <Text style={styles.cardDeleteIcon}>×</Text>
                                </TouchableOpacity>
                              </View>
                              <View style={styles.cardBody}>
                                <Text style={styles.cardIcon}>{method.icon ?? (isCard ? '💳' : '🏦')}</Text>
                                <Text style={styles.cardName}>{method.name}</Text>
                                <Text style={styles.cardNumber}>
                                  {method.number === '*' ? '••••' : `•••• ${String(method.number ?? '').slice(-4)}`}
                                </Text>
                              </View>
                            </View>
                          );
                        })}

                        <TouchableOpacity style={styles.addCard} onPress={() => openAddModal('card')} activeOpacity={0.7}>
                          <View style={styles.addCardIconBox}><PlusIcon color={theme.green} /></View>
                          <CardIcon color={theme.textPrimary} />
                          <Text style={styles.addCardText}>Add Card</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.addCard} onPress={() => openAddModal('bank')} activeOpacity={0.7}>
                          <View style={styles.addCardIconBox}><PlusIcon color={theme.green} /></View>
                          <BankIcon color={theme.textPrimary} />
                          <Text style={styles.addCardText}>Add Bank</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput style={styles.input} value={tempName} onChangeText={setTempName} placeholder="Enter your name" placeholderTextColor={theme.textMuted} />
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput style={styles.input} value={tempEmail} onChangeText={setTempEmail} placeholder="Enter your email" placeholderTextColor={theme.textMuted} keyboardType="email-address" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowEditModal(false)} activeOpacity={0.7}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={saveUserData} activeOpacity={0.85}>
                <Text style={styles.modalBtnSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add Payment Method Modal ── */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add {addType === 'card' ? 'Credit Card' : 'Bank Account'}</Text>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput style={styles.input} value={newMethodName} onChangeText={setNewMethodName} placeholder={addType === 'card' ? 'e.g., HDFC Credit Card' : 'e.g., ICICI Bank'} placeholderTextColor={theme.textMuted} />
            <Text style={styles.inputLabel}>{addType === 'card' ? 'Last 4 digits (Optional)' : 'Account Number (Optional)'}</Text>
            <TextInput style={styles.input} value={newMethodNumber} onChangeText={setNewMethodNumber} placeholder={addType === 'card' ? 'XXXX' : 'XXXXXXXXXX'} placeholderTextColor={theme.textMuted} keyboardType="number-pad" maxLength={addType === 'card' ? 4 : 10} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowAddModal(false)} activeOpacity={0.7}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={handleAddMethod} activeOpacity={0.85}>
                <Text style={styles.modalBtnSaveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  safeArea:      { flex: 1, backgroundColor: theme.bgPrimary },
  container:     { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  // ── Header — consistent font across all screens ──
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },

  // ── Section ──
  section:      { marginBottom: 4, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: theme.textMuted,
    letterSpacing: 0.5, marginBottom: 8, opacity: 0.7, marginTop: 12,
  },

  sectionTitleDanger: { color: theme.red, opacity: 1 },

  // ── Menu Item ──
  menuItem: {
    backgroundColor: theme.bgSecondary,
    borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  menuItemDanger:     { borderColor: 'rgba(255,80,80,0.2)', backgroundColor: 'rgba(255,80,80,0.06)' },
  iconBoxDanger:      { backgroundColor: 'rgba(255,80,80,0.12)' },
  menuItemTextDanger: { color: theme.red },
  menuItemExpanded: { paddingBottom: 12 },
  menuItemClickable: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 12,
  },
  menuItemLeft:     { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: theme.bgElevated,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  menuItemIcon:     { fontSize: 18 },
  menuItemTextWrap: { flex: 1 },
  menuItemText:     { fontSize: 15, fontWeight: '500', color: theme.textPrimary, marginBottom: 2 },
  menuItemSubtitle: { fontSize: 12, color: theme.textMuted, opacity: 0.7 },
  menuItemRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    backgroundColor: theme.green, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  rightText: { fontSize: 13, color: theme.textMuted },

  // ── Expanded Payment Methods ──
  expandedSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  cardsScrollContent: { paddingHorizontal: 12, gap: 10 },
  paymentCard: {
    width: 110, height: 98, borderRadius: 14,
    padding: 10, justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
  },
  cardHeader:    { alignItems: 'flex-end' },
  cardDeleteBtn: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  cardDeleteIcon: { fontSize: 16, color: '#FFFFFF', lineHeight: 20, fontWeight: '700' },
  cardBody:    { flex: 1, justifyContent: 'flex-end' },
  cardIcon:    { fontSize: 18, marginBottom: 4 },
  cardName:    { fontSize: 11, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  cardNumber:  { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.85)' },
  addCard: {
    width: 110, height: 98, borderRadius: 14,
    backgroundColor: theme.bgElevated,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  addCardIconBox: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(78,205,196,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  addCardText: { fontSize: 11, fontWeight: '600', color: theme.textPrimary, textAlign: 'center' },

  // ── Logout ──
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 8, marginBottom: 20,
    padding: 16, borderRadius: 12,
    borderWidth: 1.5, borderColor: theme.red,
  },
  logoutIcon: { fontSize: 18, marginRight: 8 },
  logoutText: { fontSize: 15, fontWeight: '600', color: theme.red },

  // ── Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContent: {
    width: '100%', backgroundColor: theme.bgCard,
    borderRadius: 24, padding: 24,
  },
  modalTitle:         { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 20, textAlign: 'center' },
  inputLabel:         { fontSize: 12, fontWeight: '600', color: theme.textPrimary, marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, padding: 14,
    fontSize: 15, color: theme.textPrimary,
    backgroundColor: theme.bgSecondary,
  },
  modalButtons:       { flexDirection: 'row', marginTop: 20, gap: 10 },
  modalBtnCancel: {
    flex: 1, height: 48, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBtnCancelText: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, opacity: 0.7 },
  modalBtnSave: {
    flex: 1, height: 48, borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBtnSaveText: { fontSize: 15, fontWeight: '700', color: '#1C2128' },

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
  dialogTitle:         { fontSize: 17, fontWeight: '700', color: theme.textPrimary, marginBottom: 8, textAlign: 'center' },
  dialogMessage:       { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  dialogBtns:          { flexDirection: 'row', gap: 10 },
  dialogBtn:           { flex: 1, height: 48, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  dialogBtnDanger:     { backgroundColor: 'rgba(255,80,80,0.15)', borderWidth: 1, borderColor: 'rgba(255,80,80,0.3)' },
  dialogBtnText:       { fontSize: 15, fontWeight: '700', color: '#1C2128' },
  dialogBtnTextDanger: { color: theme.red },
});

export default SettingsScreen;