import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { loadData } from '../utils/storage';
import { authenticateWithBiometric } from '../utils/auth';

const HomeScreen = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    loadAppData();
  }, []);

  const loadAppData = async () => {
    const appData = await loadData();
    setData(appData);
  };

  const handleUnlock = async () => {
    const authenticated = await authenticateWithBiometric();
    if (authenticated) {
      setIsUnlocked(true);
    } else {
      Alert.alert('Authentication Failed', 'Please try again');
    }
  };

  const calculateTotalExpense = () => {
    if (!data?.expenses) return 0;
    return data.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  };

  const calculateTotalIncome = () => {
    // This will be calculated from income entries in future
    return 65000; // Placeholder
  };

  const getCurrentBalance = () => {
    return calculateTotalIncome() - calculateTotalExpense();
  };

  const getRecentExpenses = () => {
    if (!data?.expenses) return [];
    return data.expenses.slice(0, 5);
  };

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning, Amandal</Text>
        <Text style={styles.subGreeting}>Your expenses</Text>
      </View>

      {/* Total Expense Card */}
      <View style={styles.totalExpenseCard}>
        <Text style={styles.cardLabel}>TOTAL EXPENSE</Text>
        <Text style={styles.totalAmount}>
          {isUnlocked ? `₹${calculateTotalExpense().toFixed(2)}` : '******'}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TOTAL INCOME</Text>
          <Text style={styles.statAmount}>
            {isUnlocked ? `₹${calculateTotalIncome().toFixed(2)}` : '******'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>CURRENT BALANCE</Text>
          <Text style={styles.statAmount}>
            {isUnlocked ? `₹${getCurrentBalance().toFixed(2)}` : '******'}
          </Text>
        </View>
      </View>

      {!isUnlocked && (
        <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
          <Text style={styles.unlockText}>🔓 Tap to Unlock</Text>
        </TouchableOpacity>
      )}

      {/* Recent Activity */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {getRecentExpenses().map((expense) => (
        <View key={expense.id} style={styles.transactionItem}>
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
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 3,
  },
  subGreeting: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  totalExpenseCard: {
    backgroundColor: '#000000',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
  },
  cardLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  statAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  unlockButton: {
    marginHorizontal: 20,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  unlockText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
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
    color: '#1A1A1A',
  },
  seeAll: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
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
    color: '#1A1A1A',
    marginBottom: 3,
  },
  transactionSubtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
});

export default HomeScreen;