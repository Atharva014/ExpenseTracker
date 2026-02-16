import React, { useState, useEffect } from 'react';
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

const ReportsScreen = () => {
  const [data, setData] = useState(null);
  const [theme, setThemeState] = useState(getTheme());

  useEffect(() => {
    loadAppData();
    const unsubscribe = subscribeToTheme(() => {
      setThemeState(getTheme());
    });
    return unsubscribe;
  }, []);

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
        if (!totals[category.name]) {
          totals[category.name] = {
            name: category.name,
            icon: category.icon,
            total: 0,
          };
        }
        totals[category.name].total += parseFloat(expense.amount);
      }
    });
    
    return Object.values(totals);
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
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>Your spending insights</Text>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Monthly Spending</Text>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.placeholderText}>Chart will be displayed here</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>
          Category Breakdown
        </Text>
        
        <View style={styles.categoriesGrid}>
          {getCategoryTotals().map((category, index) => (
            <View key={index} style={styles.categoryCard}>
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryIconText}>{category.icon}</Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryAmount}>
                ₹{category.total.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: theme.textGreeting,
  },
  chartContainer: {
    backgroundColor: theme.bgCard,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 15,
  },
  chartPlaceholder: {
    height: 150,
    backgroundColor: theme.bgSecondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 50,
  },
  categoryCard: {
    width: (Dimensions.get('window').width - 50) / 2,
    backgroundColor: theme.bgCard,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: theme.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 5,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
  },
});

export default ReportsScreen;