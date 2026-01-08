import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../types';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import CallHistoryScreen from '../screens/CallHistoryScreen';
import CallDetailsScreen from '../screens/CallDetailsScreen';
import CasesScreen from '../screens/CasesScreen';
import CaseDetailsScreen from '../screens/CaseDetailsScreen';
import CreateCaseScreen from '../screens/CreateCaseScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    console.log('🚀 AppNavigator: Initializing auth check...');

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        console.log('📱 AppNavigator: Got session response');
        console.log('Session:', session ? '✅ Found' : '❌ None');
        console.log('Error:', error ? `❌ ${error.message}` : '✅ None');

        if (error) {
          console.error('❌ Session error:', error);
          console.log('🧹 Clearing corrupted session data...');
          // Clear any corrupted session data
          supabase.auth.signOut();
        }
        setIsAuthenticated(!!session);
        console.log('✅ Auth state set:', !!session ? 'Authenticated' : 'Not authenticated');
      })
      .catch((error) => {
        console.error('❌ CRITICAL: Failed to get session:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        setIsAuthenticated(false);
      });

    console.log('👂 Setting up auth state change listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 Auth state changed:', _event, session ? 'Has session' : 'No session');
      setIsAuthenticated(!!session);
    });

    return () => {
      console.log('🛑 Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null) {
    return null; // Loading state
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CallHistory" component={CallHistoryScreen} />
            <Stack.Screen name="CallDetails" component={CallDetailsScreen} />
            <Stack.Screen name="Cases" component={CasesScreen} />
            <Stack.Screen name="CaseDetails" component={CaseDetailsScreen} />
            <Stack.Screen name="CreateCase" component={CreateCaseScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
