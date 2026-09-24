const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'App.js',
  '.env',
  '.gitignore',
  'src/lib/supabase.js',
  'src/services/authService.js',
  'src/screens/LoginScreen.js',
  'src/navigation/AppNavigator.js',
  'supabase/migrations/001_create_profiles.sql'
];

console.log('=== Checking Required Files ===');
let hasMissing = false;
requiredFiles.forEach(f => {
  const fullPath = path.join(__dirname, f);
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    console.log(`✓ ${f} (${stat.size} bytes)`);
  } else {
    console.error(`✗ MISSING: ${f}`);
    hasMissing = true;
  }
});

if (hasMissing) {
  process.exit(1);
} else {
  console.log('All files verified successfully!');
}
