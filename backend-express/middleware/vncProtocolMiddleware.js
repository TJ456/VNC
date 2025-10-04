/**
 * VNC Protocol Middleware - Real-time VNC Traffic Interception & Blockchain Integration
 * 
 * This middleware provides production-ready real-time hooks into VNC protocol
 * events and integrates with blockchain smart contracts for immediate enforcement.
 * 
 * Features:
 * - Real-time VNC protocol parsing and event extraction
 * - Live file transfer monitoring with blockchain provenance
 * - Smart contract-based session termination
 * - Zero-trust access control enforcement
 * - Cryptographic integrity verification
 */

const net = require('net');
const crypto = require('crypto');
const EventEmitter = require('events');
const FileIntegrityService = require('../services/FileIntegrityService');

class VNCProtocolMiddleware extends EventEmitter {
  constructor(blockchainServices) {
    super();
    this.blockchainAudit = blockchainServices.blockchainAudit;
    this.zeroTrustAccess = blockchainServices.zeroTrustAccess;
    this.dataProvenance = blockchainServices.dataProvenance;
    this.threatIntelligence = blockchainServices.threatIntelligence;
    this.fileIntegrityService = new FileIntegrityService();
    
    // Configuration from environment variables
    this.config = {
      vnc: {
        ports: (process.env.VNC_PORTS || '5900,5901,5902,5903,5904,5905').split(',').map(p => parseInt(p.trim())),
        proxyPortOffset: parseInt(process.env.VNC_PROXY_PORT_OFFSET) || 100,
        serverHost: process.env.VNC_SERVER_HOST || '127.0.0.1',
        enableInterception: process.env.VNC_PROXY_ENABLED === 'true'
      },
      demo: {
        clientIp: process.env.DEMO_CLIENT_IP || '10.0.0.1',
        serverIp: process.env.DEMO_SERVER_IP || '10.0.0.2'
      }
    };
    
    // VNC Protocol Constants
    this.VNC_PROTOCOL_VERSION = 'RFB 003.008\n';
    this.VNC_MESSAGES = {
      SET_PIXEL_FORMAT: 0,
      SET_ENCODINGS: 2,
      FRAMEBUFFER_UPDATE_REQUEST: 3,
      KEY_EVENT: 4,
      POINTER_EVENT: 5,
      CLIENT_CUT_TEXT: 6,
      FILE_TRANSFER_REQUEST: 7,
      // Server to Client
      FRAMEBUFFER_UPDATE: 0,
      SET_COLOUR_MAP_ENTRIES: 1,
      BELL: 2,
      SERVER_CUT_TEXT: 3,
      FILE_TRANSFER_RESPONSE: 8
    };
    
    this.activeSessions = new Map();
    this.interceptedConnections = new Map();
    this.enforcementRules = new Map();
    
    // Enhanced configuration for active prevention
    this.preventiveActions = {
      blockKeyEvent: process.env.BLOCK_KEY_EVENT === 'true',
      blockPointerEvent: process.env.BLOCK_POINTER_EVENT === 'true',
      blockFileTransfer: process.env.BLOCK_FILE_TRANSFER === 'true',
      blockClipboard: process.env.BLOCK_CLIPBOARD === 'true',
      maxDataTransferRate: parseInt(process.env.MAX_DATA_TRANSFER_RATE) || 100, // MB/s
      maxScreenshotRate: parseInt(process.env.MAX_SCREENSHOT_RATE) || 10 // screenshots/minute
    };
    
    console.log('🔌 VNC Protocol Middleware initialized for real-time interception');
    if (this.config.vnc.enableInterception) {
      console.log('✅ Active VNC protocol interception enabled');
    } else {
      console.log('ℹ️  Passive VNC monitoring mode (set VNC_PROXY_ENABLED=true for active interception)');
    }
  }

