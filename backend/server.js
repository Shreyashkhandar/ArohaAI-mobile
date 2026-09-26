require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { analyzeCheckIn } = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'main-backend',
  });
});

// Analyze check-in endpoint (proxies to Python FastAPI service)
app.post('/api/analyze', async (req, res) => {
  const { user_id, checkin_id, response } = req.body;

  if (!user_id || !checkin_id || !response) {
    return res.status(400).json({
      error: 'Invalid request body. Required fields: user_id, checkin_id, response.',
    });
  }

  const result = await analyzeCheckIn({
    userId: user_id,
    checkinId: checkin_id,
    response,
  });

  if (!result.success) {
    return res.status(503).json({
      error: result.error,
    });
  }

  return res.json(result.data);
});

app.listen(PORT, () => {
  console.log(`[ArohaAI Main Backend] Listening on port ${PORT}`);
  console.log(`[ArohaAI Main Backend] Configured AI_SERVICE_URL: ${process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001'}`);
});
