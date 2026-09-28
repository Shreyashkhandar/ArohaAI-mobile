import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import SplashScreen from '../screens/SplashScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import UserLoginScreen from '../screens/UserLoginScreen';
import CounsellorLoginScreen from '../screens/CounsellorLoginScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import UserNavigator from '../user/navigation/UserNavigator';
import CounsellorNavigator from '../counsellor/navigation/CounsellorNavigator';
import { getCurrentAuthSession, getUserProfile, onAuthStateChange } from '../shared/services/authService';
import { ROLES } from '../shared/types/roles';
import { COLORS } from '../shared/theme/theme';
import { APP_CONFIG } from '../shared/config/appConfig';
import {
  DEMO_COUNSELLOR_USER,
  DEMO_COUNSELLOR_PROFILE,
  DEMO_USER,
  DEMO_USER_PROFILE,
} from '../shared/demo/demoData';

export default function AppNavigator() {
  const [authState, setAuthState] = useState('AUTH_INITIALIZING'); // 'AUTH_INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED'
  const [currentScreen, setCurrentScreen] = useState('SPLASH');
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (APP_CONFIG.presentationMode) {
      setAuthState('UNAUTHENTICATED');
      return;
    }

    // Single application-level listener for auth state changes (Production Mode)
    const subscription = onAuthStateChange(async (event, currentSession) => {
      console.log('[AUTH] Event:', event, '| Session present:', Boolean(currentSession));

      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setSession(null);
          setUserProfile(null);
          setCurrentUser(null);
          setAuthState('UNAUTHENTICATED');
          setCurrentScreen('ROLE_SELECTION');
        }
      } else if (event === 'TOKEN_REFRESHED') {
        if (isMounted && currentSession?.user) {
          setSession(currentSession);
          setCurrentUser(currentSession.user);
        }
      } else if (currentSession?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        setSession(currentSession);
        setCurrentUser(currentSession.user);

        let profile = await getUserProfile(currentSession.user.id);
        if (!profile && currentSession.user.user_metadata?.role) {
          profile = {
            id: currentSession.user.id,
            email: currentSession.user.email,
            role: currentSession.user.user_metadata.role,
            full_name: currentSession.user.user_metadata?.full_name || 'User',
          };
        }

        if (isMounted) {
          if (profile) {
            setUserProfile(profile);
            const normalizedRole = String(profile.role || '').toLowerCase();
            setAuthState('AUTHENTICATED');
            if (normalizedRole === ROLES.COUNSELLOR) {
              setCurrentScreen('COUNSELLOR_HOME');
            } else {
              setCurrentScreen('USER_HOME');
            }
          } else {
            setAuthState('UNAUTHENTICATED');
            setCurrentScreen('ROLE_SELECTION');
          }
        }
      } else if (event === 'INITIAL_SESSION' && !currentSession) {
        if (isMounted) {
          setSession(null);
          setUserProfile(null);
          setCurrentUser(null);
          setAuthState('UNAUTHENTICATED');
          setCurrentScreen('ROLE_SELECTION');
        }
      }
    });

    return () => {
      isMounted = false;
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleSplashFinish = async () => {
    if (APP_CONFIG.presentationMode) {
      setAuthState('UNAUTHENTICATED');
      setCurrentScreen('ROLE_SELECTION');
      return;
    }

    try {
      const activeSession = await getCurrentAuthSession();
      if (activeSession && activeSession.user) {
        setSession(activeSession);
        setCurrentUser(activeSession.user);
        let profile = await getUserProfile(activeSession.user.id);
        if (!profile && activeSession.user.user_metadata?.role) {
          profile = {
            id: activeSession.user.id,
            email: activeSession.user.email,
            role: activeSession.user.user_metadata.role,
            full_name: activeSession.user.user_metadata?.full_name || 'User',
          };
        }

        if (profile) {
          setUserProfile(profile);
          const normalizedRole = String(profile.role || '').toLowerCase();
          setAuthState('AUTHENTICATED');
          if (normalizedRole === ROLES.COUNSELLOR) {
            setCurrentScreen('COUNSELLOR_HOME');
            return;
          } else {
            setCurrentScreen('USER_HOME');
            return;
          }
        }
      }
    } catch (e) {
      console.warn('[AppNavigator] Initial session restoration warning:', e?.message || e);
    }
    setAuthState('UNAUTHENTICATED');
    setCurrentScreen('ROLE_SELECTION');
  };

  const handleAuthSuccess = (result) => {
    setSession(result.session || { user: result.user });
    setCurrentUser(result.user);
    setUserProfile(result.profile);
    setAuthState('AUTHENTICATED');

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
    setAuthState('UNAUTHENTICATED');
    setCurrentScreen('ROLE_SELECTION');
  };

  if (authState === 'AUTH_INITIALIZING' && currentScreen !== 'SPLASH') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing ArohaAI...</Text>
      </View>
    );
  }

  switch (currentScreen) {
    case 'SPLASH':
      return <SplashScreen onFinish={handleSplashFinish} />;

    case 'ROLE_SELECTION':
      return (
        <RoleSelectionScreen
          onSelectRole={(selectedRole) => {
            if (selectedRole === 'COUNSELLOR') {
              setCurrentScreen('COUNSELLOR_LOGIN');
            } else {
              setCurrentScreen('USER_LOGIN');
            }
          }}
        />
      );

    case 'COUNSELLOR_LOGIN':
      return (
        <CounsellorLoginScreen
          onBack={() => setCurrentScreen('ROLE_SELECTION')}
          onLoginSuccess={handleAuthSuccess}
        />
      );

    case 'USER_LOGIN':
      return (
        <UserLoginScreen
          onBack={() => setCurrentScreen('ROLE_SELECTION')}
          onLoginSuccess={handleAuthSuccess}
        />
      );

    case 'REGISTER':
      return (
        <RegisterScreen
          onNavigateToLogin={() => setCurrentScreen('ROLE_SELECTION')}
          onRegisterSuccess={handleAuthSuccess}
        />
      );

    case 'FORGOT_PASSWORD':
      return (
        <ForgotPasswordScreen
          onNavigateToLogin={() => setCurrentScreen('ROLE_SELECTION')}
        />
      );

    case 'USER_HOME':
      if (!session && !currentUser && !APP_CONFIG.presentationMode) {
        return (
          <RoleSelectionScreen
            onSelectRole={(role) => {
              setCurrentScreen(role === 'COUNSELLOR' ? 'COUNSELLOR_LOGIN' : 'USER_LOGIN');
            }}
          />
        );
      }
      return (
        <UserNavigator
          profile={userProfile || (APP_CONFIG.presentationMode ? DEMO_USER_PROFILE : null)}
          user={currentUser || (APP_CONFIG.presentationMode ? DEMO_USER : null)}
          onLogoutSuccess={handleLogoutSuccess}
        />
      );

    case 'COUNSELLOR_HOME':
      if (!session && !currentUser && !APP_CONFIG.presentationMode) {
        return (
          <RoleSelectionScreen
            onSelectRole={(role) => {
              setCurrentScreen(role === 'COUNSELLOR' ? 'COUNSELLOR_LOGIN' : 'USER_LOGIN');
            }}
          />
        );
      }
      return (
        <CounsellorNavigator
          profile={userProfile || (APP_CONFIG.presentationMode ? DEMO_COUNSELLOR_PROFILE : null)}
          user={currentUser || (APP_CONFIG.presentationMode ? DEMO_COUNSELLOR_USER : null)}
          onLogoutSuccess={handleLogoutSuccess}
        />
      );

    case 'LOGIN':
    default:
      return (
        <RoleSelectionScreen
          onSelectRole={(role) => {
            setCurrentScreen(role === 'COUNSELLOR' ? 'COUNSELLOR_LOGIN' : 'USER_LOGIN');
          }}
        />
      );
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSubtle,
    fontWeight: '500',
  },
});
