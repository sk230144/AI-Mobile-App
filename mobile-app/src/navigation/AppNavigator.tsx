import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Import all screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import CallHistoryScreen from '../screens/CallHistoryScreen';
import CallDetailsScreen from '../screens/CallDetailsScreen';
import CasesScreen from '../screens/CasesScreen';
import CaseDetailsScreen from '../screens/CaseDetailsScreen';
import CreateCaseScreen from '../screens/CreateCaseScreen';

// Screen names for navigation
type ScreenName =
  | 'Login'
  | 'Signup'
  | 'Home'
  | 'CallHistory'
  | 'CallDetails'
  | 'Cases'
  | 'CaseDetails'
  | 'CreateCase';

// Navigation params for screens that require them
interface NavigationParams {
  CallDetails?: { callId: string };
  CaseDetails?: { caseId: string };
  [key: string]: any;
}

export default function AppNavigator() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Current screen state
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Login');

  // Navigation params state
  const [params, setParams] = useState<NavigationParams>({});

  // Check for existing session on mount and listen for auth changes
  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Session error:', error);
          supabase.auth.signOut();
        }
        setIsAuthenticated(!!session);
      })
      .catch((error) => {
        console.error('Failed to get session:', error);
        setIsAuthenticated(false);
      });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);

      // Reset to appropriate screen on auth change
      if (session) {
        setCurrentScreen('Home');
      } else {
        setCurrentScreen('Login');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Navigation object to pass to screens
  const navigation = {
    navigate: (screen: ScreenName, screenParams?: any) => {
      setCurrentScreen(screen);
      if (screenParams) {
        setParams(screenParams);
      }
    },
    goBack: () => {
      // Default back navigation based on current screen
      if (currentScreen === 'Signup') {
        setCurrentScreen('Login');
      } else if (isAuthenticated) {
        setCurrentScreen('Home');
      } else {
        setCurrentScreen('Login');
      }
    },
  };

  // Render current screen based on authentication and navigation state
  if (!isAuthenticated) {
    // Unauthenticated screens
    switch (currentScreen) {
      case 'Signup':
        return <SignupScreen navigation={navigation as any} />;
      default:
        return <LoginScreen navigation={navigation as any} />;
    }
  }

  // Authenticated screens
  switch (currentScreen) {
    case 'CallHistory':
      return <CallHistoryScreen navigation={navigation as any} />;
    case 'CallDetails':
      return <CallDetailsScreen navigation={navigation as any} route={{ params: params.CallDetails } as any} />;
    case 'Cases':
      return <CasesScreen navigation={navigation as any} />;
    case 'CaseDetails':
      return <CaseDetailsScreen navigation={navigation as any} route={{ params: params.CaseDetails } as any} />;
    case 'CreateCase':
      return <CreateCaseScreen navigation={navigation as any} />;
    default:
      return <HomeScreen navigation={navigation as any} />;
  }
}
