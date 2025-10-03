class AttackSimulator {
  constructor(prisma, wsService) {
    this.prisma = prisma;
    this.wsService = wsService;
  }
  
  async runAttack(attackType, targetIp = '127.0.0.1') {
    const attackMethods = {
      'file_exfiltration': this.simulateFileExfiltration.bind(this),
      'screenshot_spam': this.simulateScreenshotSpam.bind(this),
      'clipboard_stealing': this.simulateClipboardStealing.bind(this),
      'large_data_transfer': this.simulateLargeDataTransfer.bind(this),
      'credential_harvesting': this.simulateCredentialHarvesting.bind(this),
      'keystroke_logging': this.simulateKeystrokeLogging.bind(this),
      'lateral_movement': this.simulateLateralMovement.bind(this)
    };
    
    if (!attackMethods[attackType]) {
      return {
        success: false,
        error: `Unknown attack type: ${attackType}`,
        available_attacks: Object.keys(attackMethods)
      };
    }
    
    try {
      const result = await attackMethods[attackType](targetIp);
      return {
        success: true,
        attack_type: attackType,
        target_ip: targetIp,
        result: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Attack simulation failed:', error);
      return {
        success: false,
        error: error.message,
        attack_type: attackType
      };
    }
  }
  
  async simulateFileExfiltration(targetIp) {
    const sessionId = await this.createFakeSession(targetIp, 'file_exfiltration');
    
    const filesCount = Math.floor(Math.random() * 6) + 3; // 3-8 files
    const totalSizeMb = Math.random() * 150 + 50; // 50-200MB
    
    const files = [];
    for (let i = 0; i < filesCount; i++) {
      files.push({
        filename: `confidential_doc_${i + 1}.pdf`,
        size_mb: Math.random() * 50 + 10,
        transfer_time_seconds: Math.random() * 30 + 10
      });
    }
    
    await this.logThreat({
      sessionId,
      threatType: 'file_exfiltration',
      severity: 'high',
      sourceIp: targetIp,
      description: `Large file exfiltration detected: ${filesCount} files, ${totalSizeMb.toFixed(1)}MB total`,
      metadata: {
        files_transferred: files,
        total_size_mb: totalSizeMb,
        transfer_rate_mbps: totalSizeMb / 30 // Assuming 30 second transfer
      }
    });
    
    return {
      files_count: filesCount,
      total_size_mb: parseFloat(totalSizeMb.toFixed(2)),
      files: files,
      detection_likelihood: 'high'
    };
  }
  
  async simulateScreenshotSpam(targetIp) {
    const sessionId = await this.createFakeSession(targetIp, 'screenshot_spam');
    
    const screenshotCount = Math.floor(Math.random() * 100) + 50; // 50-150
    const timeWindowSeconds = Math.floor(Math.random() * 90) + 30; // 30-120 seconds
    
    await this.logThreat({
      sessionId,
      threatType: 'screenshot_spam',
      severity: 'medium',
      sourceIp: targetIp,
      description: `Excessive screenshot activity: ${screenshotCount} screenshots in ${timeWindowSeconds}s`,
      metadata: {
        screenshot_count: screenshotCount,
        time_window_seconds: timeWindowSeconds,
        rate_per_minute: (screenshotCount / timeWindowSeconds) * 60
      }
    });
    
    return {
      screenshot_count: screenshotCount,
      time_window_seconds: timeWindowSeconds,
      rate_per_minute: parseFloat(((screenshotCount / timeWindowSeconds) * 60).toFixed(1)),
      detection_likelihood: 'medium'
    };
  }
  
  async simulateClipboardStealing(targetIp) {
    const sessionId = await this.createFakeSession(targetIp, 'clipboard_stealing');
    
    const clipboardOps = Math.floor(Math.random() * 120) + 80; // 80-200 operations
    const sensitiveItems = Math.floor(Math.random() * 20) + 5; // 5-25 sensitive items
    
    await this.logThreat({
      sessionId,
      threatType: 'clipboard_stealing',
      severity: sensitiveItems > 15 ? 'high' : 'medium',
      sourceIp: targetIp,
      description: `Suspicious clipboard activity: ${clipboardOps} operations, ${sensitiveItems} sensitive items`,
      metadata: {
        total_operations: clipboardOps,
        sensitive_items: sensitiveItems,
        data_types: ['passwords', 'credit_cards', 'emails', 'api_keys']
      }
    });
    
    return {
      total_operations: clipboardOps,
      sensitive_items: sensitiveItems,
      detection_likelihood: sensitiveItems > 15 ? 'high' : 'medium'
    };
  }
  
  async simulateLargeDataTransfer(targetIp) {
    const sessionId = await this.createFakeSession(targetIp, 'large_data_transfer');
    
    const totalDataGb = Math.random() * 4 + 1; // 1-5GB
    const destinationIp = '203.0.113.5'; // External IP
    
    await this.logThreat({
      sessionId,
      threatType: 'large_data_transfer',
      severity: 'critical',
      sourceIp: targetIp,
      targetIp: destinationIp,
      description: `Large data exfiltration: ${totalDataGb.toFixed(2)}GB to ${destinationIp}`,
      metadata: {
        total_data_gb: totalDataGb,
        destination_ip: destinationIp,
        external_transfer: true
      }
    });
    
    return {
      total_data_gb: parseFloat(totalDataGb.toFixed(2)),
      destination_ip: destinationIp,
      detection_likelihood: 'critical'
    };
  }
  
  async simulateCredentialHarvesting(targetIp) {
    const sessionId = await this.createFakeSession(targetIp, 'credential_harvesting');
    
    const totalCredentials = Math.floor(Math.random() * 50) + 10; // 10-60 credentials
    
    await this.logThreat({
      sessionId,
      threatType: 'credential_harvesting',
      severity: 'critical',
      sourceIp: targetIp,
      description: `Credential harvesting detected: ${totalCredentials} credentials from multiple sources`,
      metadata: {
        total_credentials: totalCredentials,
        applications_accessed: ['browser_passwords', 'email_client', 'ssh_keys', 'vpn_profiles']
      }
    });
    
    return {
      total_credentials: totalCredentials,
      detection_likelihood: 'critical'
    };
  }
  
  async simulateKeystrokeLogging(targetIp) {
    const sessionId = await this.createFakeSession(targetIp, 'keystroke_logging');
    
    const keystrokes = Math.floor(Math.random() * 3000) + 2000; // 2000-5000 keystrokes
    const sensitiveSequences = Math.floor(Math.random() * 15) + 5; // 5-20 sequences
    
    await this.logThreat({
      sessionId,
      threatType: 'keystroke_logging',
      severity: 'critical',
      sourceIp: targetIp,
      description: `Keystroke logging detected: ${keystrokes} keystrokes, ${sensitiveSequences} sensitive sequences`,
      metadata: {
        total_keystrokes: keystrokes,
        sensitive_sequences: sensitiveSequences
      }
    });
    
    return {
      total_keystrokes: keystrokes,
      sensitive_sequences: sensitiveSequences,
      detection_likelihood: 'critical'
    };
  }
  
  async simulateLateralMovement(targetIp) {
    const sessionId = await this.createFakeSession(targetIp, 'lateral_movement');
    
    const totalAttempts = Math.floor(Math.random() * 50) + 20; // 20-70 attempts
    const successfulConnections = Math.floor(totalAttempts * 0.3); // 30% success rate
    
    await this.logThreat({
      sessionId,
      threatType: 'lateral_movement',
      severity: 'high',
      sourceIp: targetIp,
      description: `Lateral movement detected: ${successfulConnections} successful connections out of ${totalAttempts} attempts`,
      metadata: {
        total_attempts: totalAttempts,
        successful_connections: successfulConnections
      }
    });
    
    return {
      total_attempts: totalAttempts,
      successful_connections: successfulConnections,
      detection_likelihood: 'high'
    };
  }
  
  async createFakeSession(clientIp, attackType) {
    const session = await this.prisma.vNCSession.create({
      data: {
        clientIp: clientIp,
        serverIp: '127.0.0.1',
        clientPort: Math.floor(Math.random() * 10000) + 50000,
        serverPort: 5900,
        startTime: new Date(),
        status: 'active',
        dataTransferred: 0.0,
        riskScore: Math.random() * 25 + 70 // High risk (70-95)
      }
    });
    
    return session.id;
  }
  
  async logThreat({ sessionId, threatType, severity, sourceIp, targetIp, description, metadata }) {
    const threat = await this.prisma.threatLog.create({
      data: {
        threatType,
        severity,
        sourceIp,
        targetIp,
        description,
        detectionMethod: 'simulation',
        actionTaken: 'logged',
        sessionId,
        confidence: 1.0,
        metadata: metadata || {}
      }
    });
    
    // Broadcast threat detection
    if (this.wsService) {
      this.wsService.broadcast({
        type: 'threat_detected',
        threat: {
          id: threat.id,
          type: threatType,
          severity: severity,
          source_ip: sourceIp,
          description: description
        },
        timestamp: new Date().toISOString()
      });
    }
    
    return threat.id;
  }
}

module.exports = AttackSimulator;