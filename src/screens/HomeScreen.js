import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadData } from '../utils/storage';
import { getTheme, subscribeToTheme } from '../utils/theme';
import { useFocusEffect } from '@react-navigation/native';

const RING_SIZE = 110;
const RING_THICKNESS = 10;

// ─── Pure View ring chart ─────────────────────────────────────────────────────
const RingChart = ({ progress, size, thickness, trackColor, fillColor, children }) => {
  const p        = Math.min(Math.max(progress, 0), 1);
  const deg      = p * 360;
  const half     = size / 2;
  const rightDeg = Math.min(deg, 180);
  const leftDeg  = Math.max(deg - 180, 0);

  const disc = (color, rotate, extra = {}) => ({
    position: 'absolute',
    width: size, height: size,
    borderRadius: half,
    borderWidth: thickness,
    borderColor: color,
    transform: [{ rotate: `${rotate}deg` }],
    ...extra,
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
  const [userName, setUserName]       = useState('User');
  const [data, setData]               = useState(null);
  const [showIncome, setShowIncome]   = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [theme, setThemeState]        = useState(getTheme());

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
      if (name) setUserName(name);
    } catch (e) { console.error(e); }
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
  const totalIncome    = () => 65000;
  const currentBalance = () => totalIncome() - totalExpense();
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

  const fmtAmount = (v) =>
    v >= 1000 ? `₹${(v / 1000).toFixed(1)}K` : `₹${v.toFixed(0)}`;

  const styles    = createStyles(theme);
  const topCats   = topCategories();
  const dotColors = [theme.red, theme.green, '#888'];
  const recent    = recentExpenses();

  if (!data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.textSecondary} />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.greetingLine}>
            Hi, <Text style={styles.greetingName}>{userName}</Text> 👋
          </Text>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Account')}
            activeOpacity={0.7}
          >
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Ring Card ── */}
        <View style={styles.ringCard}>
          <RingChart
            progress={Math.min(totalExpense() / totalIncome(), 1)}
            size={RING_SIZE}
            thickness={RING_THICKNESS}
            trackColor={theme.ringTrack}
            fillColor={theme.ringFill}
          >
            <Text style={styles.ringAmount}>{fmtAmount(totalExpense())}</Text>
            <Text style={styles.ringSub}>of {fmtAmount(totalIncome())}</Text>
          </RingChart>

          <View style={styles.ringInfo}>
            <Text style={styles.ringInfoLabel}>TOTAL EXPENSE</Text>
            <Text style={styles.ringInfoAmount}>₹{totalExpense().toFixed(2)}</Text>
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
          <TouchableOpacity style={styles.statPill} onPress={() => setShowIncome(!showIncome)} activeOpacity={0.7}>
            <Text style={styles.statPillIcon}>○</Text>
            <Text style={styles.statPillLabel}>INCOME</Text>
            <Text style={styles.statPillAmount}>
              {showIncome ? `₹${totalIncome().toLocaleString()}` : '••••••'}
            </Text>
            <Text style={styles.statPillHint}>Tap to {showIncome ? 'hide' : 'reveal'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statPill} onPress={() => setShowBalance(!showBalance)} activeOpacity={0.7}>
            <Text style={styles.statPillIcon}>◈</Text>
            <Text style={styles.statPillLabel}>BALANCE</Text>
            <Text style={styles.statPillAmount}>
              {showBalance ? `₹${currentBalance().toLocaleString()}` : '••••••'}
            </Text>
            <Text style={styles.statPillHint}>Tap to {showBalance ? 'hide' : 'reveal'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Recent Activity card — header INSIDE the card ── */}
        <View style={styles.txCard}>

          {/* Header row inside the card */}
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
                      {/* Icon */}
                      <View style={styles.txIconBox}>
                        <Text style={styles.txIconText}>{cat?.icon ?? '📦'}</Text>
                      </View>

                      {/* Name + meta */}
                      <View style={styles.txInfo}>
                        <Text style={styles.txName} numberOfLines={1}>
                          {expense.description}
                        </Text>
                        <Text style={styles.txMeta}>
                          {cat?.name ?? 'Other'} · {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>

                      {/* Amount */}
                      <Text style={styles.txAmount}>
                        -{fmtAmount(parseFloat(expense.amount))}
                      </Text>
                    </View>

                    {/* Divider — not after last */}
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
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  safeArea:         { flex: 1, backgroundColor: theme.bgPrimary },
  container:        { flex: 1, backgroundColor: theme.bgPrimary },
  scrollContent:    { paddingBottom: 120 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:      { fontSize: 16, color: theme.textSecondary },

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
    borderWidth: 1, borderColor: theme.border,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },

  // ── Ring Card ──
  ringCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 14,
    backgroundColor: theme.bgSecondary,
    borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: theme.border, gap: 20,
  },
  ringAmount:     { fontSize: 15, fontWeight: '700', color: theme.textPrimary, letterSpacing: -0.5 },
  ringSub:        { fontSize: 9, color: theme.textPrimary, marginTop: 2, letterSpacing: 0.5, opacity: 0.7 },
  ringInfo:       { flex: 1 },
  ringInfoLabel:  { fontSize: 10, fontWeight: '600', color: theme.textPrimary, letterSpacing: 1, marginBottom: 6, opacity: 0.7 },
  ringInfoAmount: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, letterSpacing: -0.5, marginBottom: 12 },
  ringMiniStats:  { gap: 6 },
  ringMiniRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ringMiniDot:    { width: 6, height: 6, borderRadius: 3 },
  ringMiniText:   { flex: 1, fontSize: 11, color: theme.textPrimary, opacity: 0.75 },
  ringMiniVal:    { fontSize: 11, fontWeight: '600', color: theme.textPrimary },
  noDataText:     { fontSize: 12, color: theme.textPrimary, fontStyle: 'italic', opacity: 0.5 },

  // ── Stat Pills ──
  statRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  statPill: {
    flex: 1, backgroundColor: theme.bgSecondary,
    borderWidth: 1, borderColor: theme.border,
    borderRadius: 20, padding: 16,
  },
  statPillIcon:   { fontSize: 16, marginBottom: 8, color: theme.textPrimary, opacity: 0.6 },
  statPillLabel:  { fontSize: 9, fontWeight: '600', color: theme.textPrimary, letterSpacing: 1, marginBottom: 6, opacity: 0.6 },
  statPillAmount: { fontSize: 16, fontWeight: '700', color: theme.textPrimary, letterSpacing: -0.3, marginBottom: 4 },
  statPillHint:   { fontSize: 9, color: theme.textPrimary, opacity: 0.5 },

  // ── Transaction card (whole block) ──
  txCard: {
    marginHorizontal: 20,
    backgroundColor: theme.bgSecondary,
    borderRadius: 24,                 // large rounded corners like reference
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },

  // Header row inside the card
  txCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  txCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textPrimary,
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  txCardSeeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.green,
  },

  // Each row
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  txIconBox: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: theme.bgElevated,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  txIconText: { fontSize: 19 },
  txInfo:     { flex: 1 },
  txName: {
    fontSize: 14, fontWeight: '600',
    color: theme.textPrimary, marginBottom: 3,
  },
  txMeta: { fontSize: 11, color: theme.textPrimary, opacity: 0.55 },
  txAmount: {
    fontSize: 13, fontWeight: '700',
    color: theme.red, flexShrink: 0,
  },

  // Divider starts after the icon (68 = 16 padding + 40 icon + 12 gap)
  txDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.border,
    marginLeft: 68,
    marginRight: 16,
  },

  // ── Empty ──
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon:  { fontSize: 32, marginBottom: 12, color: theme.textMuted },
  emptyText:  { fontSize: 15, fontWeight: '600', color: theme.textPrimary, marginBottom: 4 },
  emptySub:   { fontSize: 12, color: theme.textMuted, textAlign: 'center', lineHeight: 18 },
});

export default HomeScreen;