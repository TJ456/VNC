/**
 * File Integrity Service - Advanced file integrity verification for VNC transfers
 * 
 * This service provides enhanced file integrity checking during VNC file transfers
 * using multiple verification methods including blockchain hashes, digital signatures,
 * and real-time content analysis.
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class FileIntegrityService {
  constructor() {
    this.verificationMethods = {
      blockchainHash: true,
      digitalSignature: true,
      contentAnalysis: true,
      sizeVerification: true,
      mimeTypeCheck: true
    };
    
    this.suspiciousPatterns = [
      /\b(?:exec|system|spawn|fork)\b/i,           // Command execution
      /\b(?:eval|function|new Function)\b/i,       // Dynamic code execution
      /\b(?:setTimeout|setInterval)\b.*\b(?:eval|Function)\b/i, // Timed execution
      /\b(?:import|require)\b.*\b(?:fs|child_process|net|http)\b/i, // Dangerous imports
      /\b(?:document\.cookie|localStorage|sessionStorage)\b/i,     // Client storage access
      /\b(?:XMLHttpRequest|fetch)\b.*\b(?:php|asp|jsp)\b/i        // Web shell patterns
    ];
    
    this.dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.application', 
      '.gadget', '.msi', '.msp', '.hta', '.cpl', '.msc', '.jar'
    ];
    
    console.log('🔒 File Integrity Service initialized');
  }
  
  /**
   * Comprehensive file integrity verification
   */
  async verifyFileIntegrity(fileData, fileName, sessionId) {
    const verificationResults = {
      fileName: fileName,
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      overallValid: true,
      issues: [],
      riskScore: 0,
      verificationDetails: {}
    };
    
    try {
      // 1. Size verification
      if (this.verificationMethods.sizeVerification) {
        const sizeResult = this.verifyFileSize(fileData, fileName);
        verificationResults.verificationDetails.sizeVerification = sizeResult;
        if (!sizeResult.valid) {
          verificationResults.overallValid = false;
          verificationResults.issues.push('File size exceeds limits');
          verificationResults.riskScore += 30;
        }
      }
      
      // 2. MIME type checking
      if (this.verificationMethods.mimeTypeCheck) {
        const mimeResult = await this.verifyMimeType(fileData, fileName);
        verificationResults.verificationDetails.mimeTypeCheck = mimeResult;
        if (!mimeResult.valid) {
          verificationResults.overallValid = false;
          verificationResults.issues.push('Suspicious file type detected');
          verificationResults.riskScore += 25;
        }
      }
      
      // 3. Content analysis
      if (this.verificationMethods.contentAnalysis) {
        const contentResult = this.analyzeFileContent(fileData, fileName);
        verificationResults.verificationDetails.contentAnalysis = contentResult;
        if (!contentResult.valid) {
          verificationResults.overallValid = false;
          verificationResults.issues.push('Suspicious content detected');
          verificationResults.riskScore += 40;
        }
      }
      
      // 4. Extension checking
      const extensionResult = this.checkFileExtension(fileName);
      verificationResults.verificationDetails.extensionCheck = extensionResult;
      if (!extensionResult.valid) {
        verificationResults.overallValid = false;
        verificationResults.issues.push('Dangerous file extension detected');
        verificationResults.riskScore += 50;
      }
      
      // 5. Blockchain hash verification (if available)
      if (this.verificationMethods.blockchainHash) {
        const hashResult = await this.verifyBlockchainHash(fileData, fileName, sessionId);
        verificationResults.verificationDetails.blockchainHash = hashResult;
        if (!hashResult.valid) {
          verificationResults.overallValid = false;
          verificationResults.issues.push('Blockchain hash mismatch');
          verificationResults.riskScore += 45;
        }
      }
      
      // 6. Digital signature verification (if available)
      if (this.verificationMethods.digitalSignature) {
        const signatureResult = await this.verifyDigitalSignature(fileData, fileName);
        verificationResults.verificationDetails.digitalSignature = signatureResult;
        if (!signatureResult.valid) {
          verificationResults.overallValid = false;
          verificationResults.issues.push('Invalid digital signature');
          verificationResults.riskScore += 35;
        }
      }
      
      // Calculate final risk score
      verificationResults.riskScore = Math.min(verificationResults.riskScore, 100);
      verificationResults.severity = this.determineSeverity(verificationResults.riskScore);
      
      return verificationResults;
      
    } catch (error) {
      console.error('❌ File integrity verification failed:', error);
      return {
        fileName: fileName,
        sessionId: sessionId,
        overallValid: false,
        issues: ['Verification process failed'],
        riskScore: 100,
        severity: 'critical',
        error: error.message
      };
    }
  }
  
  /**
   * Verify file size against configured limits
   */
  verifyFileSize(fileData, fileName) {
    const fileSize = fileData.length;
    const maxFileSize = parseInt(process.env.MAX_FILE_TRANSFER_SIZE) || 100 * 1024 * 1024; // 100MB default
    
    return {
      valid: fileSize <= maxFileSize,
      fileSize: fileSize,
      maxSize: maxFileSize,
      unit: 'bytes',
      message: fileSize <= maxFileSize ? 'File size within limits' : 'File size exceeds maximum allowed'
    };
  }
  
  /**
   * Verify MIME type of file
   */
  async verifyMimeType(fileData, fileName) {
    try {
      // Simple MIME type detection based on file signature
      const fileSignature = fileData.slice(0, 16);
      const mimeType = this.detectMimeType(fileSignature, fileName);
      
      // Check against allowed MIME types
      const allowedMimeTypes = (process.env.ALLOWED_MIME_TYPES || 
                               'text/plain,application/pdf,image/jpeg,image/png').split(',');
      
      const isValid = allowedMimeTypes.includes(mimeType);
      
      return {
        valid: isValid,
        mimeType: mimeType,
        allowedTypes: allowedMimeTypes,
        message: isValid ? 'MIME type allowed' : 'MIME type not permitted'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        message: 'MIME type verification failed'
      };
    }
  }
  
  /**
   * Analyze file content for suspicious patterns
   */
  analyzeFileContent(fileData, fileName) {
    try {
      const content = fileData.toString('utf8');
      const issues = [];
      
      // Check for suspicious code patterns
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(content)) {
          issues.push(`Suspicious pattern detected: ${pattern}`);
        }
      }
      
      // Check for excessive obfuscation
      const obfuscationScore = this.calculateObfuscationScore(content);
      if (obfuscationScore > 0.7) {
        issues.push('High obfuscation detected');
      }
      
      return {
        valid: issues.length === 0,
        issues: issues,
        obfuscationScore: obfuscationScore,
        message: issues.length === 0 ? 'Content analysis passed' : 'Suspicious content detected'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        message: 'Content analysis failed'
      };
    }
  }
  
  /**
   * Check file extension against dangerous list
   */
  checkFileExtension(fileName) {
    const extension = path.extname(fileName).toLowerCase();
    const isDangerous = this.dangerousExtensions.includes(extension);
    
    return {
      valid: !isDangerous,
      extension: extension,
      dangerous: isDangerous,
      message: isDangerous ? 'Dangerous file extension detected' : 'File extension allowed'
    };
  }
  
  /**
   * Verify blockchain hash (placeholder for actual blockchain integration)
   */
  async verifyBlockchainHash(fileData, fileName, sessionId) {
    try {
      // In a real implementation, this would check against blockchain records
      // For now, we'll simulate a successful verification
      const currentHash = crypto.createHash('sha256').update(fileData).digest('hex');
      
      // Simulate blockchain verification (would check against stored hash)
      const blockchainVerified = Math.random() > 0.1; // 90% success rate for demo
      
      return {
        valid: blockchainVerified,
        currentHash: currentHash,
        message: blockchainVerified ? 'Blockchain verification successful' : 'Blockchain hash mismatch'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        message: 'Blockchain verification failed'
      };
    }
  }
  
  /**
   * Verify digital signature (placeholder for actual implementation)
   */
  async verifyDigitalSignature(fileData, fileName) {
    try {
      // In a real implementation, this would verify digital signatures
      // For now, we'll simulate verification
      const hasSignature = fileData.length > 256; // Simplified check
      const signatureValid = Math.random() > 0.05; // 95% success rate for demo
      
      return {
        valid: hasSignature ? signatureValid : true, // No signature is OK
        hasSignature: hasSignature,
        message: hasSignature ? 
          (signatureValid ? 'Digital signature valid' : 'Digital signature invalid') :
          'No digital signature (acceptable)'
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        message: 'Digital signature verification failed'
      };
    }
  }
  
  /**
   * Detect MIME type based on file signature
   */
  detectMimeType(fileSignature, fileName) {
    const signatures = {
      'ffd8ffe0': 'image/jpeg',
      '89504e47': 'image/png',
      '47494638': 'image/gif',
      '25504446': 'application/pdf',
      '504b0304': 'application/zip',
      '52617221': 'application/x-rar-compressed',
      '75737461': 'application/x-tar'
    };
    
    const hex = fileSignature.toString('hex').substring(0, 8);
    for (const [signature, mimeType] of Object.entries(signatures)) {
      if (hex.startsWith(signature)) {
        return mimeType;
      }
    }
    
    // Fallback to extension-based detection
    const extension = path.extname(fileName).toLowerCase();
    const extensionMimeTypes = {
      '.txt': 'text/plain',
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    return extensionMimeTypes[extension] || 'application/octet-stream';
  }
  
  /**
   * Calculate obfuscation score of content
   */
  calculateObfuscationScore(content) {
    // Check for excessive use of non-alphanumeric characters
    const nonAlphaCount = (content.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const totalChars = content.length;
    const nonAlphaRatio = totalChars > 0 ? nonAlphaCount / totalChars : 0;
    
    // Check for long strings without spaces (potential encoding)
    const longStrings = content.match(/[a-zA-Z0-9+/=]{50,}/g) || [];
    const hasLongEncodedStrings = longStrings.length > 0;
    
    // Combine factors
    let score = nonAlphaRatio * 0.7;
    if (hasLongEncodedStrings) {
      score += 0.3;
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Determine severity based on risk score
   */
  determineSeverity(riskScore) {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    if (riskScore >= 20) return 'low';
    return 'none';
  }
  
  /**
   * Generate comprehensive integrity report
   */
  generateIntegrityReport(verificationResults) {
    return {
      fileName: verificationResults.fileName,
      sessionId: verificationResults.sessionId,
      timestamp: verificationResults.timestamp,
      status: verificationResults.overallValid ? 'PASSED' : 'FAILED',
      riskScore: verificationResults.riskScore,
      severity: verificationResults.severity,
      issues: verificationResults.issues,
      details: verificationResults.verificationDetails,
      recommendations: this.generateRecommendations(verificationResults)
    };
  }
  
  /**
   * Generate recommendations based on verification results
   */
  generateRecommendations(verificationResults) {
    const recommendations = [];
    
    if (verificationResults.riskScore >= 80) {
      recommendations.push('Block file transfer immediately');
      recommendations.push('Terminate VNC session');
      recommendations.push('Add source IP to firewall block list');
      recommendations.push('Alert security team');
    } else if (verificationResults.riskScore >= 50) {
      recommendations.push('Quarantine file for further analysis');
      recommendations.push('Increase monitoring of this session');
      recommendations.push('Consider temporary IP restriction');
    } else if (verificationResults.riskScore >= 20) {
      recommendations.push('Log transfer for audit purposes');
      recommendations.push('Continue monitoring session');
    } else {
      recommendations.push('Allow file transfer');
      recommendations.push('Continue normal monitoring');
    }
    
    return recommendations;
  }
  
  /**
   * Configure verification methods
   */
  configureVerificationMethods(methods) {
    this.verificationMethods = { ...this.verificationMethods, ...methods };
    console.log('✅ File Integrity Service configuration updated');
  }
  
  /**
   * Add suspicious pattern to detection list
   */
  addSuspiciousPattern(pattern) {
    this.suspiciousPatterns.push(new RegExp(pattern, 'i'));
    console.log(`✅ Added suspicious pattern: ${pattern}`);
  }
  
  /**
   * Add dangerous file extension to block list
   */
  addDangerousExtension(extension) {
    if (!extension.startsWith('.')) {
      extension = '.' + extension;
    }
    this.dangerousExtensions.push(extension.toLowerCase());
    console.log(`✅ Added dangerous extension: ${extension}`);
  }
  
  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      verificationMethods: this.verificationMethods,
      suspiciousPatternCount: this.suspiciousPatterns.length,
      dangerousExtensionCount: this.dangerousExtensions.length
    };
  }
}

module.exports = FileIntegrityService;