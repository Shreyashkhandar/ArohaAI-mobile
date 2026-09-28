/**
 * Assessment Service for Counsellors.
 * Establishes reference baselines for victim cases across 4 core dimensions:
 * 1. Sleep & Routine
 * 2. Emotional State
 * 3. Social Interaction
 * 4. Communication Difficulty
 */

export const ASSESSMENT_DIMENSIONS = [
  { id: 'sleep', label: 'Sleep & Routine', options: ['Regular', 'Mild Disturbance', 'Severe Disturbance'] },
  { id: 'emotional', label: 'Emotional State', options: ['Calm', 'Anxious', 'Distressed', 'Withdrawn'] },
  { id: 'social', label: 'Social Interaction', options: ['Connected', 'Selective', 'Isolated'] },
  { id: 'communication', label: 'Communication Difficulty', options: ['None', 'Hesitant', 'Guarded'] },
];

export function generateBaselineSummary(assessmentData) {
  if (!assessmentData) return 'No initial baseline recorded.';

  const parts = [];
  if (assessmentData.sleep) parts.push(`Sleep & Routine: ${assessmentData.sleep}`);
  if (assessmentData.emotional) parts.push(`Emotional State: ${assessmentData.emotional}`);
  if (assessmentData.social) parts.push(`Social Interaction: ${assessmentData.social}`);
  if (assessmentData.communication) parts.push(`Communication: ${assessmentData.communication}`);
  if (assessmentData.observations) parts.push(`Observations: ${assessmentData.observations}`);

  return parts.join(' | ');
}
