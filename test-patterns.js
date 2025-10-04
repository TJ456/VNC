const fs = require('fs');

// Read the service file
const content = fs.readFileSync('backend-express/services/BlockchainVNCEnforcementService.js', 'utf8');

// Test patterns
console.log('Testing for hardcoded 192.168.1.100:');
const pattern1 = /['"]192\.168\.1\.100['"]/g;
const matches1 = content.match(pattern1);
console.log('All matches:', matches1);

console.log('\nTesting for environment variable fallback pattern:');
const pattern2 = /process\.env\.[A-Z_]+ \|\|\s*['"]192\.168\.1\.100['"]/g;
const matches2 = content.match(pattern2);
console.log('Env fallback matches:', matches2);

console.log('\nTesting for direct hardcoded (not in env fallback):');
// This is a simplified check - look for the IP but make sure it's not part of an env fallback
const lines = content.split('\n');
let directHardcoded = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('192.168.1.100') && !line.includes('process.env.') && !line.includes('||')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
    directHardcoded = true;
  }
}
console.log('Direct hardcoded found:', directHardcoded);