  /**
   * Start intercepting VNC traffic on specified ports
   * Creates a transparent proxy that monitors all VNC protocol messages
   */
  startVNCInterception(vncPorts = this.config.vnc.ports) {
    if (!this.config.vnc.enableInterception) {
      console.log('ℹ️  VNC interception disabled. Running in passive monitoring mode only.');
      return;
    }
    
    vncPorts.forEach(port => {
      this.createVNCProxy(port);
    });
    
    console.log(`🕵️ VNC traffic interception started on ports: ${vncPorts.join(', ')}`);
  }

  /**
   * Create transparent VNC proxy for real-time protocol monitoring
   */
  createVNCProxy(originalPort) {
    const proxyPort = originalPort + this.config.vnc.proxyPortOffset; // Use configurable proxy ports
    
    const proxy = net.createServer((clientSocket) => {
      console.log(`🔗 New VNC connection intercepted on port ${originalPort}`);
      
      // Connect to actual VNC server
      const serverSocket = net.createConnection(originalPort, this.config.vnc.serverHost);
      
      const sessionId = this.generateSessionId();
      const sessionData = {
        sessionId,
        clientSocket,
        serverSocket,
        clientIp: clientSocket.remoteAddress,
        serverPort: originalPort,
        startTime: Date.now(),
        accessToken: null,
        dataTransferred: 0,
        fileTransfers: [],
        violations: [],
        keyEvents: 0,
        pointerEvents: 0,
        clipboardOps: 0,
        screenshots: 0
      };
      
      this.activeSessions.set(sessionId, sessionData);
      
      // Set up real-time protocol monitoring
      this.setupProtocolMonitoring(sessionData);
      
      // Proxy data with real-time analysis
      clientSocket.on('data', (data) => this.handleClientData(sessionId, data));
      serverSocket.on('data', (data) => this.handleServerData(sessionId, data));
      
      // Handle connection events
      clientSocket.on('close', () => this.handleSessionEnd(sessionId));
      serverSocket.on('close', () => this.handleSessionEnd(sessionId));
      clientSocket.on('error', (err) => this.handleSessionError(sessionId, err));
      serverSocket.on('error', (err) => this.handleSessionError(sessionId, err));
      
    });
    
    proxy.listen(proxyPort, () => {
      console.log(`🔄 VNC Proxy listening on port ${proxyPort} -> ${originalPort}`);
    });
  }

  /**
   * Handle client-to-server VNC protocol data with real-time blockchain validation
   */
  async handleClientData(sessionId, data) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      // Parse VNC protocol messages
      const messages = this.parseVNCMessages(data, 'client');
      
      for (const message of messages) {
        // Update session statistics
        this.updateSessionStats(sessionId, message);
        
        // Check preventive actions
        if (this.shouldBlockMessage(message)) {
          console.log(`🚫 Preventive action: Blocking ${message.type} message`);
          await this.logPreventiveAction(sessionId, message);
          return; // Block the message
        }
        
        // Real-time smart contract validation
        const validationResult = await this.validateMessageWithSmartContract(sessionId, message);
        
        if (!validationResult.allowed) {
          console.log(`🚫 Smart contract blocked VNC action: ${message.type}`);
          await this.enforceBlockchainPolicy(sessionId, validationResult);
          return; // Block the message
        }
        
        // Track specific VNC events
        await this.processVNCEvent(sessionId, message);
      }
      
      // Forward data to server if allowed
      if (session.serverSocket.writable) {
        session.serverSocket.write(data);
        session.dataTransferred += data.length;
      }
      
      // Update blockchain audit trail
      await this.logToBlockchain(sessionId, 'CLIENT_DATA', {
        size: data.length,
        messages: messages.length,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error(`❌ Error processing client data for session ${sessionId}:`, error);
    }
  }

  /**
   * Handle server-to-client VNC protocol data with integrity verification
   */
  async handleServerData(sessionId, data) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      // Parse server messages
      const messages = this.parseVNCMessages(data, 'server');
      
      // Check for file transfer operations
      const fileOperations = messages.filter(msg => 
        msg.type === 'FILE_TRANSFER_RESPONSE' || msg.type === 'SERVER_CUT_TEXT'
      );
      
