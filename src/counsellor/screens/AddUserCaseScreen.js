import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS } from '../../shared/theme/theme';
import Icon from '../../shared/components/Icon';
import { getAvailableUserProfiles, registerVictimAndCreateCase } from '../services/caseService';
import { ASSESSMENT_DIMENSIONS } from '../services/assessmentService';

export default function AddUserCaseScreen({ onCancel, onCaseCreated }) {
  const [step, setStep] = useState(1); // 1: Personal Details, 2: Consent, 3: Case Info, 4: Assessment, 5: Confirmation

  // Profiles & Selection
  const [profiles, setProfiles] = useState([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');

  // A. Personal Details
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [address, setAddress] = useState('');

  // B. Case Information
  const [caseId, setCaseId] = useState(`CASE-${Math.floor(100000 + Math.random() * 900000)}`);
  const [caseStage, setCaseStage] = useState('active'); // active, assessment, follow_up, closed
  const [context, setContext] = useState('');

  // C. Consent
  const [hasConsented, setHasConsented] = useState(true);
  const [consentDate] = useState(new Date().toLocaleString());

  // D. Assessment & Baseline
  const [assessmentData, setAssessmentData] = useState({
    sleep: 'Regular',
    emotional: 'Calm',
    social: 'Connected',
    communication: 'None',
    observations: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadProfiles() {
      setIsLoadingProfiles(true);
      const userProfiles = await getAvailableUserProfiles();
      if (isMounted) {
        setProfiles(userProfiles);
        setIsLoadingProfiles(false);
      }
    }
    loadProfiles();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectProfile = (p) => {
    const uid = p.id;
    if (selectedUserId === uid) {
      setSelectedUserId('');
    } else {
      setSelectedUserId(uid);
      setFullName(p.full_name || '');
      setEmail(p.email || '');
      setPhone(p.phone || '');
    }
  };

  const handleNextToConsent = () => {
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage("Please enter the victim's full name.");
      return;
    }

    if (!phone.trim()) {
      setErrorMessage("Please enter the victim's phone number.");
      return;
    }

    const phoneRegex = /^[\d\s+\-()]{8,16}$/;
    if (!phoneRegex.test(phone.trim())) {
      setErrorMessage('Please enter a valid phone number (e.g. +91 9876543210).');
      return;
    }

    if (!dob.trim()) {
      setErrorMessage("Please enter the victim's date of birth (YYYY-MM-DD).");
      return;
    }

    if (!gender) {
      setErrorMessage("Please select the victim's gender.");
      return;
    }

    if (!preferredLanguage) {
      setErrorMessage('Please select the preferred language.');
      return;
    }

    if (!address.trim()) {
      setErrorMessage("Please enter the victim's location / address.");
      return;
    }

    setStep(2);
  };

  const handleNextToCaseInfo = () => {
    setErrorMessage('');
    if (!hasConsented) {
      setErrorMessage('Consent must be explained and recorded before proceeding.');
      return;
    }
    setStep(3);
  };

  const handleNextToAssessment = () => {
    setErrorMessage('');
    setStep(4);
  };

  const handleRegisterAndCreateCase = async () => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await registerVictimAndCreateCase({
        fullName,
        phone,
        email,
        dob,
        gender,
        preferredLanguage,
        address,
        caseId,
        caseStage,
        hasConsented,
        consentDate,
        context,
        assessmentData,
      });

      // Transition to Step 5 (Confirmation Screen)
      setStep(5);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to complete victim registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackStep = () => {
    setErrorMessage('');
    if (step > 1 && step < 5) {
      setStep(step - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackStep} activeOpacity={0.7} accessibilityLabel="Go back step">
              <Icon name="arrow-back" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.backButtonText}>
                {step === 1 ? 'Dashboard' : `Back to Step ${step - 1}`}
              </Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Counsellor Victim Registration</Text>
            <Text style={styles.headerSubtitle}>
              {step === 5
                ? 'Registration Complete'
                : `Step ${step} of 4: ${step === 1 ? 'Personal Details' : step === 2 ? 'Consent Record' : step === 3 ? 'Case Details' : 'Baseline Assessment'}`}
            </Text>
          </View>

          {/* Error Message Banner */}
          {errorMessage ? (
            <View style={styles.errorCard}>
              <Icon name="shield" size={16} color="#9B1C1C" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>A. Personal Details</Text>
              <Text style={styles.cardDescription}>
                Enter the victim's personal details to create their profile and account access.
              </Text>

              {/* Option: Select existing user profile */}
              {profiles.length > 0 && (
                <View style={styles.profileSection}>
                  <Text style={styles.inputLabel}>Select Existing Unassigned User (Optional)</Text>
                  {isLoadingProfiles ? (
                    <ActivityIndicator color={COLORS.primary} size="small" style={{ marginVertical: 10 }} />
                  ) : (
                    <View style={styles.profileList}>
                      {profiles.map((p) => {
                        const uid = p.id;
                        const isSelected = selectedUserId === uid;
                        return (
                          <TouchableOpacity
                            key={uid}
                            style={[styles.profileOption, isSelected && styles.profileOptionSelected]}
                            onPress={() => handleSelectProfile(p)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.radioDot}>
                              {isSelected && <View style={styles.radioInnerDot} />}
                            </View>
                            <View style={styles.profileInfo}>
                              <Text style={styles.profileName}>{p.full_name || 'User Account'}</Text>
                              <Text style={styles.profileEmail}>{p.email} | {p.phone || 'No phone'}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                  <View style={styles.divider} />
                </View>
              )}

              {/* Form Fields */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#8A9D93"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. +91 9876543210"
                  placeholderTextColor="#8A9D93"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email Address (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  placeholderTextColor="#8A9D93"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Date of Birth *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#8A9D93"
                  value={dob}
                  onChangeText={setDob}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Gender *</Text>
                <View style={styles.pillRow}>
                  {['Female', 'Male', 'Other', 'Prefer not to say'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.dimChip, gender === g && styles.dimChipSelected]}
                      onPress={() => setGender(g)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dimChipText, gender === g && styles.dimChipTextSelected]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Preferred Language *</Text>
                <View style={styles.pillRow}>
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'hi', label: 'Hindi (हिंदी)' },
                    { code: 'mr', label: 'Marathi (मराठी)' },
                  ].map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[styles.dimChip, preferredLanguage === lang.code && styles.dimChipSelected]}
                      onPress={() => setPreferredLanguage(lang.code)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dimChipText, preferredLanguage === lang.code && styles.dimChipTextSelected]}>
                        {lang.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Location / Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="District / City / Address"
                  placeholderTextColor="#8A9D93"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              {/* Action Button - Rendered directly after Location / Address */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleNextToConsent}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Next: Consent Record"
              >
                <Text style={styles.primaryButtonText}>Next: Consent Record</Text>
                <Icon name="arrow-forward" size={16} color={COLORS.buttonText} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Consent */}
          {step === 2 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>B. Consent Documentation</Text>
              <Text style={styles.cardDescription}>
                The counsellor must record that consent for wellbeing monitoring and support was explained and obtained.
              </Text>

              <View style={styles.consentBox}>
                <TouchableOpacity
                  style={[styles.consentRow, hasConsented && styles.consentRowSelected]}
                  onPress={() => setHasConsented(!hasConsented)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.checkbox, hasConsented && styles.checkboxChecked]}>
                    {hasConsented && <Icon name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.consentText}>
                    I confirm that consent for wellbeing monitoring was explained and obtained from {fullName || 'the victim'}.
                  </Text>
                </TouchableOpacity>

                <View style={styles.consentMetaBox}>
                  <View style={styles.consentMetaRow}>
                    <Text style={styles.consentMetaLabel}>Consent Status:</Text>
                    <Text style={styles.consentMetaValue}>{hasConsented ? 'GRANTED' : 'PENDING'}</Text>
                  </View>
                  <View style={styles.consentMetaRow}>
                    <Text style={styles.consentMetaLabel}>Timestamp:</Text>
                    <Text style={styles.consentMetaValue}>{consentDate}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleNextToCaseInfo}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Next: Case Details</Text>
                <Icon name="arrow-forward" size={16} color={COLORS.buttonText} style={{ marginLeft: 8 }} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => setStep(1)} activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Back: Personal Details</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Case Information */}
          {step === 3 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>C. Case Details</Text>
              <Text style={styles.cardDescription}>
                Specify case tracking numbers, initial stage, and contextual information.
              </Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Generated Case ID</Text>
                <View style={styles.caseIdRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    value={caseId}
                    onChangeText={setCaseId}
                  />
                  <TouchableOpacity
                    style={styles.regenBtn}
                    onPress={() => setCaseId(`CASE-${Math.floor(100000 + Math.random() * 900000)}`)}
                  >
                    <Text style={styles.regenBtnText}>Regenerate</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Initial Case Stage *</Text>
                <View style={styles.stageOptionsList}>
                  {[
                    { id: 'active', label: 'Active Monitoring', desc: 'Continuous daily check-ins & wellbeing support' },
                    { id: 'assessment', label: 'Initial Assessment', desc: 'Baseline evaluation phase' },
                    { id: 'follow_up', label: 'Follow-up', desc: 'Periodic review and scheduled sessions' },
                    { id: 'closed', label: 'Closed', desc: 'Case resolution completed' },
                  ].map((st) => {
                    const isSelected = caseStage === st.id;
                    return (
                      <TouchableOpacity
                        key={st.id}
                        style={[styles.stageOption, isSelected && styles.stageOptionSelected]}
                        onPress={() => setCaseStage(st.id)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.radioDot}>
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.stageLabel, isSelected && styles.stageLabelSelected]}>
                            {st.label}
                          </Text>
                          <Text style={styles.stageDesc}>{st.desc}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Initial Contextual Background (Confidential)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Record relevant context or background notes..."
                  placeholderTextColor="#8A9D93"
                  value={context}
                  onChangeText={setContext}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleNextToAssessment}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Next: Assessment & Baseline</Text>
                <Icon name="arrow-forward" size={16} color={COLORS.buttonText} style={{ marginLeft: 8 }} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => setStep(2)} activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Back: Consent Record</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: Assessment & Baseline */}
          {step === 4 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>D. Initial Assessment & Baseline</Text>
              <Text style={styles.cardDescription}>
                Establish initial reference baseline indicators for longitudinal care tracking.
              </Text>

              {ASSESSMENT_DIMENSIONS.map((dim) => (
                <View key={dim.id} style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>{dim.label}</Text>
                  <View style={styles.pillRow}>
                    {dim.options.map((opt) => {
                      const isSelected = assessmentData[dim.id] === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dimChip, isSelected && styles.dimChipSelected]}
                          onPress={() => setAssessmentData((prev) => ({ ...prev, [dim.id]: opt }))}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.dimChipText, isSelected && styles.dimChipTextSelected]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Initial Counsellor Observations</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter initial clinical observations..."
                  placeholderTextColor="#8A9D93"
                  value={assessmentData.observations}
                  onChangeText={(text) => setAssessmentData((prev) => ({ ...prev, observations: text }))}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleRegisterAndCreateCase}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.buttonText} size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Register Victim & Create Case</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => setStep(3)} disabled={isSubmitting} activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Back: Case Details</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5: Registration Confirmation */}
          {step === 5 && (
            <View style={styles.card}>
              <View style={styles.successIconCircle}>
                <Icon name="checkmark" size={28} color={COLORS.primary} />
              </View>
              <Text style={[styles.cardTitle, { textAlign: 'center', marginTop: 10 }]}>Victim Registered Successfully</Text>
              <Text style={[styles.cardDescription, { textAlign: 'center' }]}>
                The victim account and support case have been established.
              </Text>

              <View style={styles.confirmationBox}>
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmLabel}>Victim Name:</Text>
                  <Text style={styles.confirmValue}>{fullName}</Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmLabel}>Case ID:</Text>
                  <Text style={styles.confirmValue}>{caseId}</Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmLabel}>Phone:</Text>
                  <Text style={styles.confirmValue}>{phone || 'Not provided'}</Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmLabel}>Preferred Language:</Text>
                  <Text style={styles.confirmValue}>
                    {preferredLanguage === 'hi' ? 'Hindi (हिंदी)' : preferredLanguage === 'mr' ? 'Marathi (मराठी)' : 'English'}
                  </Text>
                </View>
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmLabel}>Access Status:</Text>
                  <Text style={[styles.confirmValue, { color: COLORS.primary, fontWeight: '700' }]}>READY</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  if (onCaseCreated) onCaseCreated();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Return to Counsellor Dashboard</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 120, // Generous bottom padding to ensure button is reachable
  },
  header: {
    marginBottom: SPACING.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.1,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE8E8',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 13,
    color: '#9B1C1C',
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textSubtle,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  profileSection: {
    marginBottom: SPACING.md,
  },
  profileList: {
    marginTop: 6,
    gap: 8,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: '#FFFFFF',
  },
  profileOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.selectedCardBg,
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.md,
  },
  inputWrapper: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dimChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dimChipSelected: {
    backgroundColor: COLORS.selectedCardBg,
    borderColor: COLORS.primary,
  },
  dimChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSubtle,
  },
  dimChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  consentBox: {
    marginBottom: SPACING.lg,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  consentRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.selectedCardBg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  consentText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  consentMetaBox: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 4,
  },
  consentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  consentMetaLabel: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  consentMetaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  caseIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  regenBtn: {
    backgroundColor: COLORS.selectedCardBg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  regenBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  stageOptionsList: {
    gap: 8,
  },
  stageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.lg,
    padding: 12,
  },
  stageOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.selectedCardBg,
  },
  stageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  stageLabelSelected: {
    color: COLORS.primary,
  },
  stageDesc: {
    fontSize: 12,
    color: COLORS.textSubtle,
    marginTop: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: SPACING.lg,
    minHeight: 50,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.buttonText,
    letterSpacing: 0.3,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: SPACING.xs,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSubtle,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  successIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.selectedCardBg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  confirmationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
    marginVertical: SPACING.md,
    gap: 8,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  confirmLabel: {
    fontSize: 13,
    color: COLORS.textSubtle,
  },
  confirmValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
});
