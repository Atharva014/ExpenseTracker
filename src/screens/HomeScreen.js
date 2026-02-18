import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadData } from '../utils/storage';
import { getTheme, subscribeToTheme } from '../utils/theme';
import { useFocusEffect } from '@react-navigation/native';

const INCOME_KEY = 'monthlyIncome';
const RING_SIZE  = 110;
const RING_THICK = 10;

// ─── Ring chart (pure View) ───────────────────────────────────────────────────
const RingChart = ({ progress, size, thickness, trackColor, fillColor, children }) => {
  const p        = Math.min(Math.max(progress, 0), 1);
  const deg      = p * 360;
  const half     = size / 2;
  const rightDeg = Math.min(deg, 180);
  const leftDeg  = Math.max(deg - 180, 0);

  const disc = (color, rotate, extra = {}) => ({
    position: 'absolute', width: size, height: size,
    borderRadius: half, borderWidth: thickness, borderColor: color,
    transform: [{ rotate: `${rotate}deg` }], ...extra,
  });

  return (
    <View style={{ width: size, height: size }}>
      <View style={disc(trackColor, 0)} />
      <View style={{ position: 'absolute', width: half, height: size, overflow: 'hidden', left: half }}>
        <View style={disc(rightDeg > 0 ? fillColor : 'transparent', rightDeg - 180, { left: -half })} />
      </View>
      <View style={{ position: 'absolute', width: half, height: size, overflow: 'hidden', left: 0 }}>
        <View style={disc(leftDeg > 0 ? fillColor : 'transparent', leftDeg)} />
      </View>
      <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center' }]}>
        {children}
      </View>
    </View>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName]         = useState('User');
  const [data, setData]                 = useState(null);
  const [monthlyIncome, setMonthlyIncome] = useState(65000);
  const [showIncome, setShowIncome]     = useState(false);
  const [showBalance, setShowBalance]   = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [theme, setThemeState]          = useState(getTheme());

  // Income edit modal
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [incomeInput, setIncomeInput]               = useState('');

  useEffect(() => {
    loadAppData();
    loadUserName();
    loadIncome();
    const unsubscribe = subscribeToTheme(() => setThemeState(getTheme()));
    return unsubscribe;
  }, []);

  useFocusEffect(useCallback(() => { loadAppData(); }, []));

  const loadUserName = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      if (name) setUserName(name);
    } catch (e) { console.error(e); }
  };

  const loadIncome = async () => {
    try {
      const saved = await AsyncStorage.getItem(INCOME_KEY);
      if (saved) setMonthlyIncome(parseFloat(saved));
    } catch (e) { console.error(e); }
  };

  const saveIncome = async (value) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      setMonthlyIncome(parsed);
      await AsyncStorage.setItem(INCOME_KEY, parsed.toString());
    }
    setIncomeModalVisible(false);
  };

  const loadAppData = async () => {
    const appData = await loadData();
    setData(appData);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppData();
    setRefreshing(false);
  };

  const totalExpense   = () => !data?.expenses ? 0 : data.expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const currentBalance = () => monthlyIncome - totalExpense();
  const recentExpenses = () => data?.expenses?.slice(0, 5) ?? [];

  const topCategories = () => {
    if (!data?.expenses || !data?.categories) return [];
    const totals = {};
    data.expenses.forEach(exp => {
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

  // useMemo keeps styles stable and ensures no hook-order issues
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.textPrimary} />}
      >
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
            progress={Math.min(totalExpense() / monthlyIncome, 1)}
            size={RING_SIZE} thickness={RING_THICK}
            trackColor={theme.ringTrack} fillColor={theme.ringFill}
          >
            <Text style={styles.ringAmount}>{fmtAmount(totalExpense())}</Text>
            <Text style={styles.ringSub}>SPENT</Text>
          </RingChart>

          <View style={styles.ringInfo}>
            <Text style={styles.ringInfoLabel}>TOTAL EXPENSE</Text>
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

          {/* Income — tap to reveal, long press to edit */}
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
              {showIncome ? fmtFull(monthlyIncome) : '••••••'}
            </Text>
            <Text style={styles.statPillHint}>
              {showIncome ? 'Tap to hide' : 'Tap to reveal'}
            </Text>
          </TouchableOpacity>

          {/* Balance */}
          <TouchableOpacity
            style={styles.statPill}
            onPress={() => setShowBalance(!showBalance)}
            activeOpacity={0.7}
          >
            <Text style={styles.statPillLabel}>BALANCE</Text>
            <Text style={[
              styles.statPillAmount,
              showBalance && { color: currentBalance() >= 0 ? theme.green : theme.red },
            ]}>
              {showBalance ? fmtFull(currentBalance()) : '••••••'}
            </Text>
            <Text style={styles.statPillHint}>
              {showBalance ? 'Tap to hide' : 'Tap to reveal'}
            </Text>
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
            <>
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
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⊘</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySub}>Add your first expense to get started</Text>
            </View>
          )}
        </View>
      </ScrollView>

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
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setIncomeModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnSave}
                onPress={() => saveIncome(incomeInput)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalBtnSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  safeArea:         { flex: 1, backgroundColor: theme.bgPrimary },
  container:        { flex: 1, backgroundColor: theme.bgPrimary },
  scrollContent:    { paddingBottom: 120 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:      { fontSize: 16, color: theme.textPrimary },

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

  // ── Stat Pills — no icons ──
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
    backgroundColor: theme.bgSecondary,
    borderRadius: 24,
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
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon:  { fontSize: 32, marginBottom: 12, color: theme.textPrimary, opacity: 0.3 },
  emptyText:  { fontSize: 15, fontWeight: '600', color: theme.textPrimary, marginBottom: 4 },
  emptySub:   { fontSize: 12, color: theme.textPrimary, opacity: 0.5, textAlign: 'center', lineHeight: 18 },

  // ── Income edit modal ──
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
});

export default HomeScreen;