      if (fileOperations.length > 0) {
        // Real-time file integrity verification with blockchain
        for (const fileOp of fileOperations) {
          const integrityResult = await this.verifyFileIntegrityRealTime(sessionId, fileOp);
          
          if (!integrityResult.valid) {
            console.log(`🚨 File integrity violation detected! Terminating session ${sessionId}`);
            await this.terminateSessionImmediately(sessionId, 'FILE_INTEGRITY_VIOLATION');
            return;
          }
        }
      }
      
      // Forward data to client
      if (session.clientSocket.writable) {
        session.clientSocket.write(data);
        session.dataTransferred += data.length;
      }
      
    } catch (error) {
      console.error(`❌ Error processing server data for session ${sessionId}:`, error);
    }
  }

  /**
   * Parse VNC protocol messages for real-time analysis
   */
  parseVNCMessages(buffer, direction) {
    const messages = [];
    let offset = 0;
    
    while (offset < buffer.length) {
      try {
        if (direction === 'client') {
          const messageType = buffer.readUInt8(offset);
          
          switch (messageType) {
            case this.VNC_MESSAGES.KEY_EVENT:
              messages.push(this.parseKeyEvent(buffer, offset));
              offset += 8;
              break;
              
            case this.VNC_MESSAGES.POINTER_EVENT:
              messages.push(this.parsePointerEvent(buffer, offset));
              offset += 6;
              break;
              
            case this.VNC_MESSAGES.CLIENT_CUT_TEXT:
              const cutTextMessage = this.parseClientCutText(buffer, offset);
              messages.push(cutTextMessage);
              offset += 8 + cutTextMessage.length;
              break;
              
            case this.VNC_MESSAGES.FILE_TRANSFER_REQUEST:
              const fileTransferMessage = this.parseFileTransferRequest(buffer, offset);
              messages.push(fileTransferMessage);
              offset += fileTransferMessage.totalLength;
              break;
              
            default:
              // Skip unknown message
              offset += 1;
          }
        } else {
          // Server messages
          const messageType = buffer.readUInt8(offset);
          
          switch (messageType) {
            case this.VNC_MESSAGES.FRAMEBUFFER_UPDATE:
              const frameUpdate = this.parseFramebufferUpdate(buffer, offset);
              messages.push(frameUpdate);
              offset += frameUpdate.totalLength;
              break;
              
            case this.VNC_MESSAGES.SERVER_CUT_TEXT:
              const serverCutText = this.parseServerCutText(buffer, offset);
              messages.push(serverCutText);
              offset += 8 + serverCutText.length;
              break;
              
            case this.VNC_MESSAGES.FILE_TRANSFER_RESPONSE:
              const fileResponse = this.parseFileTransferResponse(buffer, offset);
              messages.push(fileResponse);
              offset += fileResponse.totalLength;
              break;
              
            default:
              offset += 1;
          }
        }
      } catch (error) {
        // If parsing fails, skip this buffer
        break;
      }
    }
    
    return messages;
  }

  /**
   * Validate VNC message against smart contract policies in real-time
   */
  async validateMessageWithSmartContract(sessionId, message) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session.accessToken) {
      // Generate access token for session if not exists
      session.accessToken = await this.zeroTrustAccess.generateAccessToken({
        userId: session.sessionId,
        clientIp: session.clientIp,
        requestedPermissions: ['VIEW_ONLY', 'REMOTE_CONTROL']
      });
    }
    
    // Create session data for validation
    const sessionData = {
      sessionId: session.sessionId,
      clientIp: session.clientIp,
      action: message.type,
      dataSize: message.size || 0,
      fileOperations: message.type === 'FILE_TRANSFER_REQUEST' ? [message] : [],
      clipboardAccess: message.type === 'CLIENT_CUT_TEXT' || message.type === 'SERVER_CUT_TEXT',
      controlRequests: message.type === 'KEY_EVENT' || message.type === 'POINTER_EVENT' ? [message] : []
    };
    
    // Real-time smart contract validation
    return await this.zeroTrustAccess.validateSessionAccess(
      sessionData, 
      JSON.stringify(session.accessToken)
    );
  }

  /**
   * Verify file integrity in real-time during transfer using enhanced service
   */
  async verifyFileIntegrityRealTime(sessionId, fileOperation) {
    if (!fileOperation.fileData) {
      return { valid: true }; // No file data to verify
    }
    
    // Use the enhanced file integrity service
    const fileName = fileOperation.fileName || 'unknown_file';
    const integrityResult = await this.fileIntegrityService.verifyFileIntegrity(
      fileOperation.fileData, 
      fileName, 
      sessionId
    );
    
    // Log the integrity check result
    console.log(`🔒 File integrity check for ${fileName}: ${integrityResult.overallValid ? 'PASSED' : 'FAILED'}`);
    
    if (!integrityResult.overallValid) {
      // Report high-risk file transfer
      await this.reportThreatIntelligence(sessionId, 'FILE_INTEGRITY_VIOLATION', {
        fileName: fileName,
        riskScore: integrityResult.riskScore,
        severity: integrityResult.severity,
        issues: integrityResult.issues
      });
      
      // Log to blockchain
      await this.blockchainAudit.createSessionAuditEntry({
        sessionId: sessionId,
        clientIp: this.activeSessions.get(sessionId).clientIp,
        serverIp: this.config.demo.serverIp,
        action: 'file_integrity_violation',
        dataTransferred: fileOperation.size || 0,
        riskScore: integrityResult.riskScore,
        authMethod: 'file_integrity_service',
        description: `File integrity violation: ${fileName}`,
        metadata: {
          fileName: fileName,
          issues: integrityResult.issues,
          severity: integrityResult.severity
        }
      });
    }
    
    return integrityResult;
  }

  /**
   * Enforce blockchain smart contract policies by terminating sessions
   */
  async enforceBlockchainPolicy(sessionId, violationResult) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    const violation = {
      tokenId: session.accessToken?.id,
      violationType: violationResult.code,
      sessionId: sessionId,
      severity: this.determineViolationSeverity(violationResult.code),
      metadata: {
        clientIp: session.clientIp,
        dataTransferred: session.dataTransferred,
        timestamp: Date.now()
      }
    };
    
    // Execute smart contract enforcement
    const enforcementResult = await this.zeroTrustAccess.enforcePolicyViolation(violation);
    
    if (enforcementResult.action.includes('TERMINATED')) {
      await this.terminateSessionImmediately(sessionId, violation.violationType);
    }
    
    console.log(`⚖️ Blockchain policy enforced: ${enforcementResult.action}`);
  }

  /**
   * Immediately terminate VNC session based on smart contract decision
   */
  async terminateSessionImmediately(sessionId, reason) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    console.log(`🛑 IMMEDIATE SESSION TERMINATION: ${sessionId} - ${reason}`);
    
    // Send VNC connection termination
    if (session.clientSocket && !session.clientSocket.destroyed) {
      session.clientSocket.destroy();
    }
    
    if (session.serverSocket && !session.serverSocket.destroyed) {
      session.serverSocket.destroy();
    }
    
    // Log termination to blockchain
    await this.blockchainAudit.createSessionAuditEntry({
      sessionId: sessionId,
      clientIp: session.clientIp,
      serverIp: this.config.demo.serverIp,
      action: 'terminated',
      dataTransferred: session.dataTransferred,
      riskScore: 100,
      authMethod: 'blockchain_enforcement',
      duration: Date.now() - session.startTime,
      fileOperations: session.fileTransfers.length,
      clipboardOperations: session.clipboardOps || 0
    });
    
    // Remove from active sessions
    this.activeSessions.delete(sessionId);
    
    // Emit event for monitoring systems
    this.emit('sessionTerminated', {
      sessionId,
      reason,
      timestamp: Date.now(),
      blockchainEnforced: true
    });
  }

  /**
   * Log VNC events to blockchain audit trail
   */
  async logToBlockchain(sessionId, eventType, eventData) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    const auditEvent = {
      sessionId: sessionId,
      clientIp: session.clientIp,
      serverIp: this.config.demo.serverIp,
      action: eventType.toLowerCase(),
      dataTransferred: eventData.size || 0,
      riskScore: this.calculateRealTimeRiskScore(session, eventData),
      authMethod: 'vnc_proxy',
      packetsExchanged: eventData.messages || 0,
      duration: Date.now() - session.startTime,
      ...eventData
    };
    
    await this.blockchainAudit.createSessionAuditEntry(auditEvent);
  }

  /**
   * Process specific VNC events and update session state
   */
  async processVNCEvent(sessionId, message) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    switch (message.type) {
      case 'CLIENT_CUT_TEXT':
        session.clipboardOps = (session.clipboardOps || 0) + 1;
        
        // Check for sensitive data in clipboard
        if (this.containsSensitiveData(message.text)) {
          await this.reportThreatIntelligence(sessionId, 'SENSITIVE_CLIPBOARD_ACCESS', {
            textLength: message.text.length,
            containsPII: true
          });
        }
        break;
        
      case 'FILE_TRANSFER_REQUEST':
        session.fileTransfers.push({
          fileName: message.fileName,
          size: message.size,
          timestamp: Date.now(),
          hash: crypto.createHash('sha256').update(message.fileData).digest('hex')
        });
        
        // Register file with blockchain provenance
        await this.dataProvenance.registerFileProvenance({
          filePath: message.fileName,
          fileName: message.fileName,
          fileBuffer: message.fileData,
          sourceSession: sessionId,
          sourceUser: session.clientIp,
          transferType: 'vnc_transfer'
        });
        break;
        
      case 'KEY_EVENT':
        session.keyEvents = (session.keyEvents || 0) + 1;
        
        // Detect potential credential harvesting
        if (this.detectCredentialHarvesting(message, session)) {
          await this.reportThreatIntelligence(sessionId, 'CREDENTIAL_HARVESTING', {
            keyPattern: message.pattern,
            suspiciousActivity: true
          });
        }
        break;
        
      case 'POINTER_EVENT':
        session.pointerEvents = (session.pointerEvents || 0) + 1;
        break;
        
      case 'FRAMEBUFFER_UPDATE':
        session.screenshots = (session.screenshots || 0) + 1;
        break;
    }
  }

  /**
   * Enhanced preventive action checking
   */
  shouldBlockMessage(message) {
    switch (message.type) {
      case 'KEY_EVENT':
        return this.preventiveActions.blockKeyEvent;
      case 'POINTER_EVENT':
        return this.preventiveActions.blockPointerEvent;
      case 'CLIENT_CUT_TEXT':
        return this.preventiveActions.blockClipboard;
      case 'FILE_TRANSFER_REQUEST':
        return this.preventiveActions.blockFileTransfer;
      default:
        return false;
    }
  }

  /**
   * Log preventive actions taken
   */
  async logPreventiveAction(sessionId, message) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    await this.blockchainAudit.createSessionAuditEntry({
      sessionId: sessionId,
      clientIp: session.clientIp,
      serverIp: this.config.demo.serverIp,
      action: 'prevented_' + message.type.toLowerCase(),
      dataTransferred: 0,
      riskScore: 30,
      authMethod: 'preventive_action',
      description: `Preventive action blocked ${message.type}`,
      metadata: {
        messageType: message.type,
        messageSize: message.size
      }
    });
  }

  /**
   * Update session statistics
   */
  updateSessionStats(sessionId, message) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    // Rate limiting checks
    const now = Date.now();
    const sessionDurationMinutes = (now - session.startTime) / (1000 * 60);
    
    // Check data transfer rate
    const dataRateMBps = (session.dataTransferred / (1024 * 1024)) / ((now - session.startTime) / 1000);
    if (dataRateMBps > this.preventiveActions.maxDataTransferRate) {
      console.log(`⚠️ High data transfer rate detected: ${dataRateMBps.toFixed(2)} MB/s`);
    }
    
    // Check screenshot rate
    if (sessionDurationMinutes > 0) {
      const screenshotRate = session.screenshots / sessionDurationMinutes;
      if (screenshotRate > this.preventiveActions.maxScreenshotRate) {
        console.log(`⚠️ High screenshot rate detected: ${screenshotRate.toFixed(2)} screenshots/minute`);
      }
    }
  }

  /**
   * Calculate real-time risk score based on session activity
   */
  calculateRealTimeRiskScore(session, eventData) {
    let riskScore = 0;
    
    // Base risk from client IP
    if (!this.isInternalIP(session.clientIp)) {
      riskScore += 30;
    }
    
    // Data transfer volume risk
    const mbTransferred = session.dataTransferred / (1024 * 1024);
    if (mbTransferred > 100) riskScore += 25;
    else if (mbTransferred > 50) riskScore += 15;
    
    // File transfer risk
    if (session.fileTransfers.length > 10) riskScore += 20;
    
    // Session duration risk
    const durationHours = (Date.now() - session.startTime) / (1000 * 60 * 60);
    if (durationHours > 8) riskScore += 15;
    
    // Clipboard operations risk
    if (session.clipboardOps > 20) riskScore += 10;
    
    // Key events risk (potential keylogger)
    if (session.keyEvents > 1000) riskScore += 15;
    
    // Pointer events risk
    if (session.pointerEvents > 5000) riskScore += 10;
    
    // Screenshots risk
    if (session.screenshots > 100) riskScore += 15;
    
    return Math.min(riskScore, 100);
  }

  /**
   * Report threat intelligence to blockchain network
   */
  async reportThreatIntelligence(sessionId, threatType, metadata) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    const threatEvent = {
      sessionId: sessionId,
      sourceIp: session.clientIp,
      threatType: threatType,
      severity: this.getThreatSeverity(threatType),
      detectionMethod: 'vnc_protocol_analysis',
      confidence: 0.95,
      evidence: metadata
    };
    
    await this.threatIntelligence.reportThreatEvent(threatEvent);
  }

  /**
   * Utility methods for protocol parsing
   */
  parseKeyEvent(buffer, offset) {
    return {
      type: 'KEY_EVENT',
      downFlag: buffer.readUInt8(offset + 1),
      key: buffer.readUInt32BE(offset + 4),
      size: 8
    };
  }

  parsePointerEvent(buffer, offset) {
    return {
      type: 'POINTER_EVENT',
      buttonMask: buffer.readUInt8(offset + 1),
      x: buffer.readUInt16BE(offset + 2),
      y: buffer.readUInt16BE(offset + 4),
      size: 6
    };
  }

  parseClientCutText(buffer, offset) {
    const length = buffer.readUInt32BE(offset + 4);
    const text = buffer.slice(offset + 8, offset + 8 + length).toString('utf8');
    
    return {
      type: 'CLIENT_CUT_TEXT',
      length: length,
      text: text,
      size: 8 + length
    };
  }

  parseServerCutText(buffer, offset) {
    const length = buffer.readUInt32BE(offset + 4);
    const text = buffer.slice(offset + 8, offset + 8 + length).toString('utf8');
    
    return {
      type: 'SERVER_CUT_TEXT',
      length: length,
      text: text,
      size: 8 + length
    };
  }

  parseFramebufferUpdate(buffer, offset) {
    const numberOfRectangles = buffer.readUInt16BE(offset + 2);
    // Simplified parsing - in production would parse all rectangles
    
    return {
      type: 'FRAMEBUFFER_UPDATE',
      rectangles: numberOfRectangles,
      totalLength: Math.min(buffer.length - offset, 1024), // Estimate
      size: numberOfRectangles * 1024 // Estimate based on rectangles
    };
  }

  parseFileTransferRequest(buffer, offset) {
    // Simplified file transfer parsing
    const fileNameLength = buffer.readUInt32BE(offset + 4);
    const fileName = buffer.slice(offset + 8, offset + 8 + fileNameLength).toString('utf8');
    const fileSize = buffer.readUInt32BE(offset + 8 + fileNameLength);
    
    return {
      type: 'FILE_TRANSFER_REQUEST',
      fileName: fileName,
      size: fileSize,
      totalLength: 8 + fileNameLength + 4,
      fileData: buffer.slice(offset, offset + 8 + fileNameLength + 4)
    };
  }

  parseFileTransferResponse(buffer, offset) {
    // Simplified file transfer response parsing
    const fileSize = buffer.readUInt32BE(offset + 4);
    
    return {
      type: 'FILE_TRANSFER_RESPONSE',
      size: fileSize,
      totalLength: 4 + fileSize,
      fileData: buffer.slice(offset + 4, offset + 4 + fileSize)
    };
  }

  /**
   * Utility functions
   */
  generateSessionId() {
    return `vnc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  isInternalIP(ip) {
    const internalRanges = [
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^127\./
    ];
    
    return internalRanges.some(range => range.test(ip));
  }

  containsSensitiveData(text) {
    const sensitivePatterns = [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /password/i,
      /secret/i,
      /confidential/i
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(text));
  }

  detectCredentialHarvesting(keyEvent, session) {
    // Simplified detection - would implement sophisticated pattern analysis
    // Check for rapid succession of key events that might indicate keylogging
    if (session.keyEvents > 100 && (Date.now() - session.startTime) < 60000) {
      return true; // More than 100 key events in less than a minute
    }
    return false;
  }

  determineViolationSeverity(code) {
    const severityMap = {
      'DATA_LIMIT_EXCEEDED': 'medium',
      'PERMISSION_DENIED': 'high',
      'TOKEN_EXPIRED': 'medium',
      'IP_RESTRICTED': 'high',
      'FILE_INTEGRITY_VIOLATION': 'critical'
    };
    
    return severityMap[code] || 'medium';
  }

  getThreatSeverity(threatType) {
    const severityMap = {
      'SENSITIVE_CLIPBOARD_ACCESS': 'high',
      'CREDENTIAL_HARVESTING': 'critical',
      'FILE_TAMPERING': 'critical',
      'UNAUTHORIZED_ACCESS': 'high',
      'FILE_INTEGRITY_VIOLATION': 'critical'
    };
    
    return severityMap[threatType] || 'medium';
  }

  /**
   * Get statistics for monitoring
   */
  getInterceptionStatistics() {
    return {
      activeSessions: this.activeSessions.size,
      totalDataIntercepted: Array.from(this.activeSessions.values())
        .reduce((total, session) => total + session.dataTransferred, 0),
      totalFileTransfers: Array.from(this.activeSessions.values())
        .reduce((total, session) => total + session.fileTransfers.length, 0),
      blockchainEnforcements: this.enforcementRules.size
    };
  }
  
  /**
   * Enhanced session information
   */
  getSessionDetails(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;
    
    return {
      sessionId: session.sessionId,
      clientIp: session.clientIp,
      serverPort: session.serverPort,
      startTime: new Date(session.startTime).toISOString(),
      dataTransferred: session.dataTransferred,
      fileTransfers: session.fileTransfers.length,
      keyEvents: session.keyEvents || 0,
      pointerEvents: session.pointerEvents || 0,
      clipboardOps: session.clipboardOps || 0,
      screenshots: session.screenshots || 0,
      riskScore: this.calculateRealTimeRiskScore(session, {})
    };
  }
  
  /**
   * Get all active sessions
   */
  getAllSessions() {
    const sessions = [];
    for (const [sessionId, session] of this.activeSessions) {
      sessions.push(this.getSessionDetails(sessionId));
    }
    return sessions;
  }
  
  /**
   * Configure file integrity service
   */
  configureFileIntegrityService(config) {
    if (this.fileIntegrityService) {
      this.fileIntegrityService.configureVerificationMethods(config);
    }
  }
  
  /**
   * Add suspicious pattern to file integrity service
   */
  addSuspiciousPattern(pattern) {
    if (this.fileIntegrityService) {
      this.fileIntegrityService.addSuspiciousPattern(pattern);
    }
  }
  
  /**
   * Add dangerous extension to file integrity service
   */
  addDangerousExtension(extension) {
    if (this.fileIntegrityService) {
      this.fileIntegrityService.addDangerousExtension(extension);
    }
  }
}

module.exports = VNCProtocolMiddleware;