import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import ReportsScreen from '../screens/ReportsScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            backgroundColor: '#FFFFFF',
          },
          tabBarActiveTintColor: '#000000',
          tabBarInactiveTintColor: '#6B7280',
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
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20 }}>🏠</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Expense"
          component={AddExpenseScreen}
          options={{
            tabBarLabel: 'Expense',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20 }}>➕</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{
            tabBarLabel: 'Reports',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20 }}>📊</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Cards"
          component={PaymentMethodsScreen}
          options={{
            tabBarLabel: 'Cards',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20 }}>💳</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;