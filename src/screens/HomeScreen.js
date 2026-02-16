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

const [userName, setUserName] = useState('Amandal');
const HomeScreen = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [showIncome, setShowIncome] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [theme, setThemeState] = useState(getTheme());

  useEffect(() => {
    loadAppData();
    loadUserName();
    const unsubscribe = subscribeToTheme((newTheme) => {
      setThemeState(getTheme());
    });
    return unsubscribe;
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAppData();
    }, [])
  );

  const loadUserName = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      if (name) setUserName(name);
    } catch (error) {
      console.error('Error loading user name:', error);
    }
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

  const calculateTotalExpense = () => {
    if (!data?.expenses) return 0;
    return data.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  };

  const calculateTotalIncome = () => {
    return 65000;
  };

  const getCurrentBalance = () => {
    return calculateTotalIncome() - calculateTotalExpense();
  };

  const getRecentExpenses = () => {
    if (!data?.expenses) return [];
    return data.expenses.slice(0, 5);
  };

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hi, {userName}</Text>
        </View>

        {/* Total Expense - Always Visible */}
        <View style={styles.totalExpenseCard}>
          <Text style={styles.cardLabel}>TOTAL EXPENSE</Text>
          <Text style={styles.totalAmount}>
            ₹{calculateTotalExpense().toFixed(2)}
          </Text>
        </View>

        {/* Stats Grid - Click to Show/Hide */}
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => setShowIncome(!showIncome)}
            activeOpacity={0.7}
          >
            <Text style={styles.statLabel}>TOTAL INCOME</Text>
            <Text style={styles.statAmount}>
              {showIncome ? `₹${calculateTotalIncome().toFixed(2)}` : '******'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => setShowBalance(!showBalance)}
            activeOpacity={0.7}
          >
            <Text style={styles.statLabel}>CURRENT BALANCE</Text>
            <Text style={styles.statAmount}>
              {showBalance ? `₹${getCurrentBalance().toFixed(2)}` : '******'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {getRecentExpenses().length > 0 ? (
          <View style={styles.transactionsContainer}>
            {getRecentExpenses().map((expense) => (
              <View key={expense.id} style={styles.transactionCard}>
                <View style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    <Text style={styles.iconText}>
                      {data.categories.find(c => c.id === expense.categoryId)?.icon || '📦'}
                    </Text>
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>{expense.description}</Text>
                    <Text style={styles.transactionSubtitle}>
                      {new Date(expense.date).toLocaleDateString()} • {expense.paymentMethod}
                    </Text>
                  </View>
                  <Text style={styles.transactionAmount}>-₹{expense.amount}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <Text style={styles.emptyStateSubtext}>Add your first expense to get started</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.bgPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: theme.bgPrimary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: theme.textSecondary,
  },
  header: {
    padding: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 3,
  },
  subGreeting: {
    fontSize: 13,
    color: theme.textGreeting,
  },
  totalExpenseCard: {
    backgroundColor: theme.cardBg,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
  },
  cardLabel: {
    fontSize: 11,
    color: theme.cardText,
    opacity: 0.9,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.cardText,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.bgCard,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  statAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  seeAll: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  transactionsContainer: {
    paddingHorizontal: 20,
  },
  transactionCard: {
    backgroundColor: theme.bgCard,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 3,
  },
  transactionSubtitle: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});

export default HomeScreen;