import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F8F9FA',
  bgCard: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textGreeting: '#9CA3AF',
  border: '#E5E7EB',
  cardBg: '#000000',
  cardText: '#FFFFFF',
  navBg: '#FFFFFF',
  navBorder: '#E5E7EB',
  activeTabIndicator: '#000000',
};

export const darkTheme = {
  bgPrimary: '#0F0F0F',
  bgSecondary: '#1A1A1A',
  bgCard: '#1F1F1F',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textGreeting: '#6B7280',
  border: '#2A2A2A',
  cardBg: '#FFC107',
  cardText: '#000000',
  navBg: '#000000',
  navBorder: '#2A2A2A',
  activeTabIndicator: '#FFC107',
};

let currentTheme = 'light';
let themeListeners = [];

export const getTheme = () => {
  return currentTheme === 'dark' ? darkTheme : lightTheme;
};

export const getCurrentTheme = () => currentTheme;

export const setTheme = async (theme) => {
  currentTheme = theme;
  await AsyncStorage.setItem('appTheme', theme);
  themeListeners.forEach(listener => listener(theme));
};

export const loadTheme = async () => {
  try {
    const savedTheme = await AsyncStorage.getItem('appTheme');
    if (savedTheme) {
      currentTheme = savedTheme;
    }
  } catch (error) {
    console.error('Error loading theme:', error);
  }
  return currentTheme;
};

export const subscribeToTheme = (listener) => {
  themeListeners.push(listener);
  return () => {
    themeListeners = themeListeners.filter(l => l !== listener);
  };
};