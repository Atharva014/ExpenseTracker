import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>💰 Expense Tracker</Text>
          <Text style={styles.subtitle}>Your money manager</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardLabel}>TOTAL BALANCE</Text>
          <Text style={styles.amount}>₹45,230</Text>
        </View>

        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeText}>
            ✅ App is working!{'\n\n'}
            Next: We'll add all the screens and features.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 25,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 1,
  },
  amount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  welcomeBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
  },
});

export default App;