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
import { addExpense, loadData } from '../utils/storage';

const AddExpenseScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    loadOptions();
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Expense</Text>
        <Text style={styles.subtitle}>Record your spending</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="₹0.00"
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
              <Text style={styles.optionText}>{cat.name}</Text>
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
              <Text style={styles.optionText}>{method.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="What did you buy?"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Location (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Where?"
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  form: {
    padding: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
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
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  optionChipSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  optionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  saveButton: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 100,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AddExpenseScreen;