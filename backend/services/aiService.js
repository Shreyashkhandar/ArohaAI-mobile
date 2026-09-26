const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

/**
 * Sends check-in analysis request to the Python FastAPI service boundary.
 *
 * @param {Object} params
 * @param {string} params.userId UUID string
 * @param {string} params.checkinId UUID string
 * @param {string} params.response Check-in text response
 */
async function analyzeCheckIn({ userId, checkinId, response }) {
  if (!userId || !checkinId || !response) {
    return {
      success: false,
      error: 'Missing required parameters: userId, checkinId, or response.',
    };
  }

  const endpoint = `${AI_SERVICE_URL}/analyze`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        checkin_id: checkinId,
        response: response,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[aiService] FastAPI returned HTTP ${res.status}`);
      return {
        success: false,
        error: `AI service returned error HTTP ${res.status}.`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      data,
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[aiService] Request to FastAPI timed out.');
      return {
        success: false,
        error: 'AI service connection timed out.',
      };
    }

    console.warn('[aiService] Communication error with FastAPI:', err.message);
    return {
      success: false,
      error: 'AI service unavailable or returned invalid response.',
    };
  }
}

module.exports = {
  analyzeCheckIn,
};
