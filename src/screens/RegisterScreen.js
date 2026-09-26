import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  ScrollView,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/colors';
import ArohaLogo from '../components/ArohaLogo';
import RoleDropdown from '../components/RoleDropdown';
import { registerWithEmail } from '../services/authService';

export default function RegisterScreen({ onNavigateToLogin, onRegisterSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('User');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegisterPress = async () => {
    Keyboard.dismiss();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await registerWithEmail({
        fullName,
        email,
        password,
        confirmPassword,
        role,
      });
      if (onRegisterSuccess) {
        onRegisterSuccess(result);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.container}>
              {/* Logo Section */}
              <View style={styles.logoContainer}>
                <ArohaLogo size={72} />
              </View>

              {/* Heading */}
              <Text style={styles.heading}>Create Account</Text>

              {/* Error Banner */}
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Form Section */}
              <View style={styles.formContainer}>
                {/* Full Name */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#8A9D93"
                    value={fullName}
                    onChangeText={(val) => {
                      setFullName(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoCapitalize="words"
                    editable={!isLoading}
                    accessibilityLabel="Full name input field"
                  />
                </View>

                {/* Email Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#8A9D93"
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    accessibilityLabel="Email input field"
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password (min 6 characters)"
                    placeholderTextColor="#8A9D93"
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!isLoading}
                    accessibilityLabel="Password input field"
                  />
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter password"
                    placeholderTextColor="#8A9D93"
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!isLoading}
                    accessibilityLabel="Confirm password input field"
                  />
                </View>

                {/* Role Selector */}
                <RoleDropdown
                  label="Select Role"
                  options={['User', 'Counsellor']}
                  selectedOption={role}
                  onSelect={(selected) => {
                    setRole(selected);
                    if (errorMessage) setErrorMessage('');
                  }}
                />

                {/* Register Button */}
                <TouchableOpacity
                  style={[styles.registerButton, isLoading && styles.buttonDisabled]}
                  onPress={handleRegisterPress}
                  activeOpacity={0.8}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Create Account"
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.buttonText} size="small" />
                  ) : (
                    <Text style={styles.registerButtonText}>Register</Text>
                  )}
                </TouchableOpacity>

                {/* Navigation Link to Login */}
                <TouchableOpacity
                  style={styles.loginLink}
                  onPress={onNavigateToLogin}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Already have an account? Login"
                >
                  <Text style={styles.loginLinkText}>
                    Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 14,
    alignItems: 'center',
  },
  heading: {
    fontSize: 26,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  errorText: {
    color: '#9B1C1C',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 14,
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 48,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 52,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: COLORS.buttonText,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loginLink: {
    marginTop: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: COLORS.textSubtle,
  },
  loginLinkBold: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
