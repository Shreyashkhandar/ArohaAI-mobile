import React, { useState, useEffect } from 'react';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import UserNavigator from '../user/navigation/UserNavigator';
import CounsellorNavigator from '../counsellor/navigation/CounsellorNavigator';
import { getCurrentSession, getUserProfile, onAuthStateChange } from '../shared/services/authService';
import { ROLES } from '../shared/types/roles';

export default function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState('SPLASH');
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Listen for auth state changes (sign in, sign out, token refresh)
    const subscription = onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      if (event === 'SIGNED_OUT' || !currentSession) {
        setSession(null);
        setUserProfile(null);
        setCurrentUser(null);
        setCurrentScreen('LOGIN');
      } else if (currentSession?.user) {
        setCurrentUser(currentSession.user);
        const profile = await getUserProfile(currentSession.user.id);
        setUserProfile(profile);
      }
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
      if (activeSession && activeSession.user) {
        setSession(activeSession);
        setCurrentUser(activeSession.user);
        const profile = await getUserProfile(activeSession.user.id);
        setUserProfile(profile);

        const normalizedRole = String(profile?.role || '').toLowerCase();
        if (normalizedRole === ROLES.COUNSELLOR) {
          setCurrentScreen('COUNSELLOR_HOME');
        } else {
          setCurrentScreen('USER_HOME');
        }
        return;
      }
    } catch (e) {
      console.warn('[AppNavigator] Initial session check warning:', e?.message || e);
    }
    setCurrentScreen('LOGIN');
  };

  const handleAuthSuccess = (result) => {
    setSession(result.session);
    setCurrentUser(result.user);
    setUserProfile(result.profile);

    const normalizedRole = String(result.profile?.role || '').toLowerCase();
    if (normalizedRole === ROLES.COUNSELLOR) {
      setCurrentScreen('COUNSELLOR_HOME');
    } else {
      setCurrentScreen('USER_HOME');
    }
  };

  const handleLogoutSuccess = () => {
    setSession(null);
    setUserProfile(null);
    setCurrentUser(null);
    setCurrentScreen('LOGIN');
  };

  switch (currentScreen) {
    case 'SPLASH':
      return <SplashScreen onFinish={handleSplashFinish} />;

    case 'REGISTER':
      return (
        <RegisterScreen
          onNavigateToLogin={() => setCurrentScreen('LOGIN')}
          onRegisterSuccess={handleAuthSuccess}
        />
      );

    case 'FORGOT_PASSWORD':
      return (
        <ForgotPasswordScreen
          onNavigateToLogin={() => setCurrentScreen('LOGIN')}
        />
      );

    case 'USER_HOME':
      if (!session && !currentUser) {
        return (
          <LoginScreen
            onLoginSuccess={handleAuthSuccess}
            onNavigateToRegister={() => setCurrentScreen('REGISTER')}
            onNavigateToForgotPassword={() => setCurrentScreen('FORGOT_PASSWORD')}
          />
        );
      }
      return (
        <UserNavigator
          profile={userProfile}
          user={currentUser}
          onLogoutSuccess={handleLogoutSuccess}
        />
      );

    case 'COUNSELLOR_HOME':
      if (!session && !currentUser) {
        return (
          <LoginScreen
            onLoginSuccess={handleAuthSuccess}
            onNavigateToRegister={() => setCurrentScreen('REGISTER')}
            onNavigateToForgotPassword={() => setCurrentScreen('FORGOT_PASSWORD')}
          />
        );
      }
      return (
        <CounsellorNavigator
          profile={userProfile}
          user={currentUser}
          onLogoutSuccess={handleLogoutSuccess}
        />
      );

    case 'LOGIN':
    default:
      return (
        <LoginScreen
          onLoginSuccess={handleAuthSuccess}
          onNavigateToRegister={() => setCurrentScreen('REGISTER')}
          onNavigateToForgotPassword={() => setCurrentScreen('FORGOT_PASSWORD')}
        />
      );
  }
}

