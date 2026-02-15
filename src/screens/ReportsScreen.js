import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { loadData } from '../utils/storage';

const ReportsScreen = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadAppData();
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  chartPlaceholder: {
    height: 150,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#6B7280',
    fontSize: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 100,
  },
  categoryCard: {
    width: (Dimensions.get('window').width - 50) / 2,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
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
    color: '#1A1A1A',
    marginBottom: 5,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});

export default ReportsScreen;