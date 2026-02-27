import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadData } from '../utils/storage';
import { getTheme, subscribeToTheme } from '../utils/theme';
import { useFocusEffect } from '@react-navigation/native';

// ─── Layout ───────────────────────────────────────────────────────────────────
const SCREEN_W   = Dimensions.get('window').width;
const CARD_W     = SCREEN_W - 40;
const CARD_PAD   = 16;
const INNER_W    = CARD_W - CARD_PAD * 2;

// Horizontal bar chart (category view)
const H_Y_LABEL_W = 68;          // left col: category name
const H_BAR_W     = INNER_W - H_Y_LABEL_W; // bar + x-axis all go here
const H_BAR_H     = 13;          // thickness (16 * 0.8)
const H_ROW_H     = 22;          // row height (27 * 0.8)
const H_X_AXIS_H  = 24;          // height of X-axis tick-label row at bottom

// Vertical bar chart (monthly view)
const V_Y_W       = 40;
const V_CHART_H   = 140;
const V_X_H       = 36;
const V_BAR_W     = 10;

const PRESETS     = ['This Month', 'Last Month', '3 Months', '6 Months', 'This Year', 'Custom'];
const CAT_COLORS  = ['#4ECDC4','#EF4444','#F59E0B','#8B5CF6','#10B981','#3B82F6','#EC4899','#F97316'];

// Nice round ticks for an axis
const getNiceTicks = (maxVal, count = 5) => {
  if (maxVal <= 0) return [0];
  const raw  = maxVal / (count - 1);
  const mag  = Math.pow(10, Math.floor(Math.log10(raw)));
  const nice = [1, 2, 2.5, 5, 10].map(f => f * mag).find(f => f >= raw) ?? mag;
  const top  = Math.ceil(maxVal / nice) * nice;
  const ticks = [];
  for (let v = 0; v <= top + 0.001; v += nice) {
    ticks.push(Math.round(v));
    if (ticks.length >= count + 1) break;
  }
  return ticks;
};

const fmtTick = v =>
  v >= 100000 ? `${(v/100000).toFixed(1)}L`
  : v >= 1000 ? `${(v/1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`
  : `${v}`;

