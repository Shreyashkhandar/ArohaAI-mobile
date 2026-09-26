const { spawn } = require('child_process');
const path = require('path');
const { analyzeCheckIn } = require('./services/aiService');

const pythonExe = 'C:\\Users\\User\\AppData\\Local\\Programs\\Python\\Python311\\python.exe';
const aiServiceDir = path.join(__dirname, '..', 'ai-service');

async function runIntegrationTest() {
  console.log('[Test] Spawning FastAPI Uvicorn process on port 8001...');
  
  const fastApiProcess = spawn(pythonExe, ['-m', 'uvicorn', 'app.main:app', '--port', '8001'], {
    cwd: aiServiceDir,
    env: process.env,
  });

  // Wait 2.5 seconds for FastAPI server to start listening
  await new Promise((resolve) => setTimeout(resolve, 2500));

  try {
    console.log('[Test 1] Testing short response ("Okay")...');
    const shortResult = await analyzeCheckIn({
      userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      checkinId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      response: 'Okay',
    });

    console.log('[Test 1 Result]:', JSON.stringify(shortResult, null, 2));

    console.log('[Test 2] Testing distress-related response...');
    const distressResult = await analyzeCheckIn({
      userId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      checkinId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
      response: 'I have been feeling very overwhelmed lately and having trouble sleeping.',
    });

    console.log('[Test 2 Result]:', JSON.stringify(distressResult, null, 2));

    if (
      shortResult.success &&
      distressResult.success &&
      distressResult.data.indicators.includes('distress-related language') &&
      distressResult.data.requires_counsellor_review === true
    ) {
      console.log('SUCCESS: Node -> FastAPI AI service pipeline verified successfully!');
    } else {
      console.error('FAILURE: Unexpected result structure');
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('ERROR during integration test:', err);
    process.exitCode = 1;
  } finally {
    fastApiProcess.kill();
    console.log('[Test] FastAPI process terminated.');
  }
}

runIntegrationTest();
