/**
 * Data Provenance & File Integrity Service
 * 
 * This service provides blockchain-based data provenance tracking and file
 * integrity verification for all data transferred through VNC sessions.
 * Every file is cryptographically hashed and timestamped on the blockchain,
 * creating an immutable record of data lineage and enabling real-time
 * detection of data tampering or malicious modifications.
 * 
 * Key Features:
 * - Blockchain-based file fingerprinting and provenance tracking
 * - Real-time integrity verification during file transfers
 * - Malware injection detection through hash comparison
 * - Data lineage tracking across multiple transfer hops
 * - Automated quarantine of tampered or suspicious files
 * - Cryptographic proof of file authenticity and origin
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { Web3 } = require('web3');
const { MerkleTree } = require('merkletreejs');

class DataProvenanceService {
  constructor() {
    this.web3 = null;
    this.provenanceContract = null;
    this.integrityContract = null;
    this.networkUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    this.provenanceContractAddress = process.env.PROVENANCE_CONTRACT_ADDRESS;
    this.integrityContractAddress = process.env.INTEGRITY_CONTRACT_ADDRESS;
    this.privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    
    // File tracking databases
    this.fileRegistry = new Map();
    this.integrityChecks = new Map();
    this.provenanceChain = new Map();
    this.quarantineList = new Set();
    
    // Integrity verification settings
    this.hashAlgorithms = ['sha256', 'sha512', 'md5']; // Multiple hashes for security
    this.maxFileSize = 100 * 1024 * 1024; // 100MB limit
    this.suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    
    this.initializeProvenanceSystem();
  }

  /**
   * Initialize blockchain-based data provenance system
   */
  async initializeProvenanceSystem() {
    try {
      console.log('🔗 Initializing Data Provenance & Integrity System...');
      
      this.web3 = new Web3(this.networkUrl);
      
      if (this.privateKey) {
        const account = this.web3.eth.accounts.privateKeyToAccount(this.privateKey);
        this.web3.eth.accounts.wallet.add(account);
        this.web3.eth.defaultAccount = account.address;
      }

      await this.initializeProvenanceContract();
      await this.initializeIntegrityContract();
      await this.loadFileRegistry();

      console.log('✅ Data Provenance & Integrity System initialized');
    } catch (error) {
      console.error('❌ Data Provenance initialization failed:', error);
    }
  }

  /**
   * Initialize data provenance smart contract
   */
  async initializeProvenanceContract() {
    const provenanceContractABI = [
      {
        "inputs": [
          {"name": "_fileHash", "type": "bytes32"},
          {"name": "_fileName", "type": "string"},
          {"name": "_fileSize", "type": "uint256"},
          {"name": "_sourceAddress", "type": "address"},
          {"name": "_metadata", "type": "string"}
        ],
        "name": "registerFile",
        "outputs": [{"name": "fileId", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {"name": "_fileId", "type": "uint256"},
          {"name": "_recipientAddress", "type": "address"},
          {"name": "_transferHash", "type": "bytes32"},
          {"name": "_sessionId", "type": "string"}
        ],
        "name": "recordTransfer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {"name": "_fileHash", "type": "bytes32"}
        ],
        "name": "getFileProvenance",
        "outputs": [
          {"name": "fileId", "type": "uint256"},
          {"name": "originalHash", "type": "bytes32"},
          {"name": "registrationTime", "type": "uint256"},
          {"name": "transferCount", "type": "uint256"},
          {"name": "isQuarantined", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"name": "_fileId", "type": "uint256"},
          {"name": "_reason", "type": "string"}
        ],
        "name": "quarantineFile",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];

    if (this.provenanceContractAddress) {
      this.provenanceContract = new this.web3.eth.Contract(provenanceContractABI, this.provenanceContractAddress);
      console.log('✅ Data Provenance contract initialized');
    }
  }

  /**
   * Initialize file integrity smart contract
   */
  async initializeIntegrityContract() {
    const integrityContractABI = [
      {
        "inputs": [
          {"name": "_fileHash", "type": "bytes32"},
          {"name": "_integrityProof", "type": "bytes32[]"},
          {"name": "_timestamp", "type": "uint256"}
        ],
        "name": "submitIntegrityProof",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {"name": "_fileHash", "type": "bytes32"},
          {"name": "_challengeHash", "type": "bytes32"}
        ],
        "name": "verifyIntegrity",
        "outputs": [{"name": "isValid", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"name": "_fileHash", "type": "bytes32"},
          {"name": "_tamperEvidence", "type": "string"}
        ],
        "name": "reportTampering",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];

    if (this.integrityContractAddress) {
      this.integrityContract = new this.web3.eth.Contract(integrityContractABI, this.integrityContractAddress);
      console.log('✅ File Integrity contract initialized');
    }
  }

  /**
   * Register file in blockchain provenance system
   * @param {Object} fileData - File information and metadata
   * @returns {Object} File registration result with blockchain proof
   */
  async registerFileProvenance(fileData) {
    try {
      const {
        filePath,
        fileName,
        fileBuffer,
        sourceSession,
        sourceUser,
        transferType = 'upload',
        metadata = {}
      } = fileData;

      console.log(`📝 Registering file provenance: ${fileName}`);

      // Generate comprehensive file fingerprint
      const fileFingerprint = await this.createFileFingerprint(fileBuffer, fileName);

      // Create file registration record
      const fileRegistration = {
        id: this.generateFileId(),
        fileName,
        fileSize: fileBuffer.length,
        fingerprint: fileFingerprint,
        sourceSession,
        sourceUser,
        transferType,
        registrationTime: Date.now(),
        blockchain: {
          submitted: false,
          transactionHash: null,
          blockNumber: null,
          contractFileId: null
        },
        metadata: {
          ...metadata,
          mimeType: this.detectMimeType(fileName),
          fileExtension: path.extname(fileName).toLowerCase(),
          registrationTimestamp: new Date().toISOString()
        }
      };

      // Check for suspicious file characteristics
      const securityAnalysis = await this.analyzFileSecurityRisk(fileRegistration);
      fileRegistration.securityAnalysis = securityAnalysis;

      // Submit to blockchain if contracts available
      if (this.provenanceContract) {
        const blockchainResult = await this.submitFileToBlockchain(fileRegistration);
        fileRegistration.blockchain = blockchainResult;
      }

      // Store in local registry
      this.fileRegistry.set(fileFingerprint.primaryHash, fileRegistration);

      // Create provenance chain entry
      this.createProvenanceChainEntry(fileRegistration);

      // Auto-quarantine if high risk
      if (securityAnalysis.riskLevel === 'HIGH' || securityAnalysis.riskLevel === 'CRITICAL') {
        await this.quarantineFile(fileFingerprint.primaryHash, 'Automated security analysis detected high risk');
      }

      console.log(`✅ File provenance registered: ${fileName} (Risk: ${securityAnalysis.riskLevel})`);

      return {
        fileId: fileRegistration.id,
        primaryHash: fileFingerprint.primaryHash,
        provenanceId: fileRegistration.blockchain.contractFileId,
        riskLevel: securityAnalysis.riskLevel,
        quarantined: securityAnalysis.riskLevel === 'HIGH' || securityAnalysis.riskLevel === 'CRITICAL',
        blockchainProof: fileRegistration.blockchain.submitted
      };

    } catch (error) {
      console.error('❌ File provenance registration failed:', error);
      throw new Error(`File registration failed: ${error.message}`);
    }
  }

  /**
   * Verify file integrity during transfer
   * @param {Object} transferData - File transfer information
   * @returns {Object} Integrity verification result
   */
  async verifyFileIntegrity(transferData) {
    try {
      const {
        fileBuffer,
        fileName,
        originalHash,
        sessionId,
        transferDirection = 'incoming'
      } = transferData;

      console.log(`🔍 Verifying file integrity: ${fileName}`);

      // Calculate current file fingerprint
      const currentFingerprint = await this.createFileFingerprint(fileBuffer, fileName);

      // Look up original file registration
      const originalFile = this.fileRegistry.get(originalHash) || 
                          await this.lookupFileInBlockchain(originalHash);

      if (!originalFile) {
        return this.createIntegrityResult(false, 'FILE_NOT_FOUND', 
          'No original file registration found', {
            currentHash: currentFingerprint.primaryHash,
            originalHash,
            fileName
          });
      }

      // Verify primary hash match
      const primaryHashMatch = currentFingerprint.primaryHash === originalFile.fingerprint.primaryHash;

      // Verify additional hash algorithms for enhanced security
      const additionalHashesMatch = this.verifyAdditionalHashes(
        currentFingerprint,
        originalFile.fingerprint
      );

      // Check for known malware signatures
      const malwareCheck = await this.checkMalwareSignatures(currentFingerprint);

      // Verify file size consistency
      const sizeMatch = fileBuffer.length === originalFile.fileSize;

      // Calculate integrity score
      const integrityScore = this.calculateIntegrityScore({
        primaryHashMatch,
        additionalHashesMatch,
        sizeMatch,
        malwareCheck
      });

      const integrityValid = integrityScore >= 95; // 95% threshold for valid integrity

      // Create integrity verification record
      const integrityRecord = {
        id: this.generateIntegrityId(),
        fileId: originalFile.id,
        originalHash,
        currentHash: currentFingerprint.primaryHash,
        sessionId,
        transferDirection,
        integrityValid,
        integrityScore,
        verificationTime: Date.now(),
        checks: {
          primaryHashMatch,
          additionalHashesMatch,
          sizeMatch,
          malwareDetected: !malwareCheck.clean,
          tamperingDetected: !primaryHashMatch || !sizeMatch
        },
        evidence: {
          originalFingerprint: originalFile.fingerprint,
          currentFingerprint,
          malwareResults: malwareCheck
        }
      };

      // Submit integrity proof to blockchain
      if (this.integrityContract && integrityValid) {
        await this.submitIntegrityProof(integrityRecord);
      }

      // Report tampering if detected
      if (!integrityValid) {
        await this.reportFileTampering(integrityRecord);
      }

      // Store integrity check record
      this.integrityChecks.set(integrityRecord.id, integrityRecord);

      // Take action based on integrity result
      if (!integrityValid) {
        await this.handleIntegrityViolation(integrityRecord);
      }

      console.log(`${integrityValid ? '✅' : '❌'} File integrity verification: ${fileName} (Score: ${integrityScore}%)`);

      return this.createIntegrityResult(integrityValid, 
        integrityValid ? 'INTEGRITY_VERIFIED' : 'INTEGRITY_VIOLATION',
        integrityValid ? 'File integrity confirmed' : 'File tampering detected',
        integrityRecord
      );

    } catch (error) {
      console.error('❌ File integrity verification failed:', error);
      return this.createIntegrityResult(false, 'VERIFICATION_ERROR', error.message);
    }
  }

  /**
   * Track data lineage across transfer hops
   * @param {Object} transferData - Transfer event data
   * @returns {Object} Data lineage record
   */
  async trackDataLineage(transferData) {
    try {
      const {
        fileHash,
        fromSession,
        toSession,
        fromUser,
        toUser,
        transferMethod,
        timestamp = Date.now()
      } = transferData;

      // Get existing provenance chain
      const existingChain = this.provenanceChain.get(fileHash) || [];

      // Create new lineage entry
      const lineageEntry = {
        id: this.generateLineageId(),
        fileHash,
        transferHop: existingChain.length + 1,
        fromSession,
        toSession,
        fromUser,
        toUser,
        transferMethod,
        timestamp,
        verificationStatus: 'pending',
        blockchainRecorded: false
      };

      // Add to provenance chain
      existingChain.push(lineageEntry);
      this.provenanceChain.set(fileHash, existingChain);

      // Submit to blockchain
      if (this.provenanceContract) {
        await this.recordTransferInBlockchain(lineageEntry);
      }

      // Analyze transfer patterns for suspicious activity
      const suspiciousPatterns = this.analyzeTransferPatterns(existingChain);
      if (suspiciousPatterns.detected) {
        await this.flagSuspiciousDataMovement(fileHash, suspiciousPatterns);
      }

      console.log(`📍 Data lineage tracked: ${fileHash} (Hop ${lineageEntry.transferHop})`);

      return {
        lineageId: lineageEntry.id,
        transferHop: lineageEntry.transferHop,
        totalHops: existingChain.length,
        suspiciousActivity: suspiciousPatterns.detected,
        blockchainRecorded: lineageEntry.blockchainRecorded
      };

    } catch (error) {
      console.error('❌ Data lineage tracking failed:', error);
      throw new Error(`Lineage tracking failed: ${error.message}`);
    }
  }

  /**
   * Create comprehensive file fingerprint
   */
  async createFileFingerprint(fileBuffer, fileName) {
    const fingerprint = {
      primaryHash: null,
      secondaryHashes: {},
      structuralHash: null,
      metadata: {
        size: fileBuffer.length,
        name: fileName,
        extension: path.extname(fileName).toLowerCase(),
        timestamp: Date.now()
      }
    };

    // Calculate multiple hash algorithms for security
    for (const algorithm of this.hashAlgorithms) {
      const hash = crypto.createHash(algorithm).update(fileBuffer).digest('hex');
      if (algorithm === 'sha256') {
        fingerprint.primaryHash = hash;
      } else {
        fingerprint.secondaryHashes[algorithm] = hash;
      }
    }

    // Create structural hash for executable files
    if (this.isExecutableFile(fileName)) {
      fingerprint.structuralHash = await this.createStructuralHash(fileBuffer);
    }

    // Add entropy analysis for malware detection
    fingerprint.entropy = this.calculateFileEntropy(fileBuffer);

    return fingerprint;
  }

  /**
   * Analyze file security risk
   */
  async analyzFileSecurityRisk(fileRegistration) {
    const analysis = {
      riskLevel: 'LOW',
      riskScore: 0,
      reasons: [],
      recommendations: []
    };

    const { fileName, fileSize, fingerprint, metadata } = fileRegistration;

    // Check file extension
    if (this.suspiciousExtensions.includes(metadata.fileExtension)) {
      analysis.riskScore += 30;
      analysis.reasons.push('Potentially dangerous file extension');
    }

    // Check file size anomalies
    if (fileSize > this.maxFileSize) {
      analysis.riskScore += 20;
      analysis.reasons.push('File size exceeds maximum allowed limit');
    }

    // Check entropy for packed/encrypted files
    if (fingerprint.entropy > 7.5) {
      analysis.riskScore += 25;
      analysis.reasons.push('High entropy suggests packed or encrypted content');
    }

    // Check against known malware hashes
    const malwareCheck = await this.checkMalwareSignatures(fingerprint);
    if (!malwareCheck.clean) {
      analysis.riskScore += 50;
      analysis.reasons.push(`Malware detected: ${malwareCheck.threats.join(', ')}`);
    }

    // Determine risk level
    if (analysis.riskScore >= 80) {
      analysis.riskLevel = 'CRITICAL';
      analysis.recommendations.push('Immediate quarantine required');
    } else if (analysis.riskScore >= 60) {
      analysis.riskLevel = 'HIGH';
      analysis.recommendations.push('Enhanced monitoring required');
    } else if (analysis.riskScore >= 30) {
      analysis.riskLevel = 'MEDIUM';
      analysis.recommendations.push('Additional verification recommended');
    }

    return analysis;
  }

  /**
   * Submit file registration to blockchain
   */
  async submitFileToBlockchain(fileRegistration) {
    if (!this.provenanceContract) {
      return { submitted: false, reason: 'Contract not available' };
    }

    try {
      const transaction = this.provenanceContract.methods.registerFile(
        `0x${fileRegistration.fingerprint.primaryHash}`,
        fileRegistration.fileName,
        fileRegistration.fileSize,
        this.web3.eth.defaultAccount,
        JSON.stringify(fileRegistration.metadata)
      );

      const gas = await transaction.estimateGas({ from: this.web3.eth.defaultAccount });
      const receipt = await transaction.send({
        from: this.web3.eth.defaultAccount,
        gas: gas
      });

      return {
        submitted: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        contractFileId: receipt.events?.FileRegistered?.returnValues?.fileId || null
      };

    } catch (error) {
      console.error('❌ Blockchain submission failed:', error);
      return {
        submitted: false,
        error: error.message
      };
    }
  }

  /**
   * Handle integrity violations
   */
  async handleIntegrityViolation(integrityRecord) {
    const { fileId, originalHash, currentHash, sessionId } = integrityRecord;

    console.log(`🚨 File integrity violation detected: ${originalHash}`);

    // Quarantine the file immediately
    await this.quarantineFile(currentHash, 'File integrity violation detected');

    // Terminate the session if severe tampering
    if (integrityRecord.checks.tamperingDetected) {
      await this.terminateSession(sessionId, 'File tampering detected');
    }

    // Alert security team
    await this.triggerSecurityAlert('FILE_INTEGRITY_VIOLATION', {
      fileId,
      originalHash,
      currentHash,
      sessionId,
      integrityScore: integrityRecord.integrityScore
    });

    // Update threat intelligence
    await this.reportThreatIntelligence('FILE_TAMPERING', integrityRecord);
  }

  /**
   * Quarantine file with blockchain record
   */
  async quarantineFile(fileHash, reason) {
    this.quarantineList.add(fileHash);

    if (this.provenanceContract) {
      try {
        const fileRecord = this.fileRegistry.get(fileHash);
        if (fileRecord?.blockchain?.contractFileId) {
          await this.provenanceContract.methods.quarantineFile(
            fileRecord.blockchain.contractFileId,
            reason
          ).send({
            from: this.web3.eth.defaultAccount
          });
        }
      } catch (error) {
        console.error('❌ Blockchain quarantine failed:', error);
      }
    }

    console.log(`🔒 File quarantined: ${fileHash} - ${reason}`);
  }

  /**
   * Utility methods
   */
  generateFileId() {
    return `file_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  generateIntegrityId() {
    return `integrity_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }

  generateLineageId() {
    return `lineage_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }

  isExecutableFile(fileName) {
    const executableExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.msi'];
    const ext = path.extname(fileName).toLowerCase();
    return executableExtensions.includes(ext);
  }

  calculateFileEntropy(buffer) {
    const frequencies = new Array(256).fill(0);
    
    for (let i = 0; i < buffer.length; i++) {
      frequencies[buffer[i]]++;
    }

    let entropy = 0;
    for (let i = 0; i < 256; i++) {
      if (frequencies[i] > 0) {
        const probability = frequencies[i] / buffer.length;
        entropy -= probability * Math.log2(probability);
      }
    }

    return entropy;
  }

  detectMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      '.txt': 'text/plain',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.exe': 'application/x-msdownload',
      '.zip': 'application/zip'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  verifyAdditionalHashes(currentFingerprint, originalFingerprint) {
    let matchCount = 0;
    let totalHashes = 0;

    Object.keys(originalFingerprint.secondaryHashes).forEach(algorithm => {
      totalHashes++;
      if (currentFingerprint.secondaryHashes[algorithm] === originalFingerprint.secondaryHashes[algorithm]) {
        matchCount++;
      }
    });

    return totalHashes > 0 ? (matchCount / totalHashes) * 100 : 100;
  }

  calculateIntegrityScore({ primaryHashMatch, additionalHashesMatch, sizeMatch, malwareCheck }) {
    let score = 0;

    if (primaryHashMatch) score += 60;
    score += (additionalHashesMatch / 100) * 25;
    if (sizeMatch) score += 10;
    if (malwareCheck.clean) score += 5;

    return Math.min(100, score);
  }

  createIntegrityResult(valid, code, message, data = {}) {
    return {
      valid,
      code,
      message,
      timestamp: new Date().toISOString(),
      ...data
    };
  }

  async checkMalwareSignatures(fingerprint) {
    // Simplified malware check - in production, integrate with real AV services
    const knownMalwareHashes = new Set([
      // Add known malware hashes here
    ]);

    const threats = [];
    if (knownMalwareHashes.has(fingerprint.primaryHash)) {
      threats.push('Known malware signature');
    }

    return {
      clean: threats.length === 0,
      threats
    };
  }

  createProvenanceChainEntry(fileRegistration) {
    const chainEntry = {
      fileHash: fileRegistration.fingerprint.primaryHash,
      registrationTime: fileRegistration.registrationTime,
      sourceSession: fileRegistration.sourceSession,
      sourceUser: fileRegistration.sourceUser,
      transferType: fileRegistration.transferType
    };

    const existingChain = this.provenanceChain.get(fileRegistration.fingerprint.primaryHash) || [];
    existingChain.push(chainEntry);
    this.provenanceChain.set(fileRegistration.fingerprint.primaryHash, existingChain);
  }

  analyzeTransferPatterns(provenanceChain) {
    // Analyze for suspicious patterns like rapid transfers, unusual destinations, etc.
    const analysis = {
      detected: false,
      patterns: []
    };

    // Check for rapid sequential transfers
    if (provenanceChain.length > 5) {
      const recentTransfers = provenanceChain.slice(-5);
      const timeWindow = recentTransfers[recentTransfers.length - 1].timestamp - recentTransfers[0].timestamp;
      
      if (timeWindow < 300000) { // 5 minutes
        analysis.detected = true;
        analysis.patterns.push('Rapid sequential transfers detected');
      }
    }

    return analysis;
  }

  async loadFileRegistry() {
    // Load existing file registry from persistent storage
    console.log('📂 Loading file registry...');
  }

  getProvenanceStatistics() {
    return {
      registeredFiles: this.fileRegistry.size,
      integrityChecks: this.integrityChecks.size,
      quarantinedFiles: this.quarantineList.size,
      provenanceChains: this.provenanceChain.size,
      blockchainConnected: !!this.provenanceContract
    };
  }
}

module.exports = DataProvenanceService;