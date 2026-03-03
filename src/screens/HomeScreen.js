import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { loadData, loadMonthlyIncomeData, saveMonthlyIncome, addBalanceTopUp } from '../utils/storage';
import { getTheme, subscribeToTheme } from '../utils/theme';
import { useFocusEffect } from '@react-navigation/native';



// ─── Ring chart (SVG — accurate at every percentage) ─────────────────────────
const RingChart = ({ progress, size, thickness, trackColor, fillColor, children }) => {
  const p             = Math.min(Math.max(progress, 0), 1);
  const cx            = size / 2;
  const cy            = size / 2;
  const radius        = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled        = p * circumference;
  const gap           = circumference - filled;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Track (full circle, always visible) */}
        <Circle
          cx={cx} cy={cy} r={radius}
          stroke={trackColor}
          strokeWidth={thickness}
          fill="none"
        />
        {/* Fill arc — strokeDasharray as array [filled, gap], rotated to start at top */}
        {p > 0 && (
          <Circle
            cx={cx} cy={cy} r={radius}
            stroke={fillColor}
            strokeWidth={thickness}
            fill="none"
            strokeDasharray={[filled, gap]}
            strokeLinecap="round"
            rotation="-90"
            origin={`${cx}, ${cy}`}
          />
        )}
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center' }]}>
        {children}
      </View>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName]           = useState('User');
  const [data, setData]                   = useState(null);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [carryover, setCarryover]         = useState(0);
  const [showIncome, setShowIncome]       = useState(false);
  const [showBalance, setShowBalance]     = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const [theme, setThemeState]            = useState(getTheme());
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [incomeInput, setIncomeInput]     = useState('');
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [balanceInput, setBalanceInput]   = useState('');
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [onboardName, setOnboardName]     = useState('');
  const [onboardEmail, setOnboardEmail]   = useState('');
  const [onboardNameError, setOnboardNameError] = useState(false);

  useEffect(() => {
    loadAppData();
    loadUserName();
    const unsubscribe = subscribeToTheme(() => setThemeState(getTheme()));
    return unsubscribe;
  }, []);

  useFocusEffect(useCallback(() => { loadAppData(); }, []));

  const loadUserName = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      if (name) {
        setUserName(name);
      } else {
        // First launch — show onboarding dialog
        setOnboardingVisible(true);
      }
    } catch (e) { console.error(e); }
  };

  const saveOnboarding = async () => {
    if (!onboardName.trim()) {
      setOnboardNameError(true);
      return;
    }
    try {
      await AsyncStorage.setItem('userName', onboardName.trim());
      if (onboardEmail.trim()) {
        await AsyncStorage.setItem('userEmail', onboardEmail.trim());
      }
      setUserName(onboardName.trim());
      setOnboardingVisible(false);
    } catch (e) { console.error(e); }
  };

  const loadAppData = async () => {
    const appData = await loadData();
    setData(appData);
    // Load income + carryover using the new storage helper
    const incomeData = await loadMonthlyIncomeData(appData?.expenses ?? []);
    setMonthlyIncome(incomeData.income);
    setCarryover(incomeData.carryover);
  };

  const saveIncome = async (value) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      await saveMonthlyIncome(parsed, data?.expenses ?? []);
      await loadAppData();
    }
    setIncomeModalVisible(false);
  };

  const saveBalanceTopUp = async (value) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      await addBalanceTopUp(parsed);
      await loadAppData();
    }
    setBalanceModalVisible(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppData();
    setRefreshing(false);
  };

  // ── Current-month filter ──
  const thisMonthExpenses = () => {
    if (!data?.expenses) return [];
    const now = new Date();
    return data.expenses.filter(e => {
      if (e.type === 'income') return false;
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  };

  const totalExpense   = () => thisMonthExpenses().reduce((s, e) => s + parseFloat(e.amount), 0);
  // Balance = this month's income + carryover from last month - this month's expenses
  const currentBalance = () => monthlyIncome + carryover - totalExpense();
  // Ring shows how much of (income + carryover) has been spent
  const effectiveIncome = monthlyIncome + carryover;

  // Show last 10 recent expenses — exclude income transactions
  const recentExpenses = () => (data?.expenses ?? []).filter(e => e.type !== 'income').slice(0, 10);

  const topCategories = () => {
    if (!data?.categories) return [];
    const totals = {};
    thisMonthExpenses().forEach(exp => {
      const cat = data.categories.find(c => c.id === exp.categoryId);
      if (cat) {
        totals[cat.name] = totals[cat.name] ?? { name: cat.name, total: 0 };
        totals[cat.name].total += parseFloat(exp.amount);
      }
    });
    return Object.values(totals).sort((a, b) => b.total - a.total).slice(0, 3);
  };

  const fmtAmount = (v) => v >= 1000 ? `₹${(v / 1000).toFixed(1)}K` : `₹${v.toFixed(0)}`;
  const fmtFull   = (v) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Progress: total expense / monthly income (clamped 0–1)
  const ringProgress = effectiveIncome > 0 ? Math.min(totalExpense() / effectiveIncome, 1) : 0;

  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const topCats   = topCategories();
  const dotColors = [theme.red, theme.green, '#888'];
  const recent    = recentExpenses();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ── Non-scrollable container ── */}
      <View style={styles.root}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.greetingLine}>
            Hi, <Text style={styles.greetingName}>{userName}</Text> 👋
          </Text>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Account')} activeOpacity={0.7}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Ring Card ── */}
        <View style={styles.ringCard}>
          <RingChart
            progress={ringProgress}
            size={110}
            thickness={10}
            trackColor={theme.ringTrack}
            fillColor={theme.ringFill}
          >
            <Text style={styles.ringAmount}>{fmtAmount(totalExpense())}</Text>
            <Text style={styles.ringSub}>SPENT</Text>
          </RingChart>

          <View style={styles.ringInfo}>
            <Text style={styles.ringInfoLabel}>THIS MONTH</Text>
            <Text style={styles.ringInfoAmount}>{fmtFull(totalExpense())}</Text>
            {topCats.length > 0 ? (
              <View style={styles.ringMiniStats}>
                {topCats.map((cat, i) => (
                  <View key={cat.name} style={styles.ringMiniRow}>
                    <View style={[styles.ringMiniDot, { backgroundColor: dotColors[i] }]} />
                    <Text style={styles.ringMiniText}>{cat.name}</Text>
                    <Text style={styles.ringMiniVal}>₹{cat.total.toFixed(0)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>No expenses yet</Text>
            )}
          </View>
        </View>

        {/* ── Stat Pills ── */}
        <View style={styles.statRow}>
          <TouchableOpacity
            style={styles.statPill}
            onPress={() => setShowIncome(!showIncome)}
            onLongPress={() => {
              setIncomeInput(monthlyIncome.toString());
              setIncomeModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.statPillLabel}>INCOME <Text style={styles.statPillEdit}>(Hold to edit)</Text></Text>
            <Text style={styles.statPillAmount}>
              {showIncome ? fmtFull(effectiveIncome) : '••••••'}
            </Text>
            {showIncome && carryover > 0 && (
              <Text style={[styles.statPillHint, { color: theme.green }]}>
                +{fmtFull(carryover)} carried over
              </Text>
            )}
            {(!showIncome || carryover === 0) && (
              <Text style={styles.statPillHint}>{showIncome ? 'Tap to hide' : 'Tap to reveal'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statPill}
            onPress={() => setShowBalance(!showBalance)}
            onLongPress={() => {
              setBalanceInput('');
              setBalanceModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.statPillLabel}>BALANCE <Text style={styles.statPillEdit}>(Hold to add)</Text></Text>
            <Text style={[
              styles.statPillAmount,
              showBalance && { color: currentBalance() >= 0 ? theme.green : theme.red },
            ]}>
              {showBalance ? fmtFull(currentBalance()) : '••••••'}
            </Text>
            <Text style={styles.statPillHint}>{showBalance ? 'Tap to hide' : 'Tap to reveal'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Recent Activity card ── */}
        <View style={styles.txCard}>
          <View style={styles.txCardHeader}>
            <Text style={styles.txCardTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')} activeOpacity={0.7}>
              <Text style={styles.txCardSeeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {recent.length > 0 ? (
            <ScrollView
              showsVerticalScrollIndicator={true}
              indicatorStyle="white"
              bounces={false}
            >
              {recent.map((expense, index) => {
                const cat    = data.categories.find(c => c.id === expense.categoryId);
                const isLast = index === recent.length - 1;
                return (
                  <View key={expense.id}>
                    <View style={styles.txRow}>
                      <View style={styles.txIconBox}>
                        <Text style={styles.txIconText}>{cat?.icon ?? '📦'}</Text>
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txName} numberOfLines={1}>{expense.description}</Text>
                        <Text style={styles.txMeta}>
                          {cat?.name ?? 'Other'} · {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                      <Text style={styles.txAmount}>-{fmtAmount(parseFloat(expense.amount))}</Text>
                    </View>
                    {!isLast && <View style={styles.txDivider} />}
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⊘</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySub}>Add your first expense to get started</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Edit Income Modal ── */}
      <Modal
        visible={incomeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIncomeModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setIncomeModalVisible(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Set Monthly Income</Text>
            <Text style={styles.modalSub}>Update your income for this month</Text>
            <View style={styles.modalInputRow}>
              <Text style={styles.modalCurrency}>₹</Text>
              <TextInput
                style={styles.modalInput}
                value={incomeInput}
                onChangeText={setIncomeInput}
                keyboardType="decimal-pad"
                placeholder="Enter amount"
                placeholderTextColor={theme.textMuted}
                autoFocus
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setIncomeModalVisible(false)} activeOpacity={0.7}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={() => saveIncome(incomeInput)} activeOpacity={0.85}>
                <Text style={styles.modalBtnSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add to Balance Modal ── */}
      <Modal
        visible={balanceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBalanceModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setBalanceModalVisible(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add to Balance</Text>
            <Text style={styles.modalSub}>
              Current balance: {fmtFull(currentBalance())}{'\n'}
              Amount will be added on top of existing balance
            </Text>
            <View style={styles.modalInputRow}>
              <Text style={styles.modalCurrency}>₹</Text>
              <TextInput
                style={styles.modalInput}
                value={balanceInput}
                onChangeText={setBalanceInput}
                keyboardType="decimal-pad"
                placeholder="Enter amount to add"
                placeholderTextColor={theme.textMuted}
                autoFocus
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setBalanceModalVisible(false)} activeOpacity={0.7}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={() => saveBalanceTopUp(balanceInput)} activeOpacity={0.85}>
                <Text style={styles.modalBtnSaveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* ── First Launch Onboarding Modal ── */}
      <Modal
        visible={onboardingVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {}}   // prevent back-button dismiss
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.onboardCard}>

            {/* Header */}
            <View style={styles.onboardHeader}>
              <Text style={styles.onboardEmoji}>👋</Text>
              <Text style={styles.onboardTitle}>Welcome!</Text>
              <Text style={styles.onboardSub}>
                Let's set up your profile to get started. Your name helps personalise the app.
              </Text>
            </View>

            {/* Name input */}
            <View style={styles.onboardFieldWrap}>
              <Text style={styles.onboardLabel}>YOUR NAME <Text style={{ color: theme.red }}>*</Text></Text>
              <View style={[styles.onboardInput, onboardNameError && styles.onboardInputError]}>
                <Text style={styles.onboardInputIcon}>😊</Text>
                <TextInput
                  style={styles.onboardInputText}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textMuted}
                  value={onboardName}
                  onChangeText={v => { setOnboardName(v); setOnboardNameError(false); }}
                  autoFocus
                  returnKeyType="next"
                />
              </View>
              {onboardNameError && (
                <Text style={styles.onboardError}>Name is required to continue</Text>
              )}
            </View>

            {/* Email input */}
            <View style={styles.onboardFieldWrap}>
              <Text style={styles.onboardLabel}>EMAIL <Text style={styles.onboardOptional}>(optional)</Text></Text>
              <View style={styles.onboardInput}>
                <Text style={styles.onboardInputIcon}>✉️</Text>
                <TextInput
                  style={styles.onboardInputText}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.textMuted}
                  value={onboardEmail}
                  onChangeText={setOnboardEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={saveOnboarding}
                />
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={styles.onboardBtn}
              onPress={saveOnboarding}
              activeOpacity={0.85}
            >
              <Text style={styles.onboardBtnText}>Get Started →</Text>
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  safeArea:         { flex: 1, backgroundColor: theme.bgPrimary },
  root:             { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:      { fontSize: 15, color: theme.textPrimary, fontWeight: '600' },

  // ── Header ──
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16,
  },
  greetingLine: { fontSize: 22, fontWeight: '500', color: theme.textPrimary },
  greetingName: { fontSize: 22, fontWeight: '700', color: theme.textPrimary },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: theme.bgElevated,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },

  // ── Ring Card ──
  ringCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 14,
    backgroundColor: theme.bgSecondary,
    borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 20,
  },
  ringAmount:     { fontSize: 15, fontWeight: '700', color: theme.textPrimary, letterSpacing: -0.5 },
  ringSub:        { fontSize: 9, color: theme.textPrimary, marginTop: 2, letterSpacing: 1, opacity: 0.6 },
  ringInfo:       { flex: 1 },
  ringInfoLabel:  { fontSize: 10, fontWeight: '600', color: theme.textPrimary, opacity: 0.6, letterSpacing: 1, marginBottom: 6 },
  ringInfoAmount: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, letterSpacing: -0.5, marginBottom: 12 },
  ringMiniStats:  { gap: 6 },
  ringMiniRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ringMiniDot:    { width: 6, height: 6, borderRadius: 3 },
  ringMiniText:   { flex: 1, fontSize: 11, color: theme.textPrimary, opacity: 0.75 },
  ringMiniVal:    { fontSize: 11, fontWeight: '600', color: theme.textPrimary },
  noDataText:     { fontSize: 12, color: theme.textPrimary, opacity: 0.5, fontStyle: 'italic' },

  // ── Stat Pills ──
  statRow:  { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  statPill: {
    flex: 1, backgroundColor: theme.bgSecondary,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20, padding: 16,
  },
  statPillLabel:  { fontSize: 9, fontWeight: '600', color: theme.textPrimary, opacity: 0.6, letterSpacing: 1, marginBottom: 8 },
  statPillAmount: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, letterSpacing: -0.3, marginBottom: 4 },
  statPillHint:   { fontSize: 9, color: theme.textPrimary, opacity: 0.45 },
  statPillEdit:   { fontSize: 8, fontWeight: '400', color: theme.green, letterSpacing: 0, opacity: 1 },

  // ── Transaction card ──
  txCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    flex: 1,
    backgroundColor: theme.bgSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  txCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  txCardTitle:  { fontSize: 13, fontWeight: '600', color: theme.textPrimary, opacity: 0.7 },
  txCardSeeAll: { fontSize: 13, fontWeight: '600', color: theme.green },
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  txIconBox: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#1C2841',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  txIconText: { fontSize: 22, lineHeight: 30 },
  txInfo:     { flex: 1 },
  txName:     { fontSize: 14, fontWeight: '600', color: theme.textPrimary, marginBottom: 3 },
  txMeta:     { fontSize: 11, color: theme.textPrimary, opacity: 0.55 },
  txAmount:   { fontSize: 13, fontWeight: '700', color: theme.red, flexShrink: 0 },
  txDivider:  { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: 74, marginRight: 16 },

  // ── Empty ──
  emptyState: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 24 },
  emptyIcon:  { fontSize: 28, marginBottom: 8, color: theme.textPrimary, opacity: 0.3 },
  emptyText:  { fontSize: 14, fontWeight: '600', color: theme.textPrimary, marginBottom: 4 },
  emptySub:   { fontSize: 11, color: theme.textPrimary, opacity: 0.5, textAlign: 'center', lineHeight: 16 },

  // ── Income modal ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalSheet: {
    width: '100%', backgroundColor: theme.bgCard,
    borderRadius: 24, padding: 24,
  },
  modalTitle:    { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 },
  modalSub:      { fontSize: 13, color: theme.textPrimary, opacity: 0.55, marginBottom: 20 },
  modalInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.bgSecondary,
    borderRadius: 14, paddingHorizontal: 16, height: 54,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  modalCurrency: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, marginRight: 8 },
  modalInput:    { flex: 1, fontSize: 22, fontWeight: '700', color: theme.textPrimary, padding: 0 },
  modalBtns:     { flexDirection: 'row', gap: 10 },
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

  // ── Onboarding modal ──
  onboardCard: {
    width: '100%', backgroundColor: theme.bgCard,
    borderRadius: 28, padding: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  onboardHeader:  { alignItems: 'center', marginBottom: 28 },
  onboardEmoji:   { fontSize: 48, marginBottom: 12 },
  onboardTitle:   { fontSize: 26, fontWeight: '800', color: theme.textPrimary, marginBottom: 8, letterSpacing: -0.5 },
  onboardSub:     { fontSize: 13, color: theme.textMuted, textAlign: 'center', lineHeight: 19 },
  onboardFieldWrap: { marginBottom: 16 },
  onboardLabel:   { fontSize: 10, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.8, marginBottom: 8 },
  onboardOptional:{ fontSize: 10, fontWeight: '400', color: theme.textMuted, opacity: 0.6 },
  onboardInput: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.bgSecondary,
    borderRadius: 14, paddingHorizontal: 14, height: 52,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  onboardInputError: { borderColor: theme.red },
  onboardInputIcon:  { fontSize: 16, marginRight: 10 },
  onboardInputText:  { flex: 1, fontSize: 15, fontWeight: '500', color: theme.textPrimary, padding: 0 },
  onboardError:   { fontSize: 11, color: theme.red, marginTop: 6, marginLeft: 4 },
  onboardBtn: {
    height: 54, borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 8,
  },
  onboardBtnText: { fontSize: 16, fontWeight: '800', color: '#1C2128', letterSpacing: -0.3 },
});

export default HomeScreen;