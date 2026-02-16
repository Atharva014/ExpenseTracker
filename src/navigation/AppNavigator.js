import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ReportsScreen from '../screens/ReportsScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const defaultTheme = {
  navBg: '#FFFFFF',
  activeTabIndicator: '#000000',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
};

const AppNavigator = () => {
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    import('../utils/theme').then((themeModule) => {
      setTheme(themeModule.getTheme());
      
      const unsubscribe = themeModule.subscribeToTheme(() => {
        setTheme(themeModule.getTheme());
      });
      
      return () => unsubscribe();
    });
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: 80,
            paddingBottom: 20,
            paddingTop: 8,
            borderTopWidth: 0,
            backgroundColor: theme.navBg,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          tabBarActiveTintColor: theme.textPrimary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
        }}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                {focused && <View style={[styles.activeIndicator, { backgroundColor: theme.activeTabIndicator }]} />}
                <Text style={{ fontSize: 24 }}>🏠</Text>
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Expense"
          component={AddExpenseScreen}
          options={{
            tabBarLabel: 'Expense',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                {focused && <View style={[styles.activeIndicator, { backgroundColor: theme.activeTabIndicator }]} />}
                <Text style={{ fontSize: 24 }}>➕</Text>
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarLabel: 'History',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                {focused && <View style={[styles.activeIndicator, { backgroundColor: theme.activeTabIndicator }]} />}
                <Text style={{ fontSize: 24 }}>📜</Text>
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{
            tabBarLabel: 'Reports',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                {focused && <View style={[styles.activeIndicator, { backgroundColor: theme.activeTabIndicator }]} />}
                <Text style={{ fontSize: 24 }}>📊</Text>
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Cards"
          component={PaymentMethodsScreen}
          options={{
            tabBarLabel: 'Cards',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                {focused && <View style={[styles.activeIndicator, { backgroundColor: theme.activeTabIndicator }]} />}
                <Text style={{ fontSize: 24 }}>💳</Text>
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Account"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Account',
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                {focused && <View style={[styles.activeIndicator, { backgroundColor: theme.activeTabIndicator }]} />}
                <Text style={{ fontSize: 24 }}>👤</Text>
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 30,
    height: 3,
    borderRadius: 2,
  },
});

export default AppNavigator;