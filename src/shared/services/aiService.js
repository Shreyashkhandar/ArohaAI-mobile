/**
 * AI Service Client Module.
 * Connects mobile application layer securely to the backend FastAPI AI analysis service.
 * Private LLM keys (Gemini/OpenAI) remain strictly server-side in the FastAPI service environment.
 */

export async function analyzeCheckIn({ userId, checkinId, response }) {
  if (!userId || !checkinId || !response) {
    throw new Error('Missing required payload fields for AI analysis.');
  }

  // Use environment configured URL or default fallback for emulator/device connectivity
  const baseUrl = process.env.EXPO_PUBLIC_AI_SERVICE_URL || 'http://10.0.2.2:8001';
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/analyze`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        checkin_id: checkinId,
        response: String(response).trim(),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`AI analysis service returned HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!data || !data.checkin_id) {
      throw new Error('Invalid analysis response structure returned by AI service.');
    }

    return {
      checkin_id: data.checkin_id,
      indicators: Array.isArray(data.indicators) ? data.indicators : [],
      change_detected: Boolean(data.change_detected),
      explanation: data.explanation || 'Check-in analysis completed.',
      requires_counsellor_review: Boolean(data.requires_counsellor_review),
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[aiService] Analysis request failed (check-in preserved):', err?.message);
    throw err;
  }
}
