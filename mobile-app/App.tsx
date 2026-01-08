import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🔥 ERROR BOUNDARY CAUGHT:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔥 ERROR DETAILS:', error);
    console.error('🔥 ERROR INFO:', errorInfo);
    console.error('🔥 ERROR STACK:', error.stack);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>App Error</Text>
          <Text style={styles.errorMessage}>{this.state.error.toString()}</Text>
          <Text style={styles.errorStack}>{this.state.error.stack}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  console.log('🎬 App component rendering...');

  return (
    <ErrorBoundary>
      <AppNavigator />
      <StatusBar style="auto" />
    </ErrorBoundary>
  );
}

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
