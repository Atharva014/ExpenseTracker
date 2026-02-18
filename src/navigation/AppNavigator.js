import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path, Rect, Line, Polyline, Circle } from 'react-native-svg';
import HomeScreen from '../screens/HomeScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { getTheme, subscribeToTheme } from '../utils/theme';

const Tab = createBottomTabNavigator();
const GESTURE_NAV_HEIGHT = Platform.OS === 'android' ? 34 : 0;

const S = 24; // icon size
const SW = 2;  // stroke width — bold like reference

// ── Home icon: plain house, no chimney ───────────────────────────────────────
const HomeIcon = ({ color }) => (
  <Svg width={S} height={S} viewBox="0 0 24 24" fill="none">
    {/* Roof */}
    <Polyline points="2,11 12,3 22,11"
      stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    {/* Walls */}
    <Path d="M4 11 L4 21 L20 21 L20 11"
      stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
    {/* Door */}
    <Path d="M9 21 L9 15 Q9 13 11 13 L13 13 Q15 13 15 15 L15 21"
      stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Add icon: circle with plus ────────────────────────────────────────────────
const AddIcon = ({ color }) => (
  <Svg width={S} height={S} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9"
      stroke={color} strokeWidth={SW} />
    <Line x1="12" y1="8" x2="12" y2="16"
      stroke={color} strokeWidth={SW} strokeLinecap="round" />
    <Line x1="8" y1="12" x2="16" y2="12"
      stroke={color} strokeWidth={SW} strokeLinecap="round" />
  </Svg>
);

// ── History icon: clock ───────────────────────────────────────────────────────
const HistoryIcon = ({ color }) => (
  <Svg width={S} height={S} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9"
      stroke={color} strokeWidth={SW} />
    {/* Hour hand */}
    <Line x1="12" y1="12" x2="12" y2="7"
      stroke={color} strokeWidth={SW} strokeLinecap="round" />
    {/* Minute hand */}
    <Line x1="12" y1="12" x2="16" y2="12"
      stroke={color} strokeWidth={SW} strokeLinecap="round" />
  </Svg>
);

// ── Reports icon: bar chart (matches reference closely) ──────────────────────
const ReportsIcon = ({ color }) => (
  <Svg width={S} height={S} viewBox="0 0 24 24" fill="none">
    {/* Bar 1 - short */}
    <Rect x="3" y="14" width="4" height="7" rx="1"
      stroke={color} strokeWidth={SW} />
    {/* Bar 2 - tall */}
    <Rect x="10" y="6" width="4" height="15" rx="1"
      stroke={color} strokeWidth={SW} />
    {/* Bar 3 - medium */}
    <Rect x="17" y="10" width="4" height="11" rx="1"
      stroke={color} strokeWidth={SW} />
  </Svg>
);

// ── Account icon: person ──────────────────────────────────────────────────────
const AccountIcon = ({ color }) => (
  <Svg width={S} height={S} viewBox="0 0 24 24" fill="none">
    {/* Head */}
    <Circle cx="12" cy="8" r="4"
      stroke={color} strokeWidth={SW} />
    {/* Shoulders */}
    <Path d="M4 20 C4 16 7 14 12 14 C17 14 20 16 20 20"
      stroke={color} strokeWidth={SW} strokeLinecap="round" />
  </Svg>
);

// ── Wrapper with active indicator ─────────────────────────────────────────────
const TabIcon = ({ Icon, focused }) => {
  const color = focused ? '#FFFFFF' : '#8B9BAE';
  return (
    <View style={styles.iconWrap}>
      {focused && <View style={styles.activeDot} />}
      <Icon color={color} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const AppNavigator = () => {
  const [theme, setTheme] = useState(getTheme());

  useEffect(() => {
    const unsubscribe = subscribeToTheme(() => setTheme(getTheme()));
    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: 60 + GESTURE_NAV_HEIGHT,
            paddingBottom: GESTURE_NAV_HEIGHT + 6,
            paddingTop: 6,
            paddingHorizontal: 12,        // breathing room on left & right edges
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.08)',
            backgroundColor: theme.navBg,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarItemStyle: {
            marginHorizontal: -4,         // pull items closer together
          },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#8B9BAE',
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
            tabBarIcon: ({ focused }) => <TabIcon Icon={HomeIcon} focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Expense"
          component={AddExpenseScreen}
          options={{
            tabBarLabel: 'Add',
            tabBarIcon: ({ focused }) => <TabIcon Icon={AddIcon} focused={focused} />,
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarLabel: 'History',
            tabBarIcon: ({ focused }) => <TabIcon Icon={HistoryIcon} focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{
            tabBarLabel: 'Reports',
            tabBarIcon: ({ focused }) => <TabIcon Icon={ReportsIcon} focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Account"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Account',
            tabBarIcon: ({ focused }) => <TabIcon Icon={AccountIcon} focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 30,
  },
  activeDot: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});

export default AppNavigator;