// ─── Component ────────────────────────────────────────────────────────────────
const ReportsScreen = () => {
  const [data, setData]             = useState(null);
  const [theme, setThemeState]      = useState(getTheme());
  const [preset, setPreset]         = useState('This Month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [chartView, setChartView]   = useState('category');

  useFocusEffect(useCallback(() => {
    loadData().then(d => setData(d));
    const unsub = subscribeToTheme(() => setThemeState(getTheme()));
    return unsub;
  }, []));

  const dateRange = useMemo(() => {
    const now = new Date();
    const eod = d => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
    const som = (y, m) => new Date(y, m, 1);
    if (preset === 'This Month')  return { from: som(now.getFullYear(), now.getMonth()),   to: eod(now) };
    if (preset === 'Last Month')  return { from: som(now.getFullYear(), now.getMonth()-1), to: eod(new Date(now.getFullYear(), now.getMonth(), 0)) };
    if (preset === '3 Months')    return { from: som(now.getFullYear(), now.getMonth()-2), to: eod(now) };
    if (preset === '6 Months')    return { from: som(now.getFullYear(), now.getMonth()-5), to: eod(now) };
    if (preset === 'This Year')   return { from: new Date(now.getFullYear(), 0, 1),         to: eod(now) };
    if (preset === 'Custom' && customFrom && customTo) {
      const f = new Date(customFrom), t = eod(new Date(customTo));
      if (!isNaN(f) && !isNaN(t) && f <= t) return { from: f, to: t };
    }
    return { from: som(now.getFullYear(), now.getMonth()), to: eod(now) };
  }, [preset, customFrom, customTo]);

  const filtered = useMemo(() => {
    if (!data?.expenses) return [];
    return data.expenses.filter(e => {
      if (e.type === 'income') return false;
      const d = new Date(e.date);
      return d >= dateRange.from && d <= dateRange.to;
    });
  }, [data, dateRange]);

  const filteredTotal = useMemo(() => filtered.reduce((s, e) => s + parseFloat(e.amount), 0), [filtered]);
  const allTimeTotal  = useMemo(() => (data?.expenses ?? []).filter(e => e.type !== 'income').reduce((s, e) => s + parseFloat(e.amount), 0), [data]);

  const monthlyChartData = useMemo(() => {
    const totals = {};
    filtered.forEach(exp => {
      const d   = new Date(exp.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!totals[key]) totals[key] = { key, label, total: 0 };
      totals[key].total += parseFloat(exp.amount);
    });
    return Object.values(totals).sort((a, b) => a.key.localeCompare(b.key));
  }, [filtered]);

  // ALL categories, zero spend included, sorted high→low
  const categoryChartData = useMemo(() => {
    if (!data?.categories) return [];
    const totals = {};
    filtered.forEach(exp => {
      const cat = data.categories.find(c => c.id === exp.categoryId);
      if (!cat) return;
      if (!totals[cat.id]) totals[cat.id] = { id: cat.id, name: cat.name, icon: cat.icon, total: 0 };
      totals[cat.id].total += parseFloat(exp.amount);
    });
    return data.categories
      .map(cat => totals[cat.id] ?? { id: cat.id, name: cat.name, icon: cat.icon, total: 0 })
      .sort((a, b) => b.total - a.total);
  }, [filtered, data]);

  // X-axis ticks for horizontal chart (amount axis)
  const catMax    = Math.max(...categoryChartData.map(d => d.total), 0);
  const xTicks    = getNiceTicks(catMax, 4);   // 0, 25K, 50K … etc
  const xMax      = xTicks[xTicks.length - 1];

  // Vertical chart
  const vMax      = Math.max(...monthlyChartData.map(d => d.total), 0);
  const yTicks    = getNiceTicks(vMax, 4);
  const yMax      = yTicks[yTicks.length - 1];
  const vColW     = monthlyChartData.length > 0 ? Math.floor((INNER_W - V_Y_W) / monthlyChartData.length) : 40;

  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top','left','right']}>
        <View style={styles.center}><Text style={styles.loadingText}>Loading…</Text></View>
      </SafeAreaView>
    );
  }

  const fmtDate = d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // How many pixels wide is a given value on the H bar axis
  const xPx = (val) => xMax > 0 ? (val / xMax) * H_BAR_W : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top','left','right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>{fmtDate(dateRange.from)} – {fmtDate(dateRange.to)}</Text>
        </View>

        {/* ── Preset pills ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
          {PRESETS.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.presetPill, preset === p && styles.presetPillActive]}
              onPress={() => { setPreset(p); setShowCustom(p === 'Custom'); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, preset === p && styles.presetTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Custom date inputs ── */}
        {preset === 'Custom' && showCustom && (
          <View style={styles.customBox}>
            <View style={styles.customField}>
              <Text style={styles.customLabel}>FROM</Text>
              <TextInput style={styles.customInput} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textMuted} value={customFrom} onChangeText={setCustomFrom} color={theme.textPrimary} />
            </View>
            <View style={styles.customSep} />
            <View style={styles.customField}>
              <Text style={styles.customLabel}>TO</Text>
              <TextInput style={styles.customInput} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textMuted} value={customTo} onChangeText={setCustomTo} color={theme.textPrimary} />
            </View>
            <TouchableOpacity style={styles.customApplyBtn} onPress={() => setShowCustom(false)} activeOpacity={0.8}>
              <Text style={styles.customApplyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Stat blocks ── */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PERIOD TOTAL</Text>
            <Text style={styles.statAmount} numberOfLines={1} adjustsFontSizeToFit>
              ₹{filteredTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </Text>
            <Text style={styles.statMeta}>{filtered.length} transactions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ALL TIME</Text>
            <Text style={styles.statAmount} numberOfLines={1} adjustsFontSizeToFit>
              ₹{allTimeTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </Text>
            <Text style={styles.statMeta}>{data.expenses?.length ?? 0} total</Text>
          </View>
        </View>

        {/* ── Chart card ── */}
        <View style={styles.chartCard}>

          {/* Toggle */}
          <View style={styles.chartTopRow}>
            <Text style={styles.chartTitle}>
              {chartView === 'category' ? 'By Category' : 'Monthly Spending'}
            </Text>
            <View style={styles.toggle}>
              <TouchableOpacity style={[styles.toggleBtn, chartView === 'monthly' && styles.toggleBtnOn]} onPress={() => setChartView('monthly')} activeOpacity={0.7}>
                <Text style={[styles.toggleTxt, chartView === 'monthly' && styles.toggleTxtOn]}>Monthly</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, chartView === 'category' && styles.toggleBtnOn]} onPress={() => setChartView('category')} activeOpacity={0.7}>
                <Text style={[styles.toggleTxt, chartView === 'category' && styles.toggleTxtOn]}>Category</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════
              HORIZONTAL BAR CHART  (category view)

              Layout per row:
              ┌─────────────┬────────────────────────────────────┐
              │ cat name    │  bar █████████░░░░░░░░░░░░░░░░░░   │  H_ROW_H
              └─────────────┴────────────────────────────────────┘
              ┌─────────────┬────────────────────────────────────┐  H_X_AXIS_H
              │  (empty)    │  0   5K   10K   15K   20K   25K   │
              └─────────────┴────────────────────────────────────┘

              Y axis = left edge of bar area (vertical line)
              X axis = bottom edge of last bar row (horizontal line)
              Vertical grid lines at each X tick
          ══════════════════════════════════════════════════════════ */}
          {chartView === 'category' && (
            categoryChartData.length > 0 ? (
              <View style={{ width: INNER_W }}>

                {/* Main chart: Y labels on left, bars + grid on right */}
                <View style={{ flexDirection: 'row' }}>

                  {/* ── Y axis: category names ── */}
                  <View style={{ width: H_Y_LABEL_W }}>
                    {categoryChartData.map((item, idx) => (
                      <View
                        key={item.id}
                        style={{
                          height: H_ROW_H,
                          justifyContent: 'center',
                          alignItems: 'flex-end',
                          paddingRight: 10,
                        }}
                      >
                        <Text style={styles.hYLabel} numberOfLines={1}>
                          {item.icon}  {item.name}
                        </Text>
                      </View>
                    ))}
                    {/* spacer matching X axis label row */}
                    <View style={{ height: H_X_AXIS_H }} />
                  </View>

                  {/* ── Bar area + X axis ── */}
                  <View style={{ width: H_BAR_W, position: 'relative' }}>

                    {/* Y axis line only — no grid */}
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: H_X_AXIS_H,
                        left: 0,
                        width: 1,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                      }}
                    />

                    {/* Bar rows */}
                    {categoryChartData.map((item, idx) => {
                      const color  = CAT_COLORS[idx % CAT_COLORS.length];
                      const fillW  = Math.max(xPx(item.total), item.total > 0 ? 4 : 0);
                      const amtTxt = item.total > 0 ? fmtTick(item.total) : '';
                      return (
                        <View
                          key={item.id}
                          style={{
                            height: H_ROW_H,
                            justifyContent: 'center',
                            paddingLeft: 1,
                          }}
                        >
                          {/* Bar + amount label in a row */}
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{
                              height: H_BAR_H,
                              width: item.total > 0 ? fillW : H_BAR_W * 0.04,
                              backgroundColor: item.total > 0 ? color : 'rgba(255,255,255,0.08)',
                              borderTopRightRadius: H_BAR_H / 2,
                              borderBottomRightRadius: H_BAR_H / 2,
                            }} />
                            {item.total > 0 && (
                              <Text style={[styles.hBarEndAmt, { color }]}>
                                {amtTxt}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}

                    {/* X axis baseline */}
                    <View style={{
                      height: 1,
                      width: H_BAR_W,
                      backgroundColor: 'rgba(255,255,255,0.25)',
                    }} />

                    {/* X axis tick labels */}
                    <View style={{ height: H_X_AXIS_H, position: 'relative' }}>
                      {xTicks.map((tick, i) => {
                        const leftPx = xPx(tick);
                        return (
                          <Text
                            key={i}
                            style={[styles.hXLabel, { position: 'absolute', left: leftPx - 12, top: 6 }]}
                          >
                            {fmtTick(tick)}
                          </Text>
                        );
                      })}
                    </View>

                  </View>{/* end bar area */}
                </View>
              </View>
            ) : (
              <View style={styles.chartEmpty}>
                <Text style={styles.chartEmptyIcon}>📊</Text>
                <Text style={styles.chartEmptyText}>No data for this period</Text>
              </View>
            )
          )}

          {/* ══════════════════════════════════════════════════════════
              VERTICAL BAR CHART  (monthly view)
          ══════════════════════════════════════════════════════════ */}
          {chartView === 'monthly' && (
            monthlyChartData.length > 0 ? (
              <View style={{ flexDirection: 'row', width: INNER_W }}>

                {/* Y labels */}
                <View style={{ width: V_Y_W }}>
                  <View style={{ height: V_CHART_H, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 8, paddingTop: 2, paddingBottom: 2 }}>
                    {[...yTicks].reverse().map((tick, i) => (
                      <Text key={i} style={styles.vYLabel}>{fmtTick(tick)}</Text>
                    ))}
                  </View>
                  <View style={{ height: V_X_H }} />
                </View>

                {/* Plot */}
                <View style={{ width: INNER_W - V_Y_W }}>
                  <View style={{ height: V_CHART_H, overflow: 'hidden', position: 'relative' }}>

                    {/* Grid lines from bottom */}
                    {yTicks.map((tick, i) => {
                      const bot = yMax > 0 ? (tick / yMax) * V_CHART_H : 0;
                      return (
                        <View key={i} style={{
                          position: 'absolute', left: 0, right: 0, bottom: bot, height: 1,
                          backgroundColor: tick === 0
                            ? 'rgba(255,255,255,0.22)'
                            : 'rgba(255,255,255,0.07)',
                        }} />
                      );
                    })}

                    <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.22)' }} />

                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: V_CHART_H }}>
                      {monthlyChartData.map((item) => {
                        const barH = yMax > 0 && item.total > 0
                          ? Math.min((item.total / yMax) * V_CHART_H, V_CHART_H - 2)
                          : 0;
                        return (
                          <View key={item.key} style={{ width: vColW, alignItems: 'center', justifyContent: 'flex-end', height: V_CHART_H }}>
                            {item.total > 0 ? (
                              <View style={{ width: V_BAR_W, height: barH, backgroundColor: theme.green, borderTopLeftRadius: V_BAR_W/2, borderTopRightRadius: V_BAR_W/2 }} />
                            ) : (
                              <View style={{ width: V_BAR_W, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1 }} />
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', height: V_X_H, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.22)' }}>
                    {monthlyChartData.map((item) => (
                      <View key={item.key} style={{ width: vColW, alignItems: 'center', paddingTop: 6 }}>
                        <Text style={styles.vXLabel} numberOfLines={1}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.chartEmpty}>
                <Text style={styles.chartEmptyIcon}>📊</Text>
                <Text style={styles.chartEmptyText}>No data for this period</Text>
              </View>
            )
          )}
        </View>

        {/* ── Category breakdown list ── */}
        <Text style={styles.breakdownTitle}>Category Breakdown</Text>
        <View style={styles.catList}>
          {categoryChartData.map((cat, idx) => {
            const pct   = filteredTotal > 0 ? (cat.total / filteredTotal) * 100 : 0;
            const color = CAT_COLORS[idx % CAT_COLORS.length];
            return (
              <View key={cat.id} style={styles.catRow}>
                <View style={[styles.catIconBox, { backgroundColor: `${color}22` }]}>
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                </View>
                <View style={styles.catInfo}>
                  <View style={styles.catTopRow}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <Text style={[styles.catAmount, cat.total === 0 && { opacity: 0.3 }]}>
                      {cat.total > 0 ? `₹${cat.total.toLocaleString('en-IN')}` : '—'}
                    </Text>
                  </View>
                  <View style={styles.catBarTrack}>
                    <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={styles.catPct}>
                    {cat.total > 0 ? `${pct.toFixed(1)}% of period` : 'No spend this period'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {categoryChartData.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No spending data</Text>
            <Text style={styles.emptySub}>Try a different date range</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const createStyles = (theme) => StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: theme.bgPrimary },
  container:     { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:   { fontSize: 16, color: theme.textPrimary, fontWeight: '600' },

  header:   { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 2 },
  title:    { fontSize: 24, fontWeight: '700', color: theme.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 11, color: theme.textMuted, marginTop: 2 },

  presetRow:        { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  presetPill:       { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 50, backgroundColor: theme.bgSecondary, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  presetPillActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  presetText:       { fontSize: 12, fontWeight: '600', color: theme.textPrimary },
  presetTextActive: { color: '#1C2128' },

  customBox:       { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, backgroundColor: theme.bgSecondary, borderRadius: 16, padding: 14, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  customField:     { flex: 1 },
  customLabel:     { fontSize: 9, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.8, marginBottom: 4 },
  customInput:     { fontSize: 13, fontWeight: '500', padding: 0 },
  customSep:       { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.12)' },
  customApplyBtn:  { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderRadius: 12 },
  customApplyText: { fontSize: 12, fontWeight: '700', color: '#1C2128' },

  statRow:   { flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, gap: 12 },
  statCard:  { flex: 1, backgroundColor: theme.bgSecondary, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statLabel: { fontSize: 10, fontWeight: '700', color: theme.textMuted, letterSpacing: 0.8, marginBottom: 6 },
  statAmount:{ fontSize: 22, fontWeight: '700', color: theme.textPrimary, letterSpacing: -0.5, marginBottom: 4 },
  statMeta:  { fontSize: 11, color: theme.textMuted },

  chartCard:   { marginHorizontal: 20, marginBottom: 20, backgroundColor: theme.bgSecondary, borderRadius: 20, padding: CARD_PAD, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  chartTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  chartTitle:  { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  toggle:      { flexDirection: 'row', backgroundColor: theme.bgElevated, borderRadius: 10, padding: 3, gap: 2 },
  toggleBtn:   { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
  toggleBtnOn: { backgroundColor: '#FFFFFF' },
  toggleTxt:   { fontSize: 11, fontWeight: '600', color: theme.textMuted },
  toggleTxtOn: { color: '#1C2128' },

  // Horizontal chart
  hYLabel:    { fontSize: 11, fontWeight: '500', color: theme.textPrimary },
  hXLabel:    { fontSize: 9,  color: theme.textMuted, textAlign: 'center', width: 28 },
  hBarEndAmt: { fontSize: 10, fontWeight: '700', marginLeft: 5 },

  // Vertical chart
  vYLabel: { fontSize: 9, color: theme.textMuted, textAlign: 'right' },
  vXLabel: { fontSize: 9, color: theme.textMuted, textAlign: 'center', width: '100%' },

  chartEmpty:     { paddingVertical: 36, alignItems: 'center', gap: 8 },
  chartEmptyIcon: { fontSize: 32, opacity: 0.3 },
  chartEmptyText: { fontSize: 13, color: theme.textMuted },

  breakdownTitle: { fontSize: 15, fontWeight: '700', color: theme.textPrimary, paddingHorizontal: 20, marginBottom: 12 },
  catList:    { paddingHorizontal: 20, gap: 10, marginBottom: 8 },
  catRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.bgSecondary, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  catIconBox: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  catIcon:    { fontSize: 20 },
  catInfo:    { flex: 1 },
  catTopRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName:    { fontSize: 14, fontWeight: '600', color: theme.textPrimary },
  catAmount:  { fontSize: 14, fontWeight: '700', color: theme.textPrimary },
  catBarTrack:{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 4 },
  catBarFill: { height: 4, borderRadius: 2 },
  catPct:     { fontSize: 10, color: theme.textMuted },

  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon:  { fontSize: 40, marginBottom: 12, opacity: 0.4 },
  emptyText:  { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: theme.textMuted, textAlign: 'center', lineHeight: 18 },
});

export default ReportsScreen;