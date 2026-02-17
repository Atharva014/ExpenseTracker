import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/HomeScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { getTheme, subscribeToTheme } from '../utils/theme';

const Tab = createBottomTabNavigator();

// Extra bottom padding to sit above Android gesture navigation bar
const GESTURE_NAV_HEIGHT = Platform.OS === 'android' ? 34 : 0;

const AppNavigator = () => {
  const [theme, setTheme] = useState(getTheme());

  useEffect(() => {
    const unsubscribe = subscribeToTheme(() => setTheme(getTheme()));
    return unsubscribe;
  }, []);

  const getTabIcon = (focusedName, unfocusedName, focused, color) => (
    <View style={styles.iconContainer}>
      {focused && (
        <View style={[styles.activeIndicator, { backgroundColor: theme.activeTabIndicator }]} />
      )}
      <Ionicons
        name={focused ? focusedName : unfocusedName}
        size={24}
        color={color}
      />
    </View>
  );

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: 60 + GESTURE_NAV_HEIGHT,
            paddingBottom: GESTURE_NAV_HEIGHT + 6,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: theme.navBorder,
            backgroundColor: theme.navBg,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: theme.textPrimary,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.2,
            marginTop: 2,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused, color }) =>
              getTabIcon('home', 'home-outline', focused, color),
          }}
        />

        <Tab.Screen
          name="Expense"
          component={AddExpenseScreen}
          options={{
            tabBarLabel: 'Add',
            tabBarIcon: ({ focused, color }) =>
              getTabIcon('add-circle', 'add-circle-outline', focused, color),
          }}
        />

        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarLabel: 'History',
            tabBarIcon: ({ focused, color }) =>
              getTabIcon('time', 'time-outline', focused, color),
          }}
        />

        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{
            tabBarLabel: 'Reports',
            tabBarIcon: ({ focused, color }) =>
              getTabIcon('bar-chart', 'bar-chart-outline', focused, color),
          }}
        />

        <Tab.Screen
          name="Account"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Account',
            tabBarIcon: ({ focused, color }) =>
              getTabIcon('person', 'person-outline', focused, color),
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
    width: 36,
    height: 28,
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 3,
    borderRadius: 2,
  },
});

export default AppNavigator;