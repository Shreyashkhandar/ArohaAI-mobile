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
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/colors';
import ArohaLogo from '../components/ArohaLogo';
import { resetPasswordForEmail } from '../services/authService';

export default function ForgotPasswordScreen({ onNavigateToLogin }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleResetPress = async () => {
    Keyboard.dismiss();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await resetPasswordForEmail(email);
      setSuccessMessage('A password reset link has been sent to your email address.');
    } catch (err) {
      setErrorMessage(err.message || 'Unable to request password reset. Please check your email.');
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
          <View style={styles.container}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <ArohaLogo size={80} />
            </View>

            {/* Heading */}
            <Text style={styles.heading}>Reset Password</Text>
            <Text style={styles.subheading}>
              Enter your email address to receive a password reset link.
            </Text>

            {/* Error / Success Banners */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {/* Form Section */}
            <View style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your registered email"
                  placeholderTextColor="#8A9D93"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage('');
                    if (successMessage) setSuccessMessage('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  accessibilityLabel="Email input field"
                />
              </View>

              <TouchableOpacity
                style={[styles.resetButton, isLoading && styles.buttonDisabled]}
                onPress={handleResetPress}
                activeOpacity={0.8}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Send Reset Link"
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.buttonText} size="small" />
                ) : (
                  <Text style={styles.resetButtonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backLink}
                onPress={onNavigateToLogin}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Back to Login"
              >
                <Text style={styles.backLinkText}>← Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  heading: {
    fontSize: 26,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textSubtle,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 12,
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
  successContainer: {
    width: '100%',
    backgroundColor: '#EDF7F2',
    borderWidth: 1,
    borderColor: '#A8C3B8',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  successText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 18,
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 52,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 54,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: COLORS.buttonText,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  backLink: {
    marginTop: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
