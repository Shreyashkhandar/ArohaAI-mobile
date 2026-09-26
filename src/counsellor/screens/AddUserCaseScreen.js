import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../shared/theme/theme';
import { getAvailableUserProfiles, createCase } from '../services/caseService';

export default function AddUserCaseScreen({ onCancel, onCaseCreated }) {
  const [step, setStep] = useState(1); // 1: User Info, 2: Consent, 3: Case Info
  const [profiles, setProfiles] = useState([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [hasConsented, setHasConsented] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadProfiles() {
      setIsLoadingProfiles(true);
      const userProfiles = await getAvailableUserProfiles();
      if (isMounted) {
        setProfiles(userProfiles);
        if (userProfiles.length > 0) {
          setSelectedUserId(userProfiles[0].id || userProfiles[0].user_id);
        }
        setIsLoadingProfiles(false);
      }
    }
    loadProfiles();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNextToConsent = () => {
    setErrorMessage('');
    if (!selectedUserId && !customEmail.trim()) {
      setErrorMessage('Please select an existing user profile or enter an email address.');
      return;
    }
    setStep(2);
  };

  const handleNextToCaseInfo = () => {
    setErrorMessage('');
    if (!hasConsented) {
      setErrorMessage('Consent is required before proceeding to case creation.');
      return;
    }
    setStep(3);
  };

  const handleCreateCase = async () => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      let targetUserId = selectedUserId;

      // If user selected from dropdown/list
      if (!targetUserId && customEmail.trim()) {
        const matched = profiles.find(
          (p) => p.email?.toLowerCase() === customEmail.trim().toLowerCase()
        );
        if (matched) {
          targetUserId = matched.id || matched.user_id;
        }
      }

      if (!targetUserId) {
        throw new Error(
          'Target user profile record not found. User must register their account first.'
        );
      }

      await createCase({
        userId: targetUserId,
        notes: notes,
      });

      if (onCaseCreated) {
        onCaseCreated();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create case. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add User & Create Case</Text>
        <Text style={styles.headerSubtitle}>
          Step {step} of 3: {step === 1 ? 'User Information' : step === 2 ? 'Consent' : 'Initial Case Information'}
        </Text>
      </View>

      {/* Error Message Banner */}
      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* STEP 1: User Information */}
      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>User Information</Text>
          <Text style={styles.cardDescription}>
            Select an existing registered user profile to link with this case.
          </Text>

          {isLoadingProfiles ? (
            <ActivityIndicator color={COLORS.primary} size="medium" style={{ marginVertical: 20 }} />
          ) : profiles.length > 0 ? (
            <View style={styles.profileList}>
              <Text style={styles.inputLabel}>Select Registered User Profile</Text>
              {profiles.map((p) => {
                const uid = p.id || p.user_id;
                const isSelected = selectedUserId === uid;
                return (
                  <TouchableOpacity
                    key={uid}
                    style={[styles.profileOption, isSelected && styles.profileOptionSelected]}
                    onPress={() => setSelectedUserId(uid)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioDot}>
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                    <View style={styles.profileInfo}>
                      <Text style={styles.profileName}>{p.full_name || 'User Account'}</Text>
                      <Text style={styles.profileEmail}>{p.email}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.formSection}>
              <Text style={styles.noticeText}>
                No registered user profiles found yet. Users must register in the application first.
              </Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor="#8A9D93"
                  value={customName}
                  onChangeText={setCustomName}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter user email"
                  placeholderTextColor="#8A9D93"
                  value={customEmail}
                  onChangeText={setCustomEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor="#8A9D93"
                  value={customPhone}
                  onChangeText={setCustomPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, (!selectedUserId && !customEmail.trim()) && styles.buttonDisabled]}
            onPress={handleNextToConsent}
            disabled={!selectedUserId && !customEmail.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Next: Consent →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 2: Consent */}
      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Consent</Text>
          <Text style={styles.cardDescription}>
            Confirm user consent before creating the support case.
          </Text>

          <TouchableOpacity
            style={[styles.consentRow, hasConsented && styles.consentRowSelected]}
            onPress={() => setHasConsented(!hasConsented)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, hasConsented && styles.checkboxChecked]}>
              {hasConsented && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              I understand and consent to participation in this support program.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, !hasConsented && styles.buttonDisabled]}
            onPress={handleNextToCaseInfo}
            disabled={!hasConsented}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Continue to Case Info →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => setStep(1)} activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>← Back to User Info</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 3: Initial Case Information */}
      {step === 3 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Initial Case Information</Text>
          <Text style={styles.cardDescription}>
            Enter initial notes regarding this case assignment.
          </Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Initial Notes</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter initial case notes or observations..."
              placeholderTextColor="#8A9D93"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleCreateCase}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.buttonText} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Case</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => setStep(2)} disabled={isSubmitting} activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>← Back to Consent</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSubtle,
  },
  errorCard: {
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#9B1C1C',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 22,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginBottom: 20,
    lineHeight: 18,
  },
  noticeText: {
    fontSize: 13,
    color: COLORS.textSubtle,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    lineHeight: 18,
  },
  profileList: {
    marginBottom: 20,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  profileOptionSelected: {
    backgroundColor: COLORS.selectedCardBg,
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  formSection: {
    marginBottom: 16,
  },
  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 14,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 110,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  consentRowSelected: {
    backgroundColor: COLORS.selectedCardBg,
    borderColor: COLORS.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  consentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: COLORS.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: COLORS.textSubtle,
    fontWeight: '600',
  },
});
