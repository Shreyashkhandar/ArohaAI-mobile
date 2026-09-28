/**
 * Voice Input Service Boundary.
 * Safely handles voice recording/transcription capabilities.
 * In Expo Go environment, native audio recording/transcription is isolated
 * and returns an honest unavailable status without faking transcription.
 */

export async function isVoiceInputAvailable() {
  // Speech-to-text requires native development build modules not bundled in Expo Go
  return false;
}

export async function startRecording() {
  return {
    supported: false,
    message: 'Voice recording is currently unavailable in Expo Go mode.',
  };
}

export async function stopRecording() {
  return {
    supported: false,
    audioUri: null,
  };
}

export async function transcribeRecording(audioUri) {
  return {
    supported: false,
    text: null,
    error: 'Voice transcription service is not connected in this prototype build.',
  };
}
