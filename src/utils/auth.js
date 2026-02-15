import { Alert } from 'react-native';

// Simple password/PIN based authentication (lightweight alternative)
let isAuthenticated = false;

export const isBiometricAvailable = async () => {
  // For now, we'll use simple unlock without biometric
  return false;
};

export const authenticateWithBiometric = async () => {
  // Simulate authentication - always return true for now
  // Later you can add PIN code here
  isAuthenticated = true;
  return true;
};

export const logout = () => {
  isAuthenticated = false;
};

export const checkAuthentication = () => {
  return isAuthenticated;
};