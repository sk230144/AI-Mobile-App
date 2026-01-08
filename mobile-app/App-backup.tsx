// Backup of current App.tsx
console.log('========================================');
console.log('🚀 APP.TSX - Starting import');
console.log('========================================');

import React from 'react';
console.log('✅ Step 1: React imported');

import { StatusBar } from 'expo-status-bar';
console.log('✅ Step 2: StatusBar imported');

import { View, Text, StyleSheet } from 'react-native';
console.log('✅ Step 3: React Native components imported');

console.log('⏳ Step 4: About to import AppNavigator...');
import AppNavigator from './src/navigation/AppNavigator';
console.log('✅ Step 4: AppNavigator imported successfully');

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    console.log('🛡️ ErrorBoundary: Constructor called');
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('========================================');
    console.error('🔥 ERROR BOUNDARY CAUGHT AN ERROR!');
    console.error('========================================');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('========================================');
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔥 componentDidCatch called');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
  }

  render() {
    console.log('🛡️ ErrorBoundary: render() called, hasError =', this.state.hasError);

    if (this.state.hasError && this.state.error) {
      console.log('🛡️ ErrorBoundary: Rendering error UI');
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>App Error</Text>
          <Text style={styles.errorMessage}>{this.state.error.toString()}</Text>
          <Text style={styles.errorStack}>{this.state.error.stack}</Text>
        </View>
      );
    }

    console.log('🛡️ ErrorBoundary: Rendering children');
    return this.props.children;
  }
}

console.log('✅ Step 5: ErrorBoundary class defined');

export default function App() {
  console.log('========================================');
  console.log('🎬 APP FUNCTION: Starting render');
  console.log('========================================');

  try {
    console.log('⏳ About to render ErrorBoundary + AppNavigator...');
    const result = (
      <ErrorBoundary>
        <AppNavigator />
        <StatusBar style="auto" />
      </ErrorBoundary>
    );
    console.log('✅ JSX created successfully, returning...');
    return result;
  } catch (error) {
    console.error('========================================');
    console.error('💥 CRITICAL ERROR IN APP RENDER!');
    console.error('========================================');
    console.error('Error:', error);
    throw error;
  }
}

console.log('✅ Step 6: App function exported');
console.log('========================================');

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffe6e6',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d00',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#900',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorStack: {
    fontSize: 12,
    color: '#600',
    fontFamily: 'monospace',
  },
});
