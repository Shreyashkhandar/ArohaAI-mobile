import React, { useState, useEffect } from 'react';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import { getCurrentSession, onAuthStateChange } from '../services/authService';

export default function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState('SPLASH');
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Listen for auth state changes (sign in, sign out, token refresh)
    const subscription = onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleSplashFinish = async () => {
    try {
      const activeSession = await getCurrentSession();
      if (activeSession) {
        setSession(activeSession);
      }
    } catch (e) {
      console.warn('[AppNavigator] Session restoration check failed:', e?.message || e);
    } finally {
      setCurrentScreen('LOGIN');
    }
  };

  const handleLoginSuccess = (result) => {
    console.log('[AUTH SUCCESS] User:', result.user?.email, 'Role:', result.profile?.role);
    setSession(result.session);
    // Future task will navigate to User / Counsellor dashboards based on result.profile.role
  };

  switch (currentScreen) {
    case 'SPLASH':
      return <SplashScreen onFinish={handleSplashFinish} />;
    case 'LOGIN':
    default:
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }
}
