import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addExpense, loadData } from '../utils/storage';
import { getTheme, subscribeToTheme } from '../utils/theme';

const AddExpenseScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [theme, setThemeState] = useState(getTheme());

  useEffect(() => {
    loadOptions();
    const unsubscribe = subscribeToTheme(() => {
      setThemeState(getTheme());
    });
    return unsubscribe;
  }, []);

  const loadOptions = async () => {
    const data = await loadData();
    setCategories(data.categories);
    setPaymentMethods(data.paymentMethods);
  };

  const handleSave = async () => {
    if (!amount || !categoryId || !paymentMethod || !description) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const expense = {
      amount: parseFloat(amount),
      categoryId,
      paymentMethod,
      description,
      location,
      date,
    };

    const result = await addExpense(expense);
    
    if (result) {
      Alert.alert('Success', 'Expense added successfully', [
        {
          text: 'OK',
          onPress: () => {
            setAmount('');
            setCategoryId('');
            setPaymentMethod('');
            setDescription('');
            setLocation('');
            navigation.navigate('Home');
          },
        },
      ]);
    } else {
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Expense</Text>
          <Text style={styles.subtitle}>Record your spending</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="₹0.00"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.optionsGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.optionChip,
                  categoryId === cat.id && styles.optionChipSelected,
                ]}
                onPress={() => setCategoryId(cat.id)}>
                <Text style={styles.optionIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.optionText,
                  categoryId === cat.id && styles.optionTextSelected
                ]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.optionsGrid}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.optionChip,
                  paymentMethod === method.name && styles.optionChipSelected,
                ]}
                onPress={() => setPaymentMethod(method.name)}>
                <Text style={styles.optionIcon}>{method.icon}</Text>
                <Text style={[
                  styles.optionText,
                  paymentMethod === method.name && styles.optionTextSelected
                ]}>{method.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="What did you buy?"
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Location (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Where?"
            placeholderTextColor={theme.textSecondary}
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Expense</Text>
          </TouchableOpacity>
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
    paddingBottom: 120,
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
  form: {
    padding: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: theme.textPrimary,
    backgroundColor: theme.bgCard,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bgSecondary,
  },
  optionChipSelected: {
    backgroundColor: theme.cardBg,
    borderColor: theme.cardBg,
  },
  optionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  optionTextSelected: {
    color: theme.cardText,
  },
  saveButton: {
    backgroundColor: theme.cardBg,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  saveButtonText: {
    color: theme.cardText,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AddExpenseScreen;