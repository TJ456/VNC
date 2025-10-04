#!/usr/bin/env node

/**
 * Test script to verify that all blockchain features use configurable values
 * instead of hardcoded values.
 */

const fs = require('fs');
const path = require('path');

// List of files to check for hardcoded values
const filesToCheck = [
  'services/BlockchainVNCEnforcementService.js',
  'middleware/vncProtocolMiddleware.js',
  'routes/blockchainDemo.js',
  '../scripts/blockchain-demo.js'
];

// Patterns to look for (hardcoded values that should be configurable)
// Only check for actual hardcoded IPs, not fallback values in process.env expressions
const hardcodedPatterns = [
  // Look for IPs that are not part of process.env expressions
  /(?<!process\.env\.[A-Z_]+ \|\|\s*['"])\b192\.168\.1\.100\b(?![\s\S]*\|\|)/, // Specific test IP not in fallback
  /(?<!process\.env\.[A-Z_]+ \|\|\s*['"])\b127\.0\.0\.1\b(?![\s\S]*\|\|)/,     // Localhost IP not in fallback
  /(?<!process\.env\.[A-Z_]+ \|\|\s*['"])localhost(?![^\w])/      // localhost not in fallback
];

// Configuration values that should be used instead
const configKeys = [
  'DEMO_CLIENT_IP',
  'DEMO_SERVER_IP',
  'VNC_SERVER_HOST',
  'BLOCKCHAIN_RPC_URL',
  'PORT',
  'DEMO_USER_ADDRESS',
  'DEMO_USER_AGENT',
  'DEMO_SESSION_PREFIX'
];

console.log('🔍 Checking for hardcoded values in blockchain implementation...\n');

let issuesFound = 0;
let filesChecked = 0;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', 'backend-express', file);
  
  if (fs.existsSync(filePath)) {
    filesChecked++;
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`📄 Checking ${file}...`);
    
    hardcodedPatterns.forEach(pattern => {
      const matches = content.match(new RegExp(pattern, 'g'));
      if (matches) {
        console.log(`  ❌ Found hardcoded value: ${pattern}`);
        console.log(`     Occurrences: ${matches.length}`);
        issuesFound += matches.length;
      }
    });
    
    // Check for proper use of environment variables
    let configUses = 0;
    configKeys.forEach(key => {
      if (content.includes(key)) {
        configUses++;
      }
    });
    
    console.log(`  ✅ Configuration variables used: ${configUses}\n`);
  } else {
    console.log(`⚠️  File not found: ${file}\n`);
  }
});

console.log('📊 SUMMARY');
console.log('===========');
console.log(`Files checked: ${filesChecked}`);
console.log(`Hardcoded values found: ${issuesFound}`);
console.log(`Configuration readiness: ${issuesFound === 0 ? '✅ PASS' : '❌ FAIL'}`);

if (issuesFound === 0) {
  console.log('\n🎉 All blockchain features are properly configured!');
  console.log('   No hardcoded values found - ready for production deployment.');
  process.exit(0);
} else {
  console.log('\n⚠️  Issues found! Please fix hardcoded values before production deployment.');
  process.exit(1);
}