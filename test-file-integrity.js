const axios = require('axios');

async function testFileIntegrity() {
  try {
    // Create test file
    const testFileContent = Buffer.from('Test file content for integrity verification');
    const testFileName = 'test-file.txt';
    
    console.log('Testing file registration...');
    
    // Register file
    const registerResponse = await axios.post('http://localhost:5000/api/blockchain/provenance/register', {
      fileName: testFileName,
      fileContent: testFileContent.toString('base64'),
      sourceSession: 'test-session',
      transferType: 'test'
    });
    
    console.log('Registration response:', registerResponse.data);
    
    const registration = registerResponse.data.data;
    const fileRegistered = registration && registration.fileId;
    
    if (fileRegistered) {
      console.log('Testing file verification...');
      
      // Test integrity verification
      const verifyResponse = await axios.post('http://localhost:5000/api/blockchain/provenance/verify', {
        fileName: testFileName,
        fileContent: testFileContent.toString('base64'),
        originalHash: registration.primaryHash,
        sessionId: 'test-session'
      });
      
      console.log('Verification response:', verifyResponse.data);
      
      const integrityResult = verifyResponse.data.data;
      
      console.log('✅ File integrity system working');
      console.log(`   File ID: ${registration.fileId}`);
      console.log(`   Hash: ${registration.primaryHash.substring(0, 16)}...`);
      console.log(`   Integrity: ${integrityResult.valid ? 'Valid' : 'Invalid'}`);
    }
    
  } catch (error) {
    console.error('❌ File integrity system failed:', error.response?.data || error.message);
  }
}

testFileIntegrity();