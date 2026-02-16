import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadData, addPaymentMethod } from '../utils/storage';
import { getTheme, subscribeToTheme } from '../utils/theme';

const PaymentMethodsScreen = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');
  const [theme, setThemeState] = useState(getTheme());

  useEffect(() => {
    loadPaymentMethods();
    const unsubscribe = subscribeToTheme(() => {
      setThemeState(getTheme());
    });
    return unsubscribe;
  }, []);

  const loadPaymentMethods = async () => {
    const data = await loadData();
    setPaymentMethods(data.paymentMethods);
  };

  const handleAddMethod = async () => {
    if (!newMethodName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    const newMethod = {
      name: newMethodName,
      icon: '💳',
      type: 'card',
    };

    const result = await addPaymentMethod(newMethod);
    
    if (result) {
      setNewMethodName('');
      setShowAddForm(false);
      loadPaymentMethods();
      Alert.alert('Success', 'Payment method added');
    } else {
      Alert.alert('Error', 'Failed to add payment method');
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Payment Methods</Text>
          <Text style={styles.subtitle}>Manage your cards & accounts</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Payment Methods</Text>
          <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)}>
            <Text style={styles.addButton}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {showAddForm && (
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder="Payment method name"
              placeholderTextColor={theme.textSecondary}
              value={newMethodName}
              onChangeText={setNewMethodName}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleAddMethod}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}

        {paymentMethods.map((method) => (
          <View key={method.id} style={styles.methodCard}>
            <View style={styles.methodIcon}>
              <Text style={styles.iconText}>{method.icon}</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.name}</Text>
              <Text style={styles.methodType}>{method.type}</Text>
            </View>
          </View>
        ))}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  addButton: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  addForm: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: theme.bgSecondary,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: theme.bgCard,
    color: theme.textPrimary,
  },
  saveButton: {
    backgroundColor: theme.cardBg,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.cardText,
    fontWeight: '600',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: theme.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 22,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 3,
  },
  methodType: {
    fontSize: 12,
    color: theme.textSecondary,
  },
});

export default PaymentMethodsScreen;