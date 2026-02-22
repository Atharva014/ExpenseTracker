import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line } from 'react-native-svg';
import { loadData } from '../utils/storage';
import { getTheme, subscribeToTheme } from '../utils/theme';
import { useFocusEffect } from '@react-navigation/native';

const SearchIcon = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} />
    <Line x1="16.5" y1="16.5" x2="22" y2="22" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const FilterIcon = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="10" y1="18" x2="14" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CloseIcon = ({ color }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const groupByMonth = (expenses) => {
  const groups = {};
  expenses.forEach(exp => {
    const d   = new Date(exp.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = { key, label, items: [], total: 0 };
    groups[key].items.push(exp);
    groups[key].total += parseFloat(exp.amount);
  });
  return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
};

const PERIODS = ['All', 'This Month', 'Last Month', 'This Week'];

const HistoryScreen = () => {
  const [data, setData]                       = useState(null);
  const [search, setSearch]                   = useState('');
  const [searchVisible, setSearchVisible]     = useState(false);
  const [filterVisible, setFilterVisible]     = useState(false);
  const [selectedPeriod, setSelectedPeriod]   = useState('All');
  const [selectedCats, setSelectedCats]       = useState([]);
  const [theme, setThemeState]                = useState(getTheme());

  useEffect(() => {
    loadAppData();
    const unsubscribe = subscribeToTheme(() => setThemeState(getTheme()));
    return unsubscribe;
  }, []);

  useFocusEffect(useCallback(() => { loadAppData(); }, []));

  const loadAppData = async () => {
    const appData = await loadData();
    setData(appData);
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  const filterExpenses = useMemo(() => {
    if (!data?.expenses) return [];
    let filtered = [...data.expenses];

    const now              = new Date();
    const startOfWeek      = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0);

    if (selectedPeriod === 'This Week') {
      filtered = filtered.filter(e => new Date(e.date) >= startOfWeek);
    } else if (selectedPeriod === 'This Month') {
      filtered = filtered.filter(e => new Date(e.date) >= startOfMonth);
    } else if (selectedPeriod === 'Last Month') {
      filtered = filtered.filter(e => {
        const d = new Date(e.date);
        return d >= startOfLastMonth && d <= endOfLastMonth;
      });
    }

    if (selectedCats.length > 0) {
      filtered = filtered.filter(e => selectedCats.includes(e.categoryId));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(e =>
        e.description?.toLowerCase().includes(q) ||
        data.categories?.find(c => c.id === e.categoryId)?.name?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [data, search, selectedPeriod, selectedCats]);

  const grouped = useMemo(() => groupByMonth(filterExpenses), [filterExpenses]);

  const toggleCat = (id) => {
    setSelectedCats(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSelectedPeriod('All');
    setSelectedCats([]);
  };

  const activeFilters = selectedPeriod !== 'All' || selectedCats.length > 0;

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  if (!data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.center}><Text style={styles.loadingText}>Loading...</Text></View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item: group }) => (
    <View style={styles.group}>
      <View style={styles.monthHeader}>
        <Text style={styles.monthLabel}>{group.label}</Text>
        <Text style={styles.monthTotal}>
          Total Spent{'\n'}
          <Text style={styles.monthTotalAmt}>₹{group.total.toLocaleString('en-IN')}</Text>
        </Text>
      </View>
      {group.items.map((expense, idx) => {
        const cat    = data.categories?.find(c => c.id === expense.categoryId);
        const isLast = idx === group.items.length - 1;
        return (
          <View key={expense.id}>
            <View style={styles.txRow}>
              <View style={styles.txAvatar}>
                <Text style={styles.txAvatarText}>{cat?.icon ?? '📦'}</Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txName} numberOfLines={1}>{expense.description}</Text>
                <Text style={styles.txDate}>{fmtDate(expense.date)}</Text>
                <View style={styles.txTag}>
                  <Text style={styles.txTagText}>{cat?.name ?? 'Other'}</Text>
                </View>
              </View>
              <Text style={styles.txAmount}>-₹{parseFloat(expense.amount).toLocaleString('en-IN')}</Text>
            </View>
            {!isLast && <View style={styles.divider} />}
          </View>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Payment History</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={[styles.iconBtn, searchVisible && styles.iconBtnActive]}
            onPress={() => setSearchVisible(!searchVisible)}
            activeOpacity={0.7}
          >
            <SearchIcon color={searchVisible ? '#FFFFFF' : '#8B9BAE'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, activeFilters && styles.iconBtnActive]}
            onPress={() => setFilterVisible(true)}
            activeOpacity={0.7}
          >
            <FilterIcon color={activeFilters ? '#FFFFFF' : '#8B9BAE'} />
            {activeFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search bar ── */}
      {searchVisible && (
        <View style={styles.searchBar}>
          <SearchIcon color={theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <CloseIcon color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Active filter pills ── */}
      {activeFilters && (
        <View style={styles.activePills}>
          {selectedPeriod !== 'All' && (
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>{selectedPeriod}</Text>
            </View>
          )}
          {selectedCats.map(id => {
            const cat = data.categories?.find(c => c.id === id);
            return cat ? (
              <View key={id} style={styles.activePill}>
                <Text style={styles.activePillText}>{cat.icon} {cat.name}</Text>
              </View>
            ) : null;
          })}
          <TouchableOpacity onPress={clearFilters} activeOpacity={0.7}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── List (scrollable) ── */}
      {grouped.length > 0 ? (
        <FlatList
          data={grouped}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>⊘</Text>
          <Text style={styles.emptyText}>No transactions found</Text>
          <Text style={styles.emptySub}>
            {activeFilters || search ? 'Try adjusting your filters' : 'Add your first expense to see history'}
          </Text>
        </View>
      )}

      {/* ── Filter Modal ── */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterVisible(false)}
        />
        <View style={styles.filterSheet}>
          <View style={styles.filterHandle} />
          <Text style={styles.filterTitle}>Filter Transactions</Text>

          <Text style={styles.filterSection}>TIME PERIOD</Text>
          <View style={styles.filterChips}>
            {PERIODS.map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.filterChip, selectedPeriod === p && styles.filterChipActive]}
                onPress={() => setSelectedPeriod(p)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, selectedPeriod === p && styles.filterChipTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSection}>CATEGORY</Text>
          <View style={styles.filterChips}>
            {data.categories?.map(cat => {
              const active = selectedCats.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => toggleCat(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterChipText}>{cat.icon} </Text>
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.filterBtns}>
            <TouchableOpacity style={styles.filterBtnClear} onPress={clearFilters} activeOpacity={0.7}>
              <Text style={styles.filterBtnClearText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterBtnApply} onPress={() => setFilterVisible(false)} activeOpacity={0.85}>
              <Text style={styles.filterBtnApplyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: theme.bgPrimary },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { color: theme.textPrimary, fontSize: 16, fontWeight: '600' },

  // ── Header ── consistent font size/weight across all screens
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: theme.textPrimary, letterSpacing: -0.5 },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: theme.bgSecondary,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  iconBtnActive: { backgroundColor: theme.bgElevated, borderColor: 'rgba(255,255,255,0.2)' },
  filterDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: theme.green,
  },

  // ── Search ──
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 10,
    backgroundColor: theme.bgSecondary,
    borderRadius: 14, paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: { flex: 1, fontSize: 14, color: theme.textPrimary, padding: 0 },

  // ── Active filter pills ──
  activePills: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 20, marginBottom: 8, alignItems: 'center',
  },
  activePill: {
    backgroundColor: 'rgba(78,205,196,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: theme.green,
  },
  activePillText: { fontSize: 11, fontWeight: '600', color: theme.green },
  clearText:      { fontSize: 11, fontWeight: '600', color: theme.red },

  // ── List ──
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },

  // ── Month group ──
  group: {
    marginBottom: 24,
    backgroundColor: theme.bgSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  monthHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
    backgroundColor: theme.bgElevated,
  },
  monthLabel:    { fontSize: 15, fontWeight: '700', color: theme.textPrimary },
  monthTotal:    { fontSize: 11, color: theme.textPrimary, opacity: 0.55, textAlign: 'right' },
  monthTotalAmt: { fontSize: 13, fontWeight: '700', color: theme.green, opacity: 1 },

  // ── Transaction row ──
  txRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  txAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1C2841',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  txAvatarText: { fontSize: 20 },
  txInfo:       { flex: 1 },
  txName:       { fontSize: 14, fontWeight: '600', color: theme.textPrimary, marginBottom: 2 },
  txDate:       { fontSize: 11, color: theme.textPrimary, opacity: 0.5, marginBottom: 5 },
  txTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  txTagText:  { fontSize: 10, fontWeight: '600', color: theme.textPrimary, opacity: 0.7 },
  txAmount:   { fontSize: 14, fontWeight: '700', color: theme.red, paddingTop: 2, flexShrink: 0 },
  divider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 72 },

  // ── Empty ──
  emptyIcon: { fontSize: 36, color: theme.textPrimary, opacity: 0.25, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 6 },
  emptySub:  { fontSize: 13, color: theme.textPrimary, opacity: 0.45, textAlign: 'center', lineHeight: 18 },

  // ── Filter modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  filterSheet: {
    backgroundColor: theme.bgCard,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  filterHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginBottom: 20,
  },
  filterTitle:   { fontSize: 17, fontWeight: '700', color: theme.textPrimary, marginBottom: 20 },
  filterSection: { fontSize: 10, fontWeight: '700', color: theme.textPrimary, opacity: 0.5, letterSpacing: 1, marginBottom: 10 },
  filterChips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: theme.bgSecondary,
  },
  filterChipActive:     { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  filterChipText:       { fontSize: 12, fontWeight: '600', color: theme.textPrimary },
  filterChipTextActive: { color: '#1C2128' },
  filterBtns:     { flexDirection: 'row', gap: 10, marginTop: 4 },
  filterBtnClear: {
    flex: 1, height: 48, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  filterBtnClearText: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, opacity: 0.7 },
  filterBtnApply: {
    flex: 1, height: 48, borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
  },
  filterBtnApplyText: { fontSize: 15, fontWeight: '700', color: '#1C2128' },
});

export default HistoryScreen;