import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  bgPrimary: '#F5F7FA',
  bgSecondary: '#ECEEF2',
  bgCard: '#FFFFFF',
  bgElevated: '#F0F2F5',
  textPrimary: '#1A202C',
  textSecondary: '#718096',
  textGreeting: '#A0AEC0',
  textMuted: '#A0AEC0',
  border: 'rgba(0,0,0,0.07)',
  cardBg: '#1A202C',
  cardText: '#FFFFFF',
  navBg: '#FFFFFF',
  navBorder: 'rgba(0,0,0,0.07)',
  activeTabIndicator: '#1A202C',
  red: '#E53E3E',
  green: '#38A169',
  ringTrack: 'rgba(0,0,0,0.07)',
  ringFill: '#1A202C',
};

export const darkTheme = {
  bgPrimary: '#1C2128',
  bgSecondary: '#252D38',
  bgCard: '#2D3748',
  bgElevated: '#323D4E',
  textPrimary: '#F0F4F8',
  textSecondary: '#8B9BAE',
  textGreeting: '#566475',
  textMuted: '#566475',
  border: 'rgba(255,255,255,0.07)',
  cardBg: '#252D38',
  cardText: '#F0F4F8',
  navBg: '#181F29',
  navBorder: 'rgba(255,255,255,0.07)',
  activeTabIndicator: '#FFFFFF',
  red: '#FF6B6B',
  green: '#4ECDC4',
  ringTrack: 'rgba(255,255,255,0.08)',
  ringFill: '#FFFFFF',
};

let currentTheme = 'dark';
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