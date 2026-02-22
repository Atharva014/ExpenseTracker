import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadData } from '../utils/storage';
import { getTheme, subscribeToTheme } from '../utils/theme';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_MAX_HEIGHT = 120;

const ReportsScreen = () => {
  const [data, setData]           = useState(null);
  const [theme, setThemeState]    = useState(getTheme());

  useEffect(() => {
    loadAppData();
    const unsubscribe = subscribeToTheme(() => setThemeState(getTheme()));
    return unsubscribe;
  }, []);

  // Reload data every time the screen is focused
  useFocusEffect(useCallback(() => { loadAppData(); }, []));

  const loadAppData = async () => {
    const appData = await loadData();
    setData(appData);
  };

  const getCategoryTotals = () => {
    if (!data?.expenses) return [];
    const totals = {};
    data.expenses.forEach((expense) => {
      const category = data.categories.find(c => c.id === expense.categoryId);
      if (category) {
        if (!totals[category.id]) {
          totals[category.id] = {
            id: category.id,
            name: category.name,
            icon: category.icon,
            total: 0,
          };
        }
        totals[category.id].total += parseFloat(expense.amount);
      }
    });
    return Object.values(totals).sort((a, b) => b.total - a.total);
  };

  const getMonthlyTotals = () => {
    if (!data?.expenses) return [];
    const totals = {};
    data.expenses.forEach(exp => {
      const d   = new Date(exp.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short' });
      if (!totals[key]) totals[key] = { key, label, total: 0 };
      totals[key].total += parseFloat(exp.amount);
    });
    return Object.values(totals).sort((a, b) => a.key.localeCompare(b.key)).slice(-6);
  };

  const totalSpent = () => data?.expenses?.reduce((s, e) => s + parseFloat(e.amount), 0) ?? 0;

  const styles = createStyles(theme);

  if (!data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const catTotals   = getCategoryTotals();
  const monthTotals = getMonthlyTotals();
  const maxMonthVal = Math.max(...monthTotals.map(m => m.total), 1);
  const overallTotal = totalSpent();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>Your spending insights</Text>
        </View>

        {/* ── Summary card ── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOTAL SPENT</Text>
          <Text style={styles.summaryAmount}>
            ₹{overallTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.summaryMeta}>{data.expenses?.length ?? 0} transactions recorded</Text>
        </View>

        {/* ── Monthly Bar Chart ── */}
        {monthTotals.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Monthly Spending</Text>
            <View style={styles.barChart}>
              {monthTotals.map((m) => {
                const barH = Math.max((m.total / maxMonthVal) * BAR_MAX_HEIGHT, 6);
                return (
                  <View key={m.key} style={styles.barCol}>
                    <Text style={styles.barValue}>
                      ₹{m.total >= 1000 ? `${(m.total / 1000).toFixed(1)}K` : m.total.toFixed(0)}
                    </Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: barH }]} />
                    </View>
                    <Text style={styles.barLabel}>{m.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Category Breakdown ── */}
        <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginTop: 4 }]}>
          Category Breakdown
        </Text>

        {catTotals.length > 0 ? (
          <View style={styles.catList}>
            {catTotals.map((category) => {
              const pct = overallTotal > 0 ? (category.total / overallTotal) * 100 : 0;
              return (
                <View key={category.id} style={styles.catRow}>
                  <View style={styles.catIconBox}>
                    <Text style={styles.catIcon}>{category.icon}</Text>
                  </View>
                  <View style={styles.catInfo}>
                    <View style={styles.catTopRow}>
                      <Text style={styles.catName}>{category.name}</Text>
                      <Text style={styles.catAmount}>₹{category.total.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.catBarTrack}>
                      <View style={[styles.catBarFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.catPct}>{pct.toFixed(1)}% of total</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No spending data yet</Text>
            <Text style={styles.emptySub}>Add some expenses to see your report</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.bgPrimary },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: theme.textPrimary, fontWeight: '600' },

  // ── Header — consistent font across all screens ──
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 13, color: theme.textMuted, marginTop: 2 },

  // ── Summary Card ──
  summaryCard: {
    marginHorizontal: 20, marginTop: 14, marginBottom: 14,
    backgroundColor: theme.bgSecondary,
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  summaryLabel:  { fontSize: 10, fontWeight: '700', color: theme.textPrimary, opacity: 0.5, letterSpacing: 1, marginBottom: 6 },
  summaryAmount: { fontSize: 32, fontWeight: '700', color: theme.textPrimary, letterSpacing: -1, marginBottom: 4 },
  summaryMeta:   { fontSize: 12, color: theme.textMuted },

  // ── Monthly Bar Chart ──
  chartCard: {
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: theme.bgSecondary,
    borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.textPrimary, marginBottom: 14 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: BAR_MAX_HEIGHT + 48 },
  barCol:   { alignItems: 'center', flex: 1 },
  barValue: { fontSize: 8, color: theme.textMuted, marginBottom: 4, textAlign: 'center' },
  barTrack: { width: 20, height: BAR_MAX_HEIGHT, justifyContent: 'flex-end', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10 },
  barFill:  { width: 20, backgroundColor: theme.green, borderRadius: 10 },
  barLabel: { fontSize: 10, color: theme.textMuted, marginTop: 6 },

  // ── Category List ──
  catList: { paddingHorizontal: 20, gap: 12, marginTop: 4 },
  catRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.bgSecondary,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  catIconBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: theme.bgElevated,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  catIcon:   { fontSize: 22 },
  catInfo:   { flex: 1 },
  catTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName:   { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
  catAmount: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },
  catBarTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 4,
  },
  catBarFill: { height: 4, borderRadius: 2, backgroundColor: theme.green },
  catPct:    { fontSize: 10, color: theme.textMuted },

  // ── Empty ──
  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon:  { fontSize: 40, marginBottom: 12, opacity: 0.4 },
  emptyText:  { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: theme.textMuted, textAlign: 'center', lineHeight: 18 },
});

export default ReportsScreen;