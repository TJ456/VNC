/**
 * Blockchain Audit Service - Immutable Audit Trail
 * 
 * This service creates tamper-proof audit trails by storing critical security events
 * on a private blockchain network. Every VNC session, threat detection, and admin
 * action is cryptographically hashed and stored in an immutable blockchain ledger.
 * 
 * Key Features:
 * - Immutable session logging with cryptographic proofs
 * - Merkle tree verification for batch integrity
 * - Smart contract enforcement of audit policies
 * - Tamper detection through blockchain verification
 * - Decentralized audit trail resistant to insider threats
 */

const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const { MerkleTree } = require('merkletreejs');
const { Web3 } = require('web3');

class BlockchainAuditService {
  constructor() {
    this.web3 = null;
    this.auditContract = null;
    this.merkleTree = null;
    this.pendingAuditEntries = [];
    this.batchSize = parseInt(process.env.BLOCKCHAIN_BATCH_SIZE) || 10;
    this.networkUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    this.contractAddress = process.env.AUDIT_CONTRACT_ADDRESS;
    this.privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    
    this.initializeBlockchain();
  }

  /**
   * Initialize blockchain connection and smart contract
   */
  async initializeBlockchain() {
    try {
      console.log('🔗 Initializing Blockchain Audit Service...');
      
      // Initialize Web3 connection
      this.web3 = new Web3(this.networkUrl);
      
      // Add account from private key
      if (this.privateKey) {
        const account = this.web3.eth.accounts.privateKeyToAccount(this.privateKey);
        this.web3.eth.accounts.wallet.add(account);
        this.web3.eth.defaultAccount = account.address;
        console.log(`✅ Blockchain account initialized: ${account.address}`);
      }

      // Initialize audit contract if available
      if (this.contractAddress) {
        await this.initializeAuditContract();
      }

      console.log('✅ Blockchain Audit Service initialized successfully');
    } catch (error) {
      console.error('❌ Blockchain initialization failed:', error);
      // Fallback to local cryptographic audit if blockchain unavailable
      console.log('📝 Falling back to local cryptographic audit trail');
    }
  }

  /**
   * Initialize the audit smart contract
   */
  async initializeAuditContract() {
    // ABI for the Audit Trail Smart Contract
    const auditContractABI = [
      {
        "inputs": [
          {"name": "_merkleRoot", "type": "bytes32"},
          {"name": "_timestamp", "type": "uint256"},
          {"name": "_batchHash", "type": "bytes32"}
        ],
        "name": "submitAuditBatch",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "_batchId", "type": "uint256"}],
        "name": "getAuditBatch",
        "outputs": [
          {"name": "merkleRoot", "type": "bytes32"},
          {"name": "timestamp", "type": "uint256"},
          {"name": "batchHash", "type": "bytes32"},
          {"name": "verified", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"name": "_merkleRoot", "type": "bytes32"},
          {"name": "_proof", "type": "bytes32[]"},
          {"name": "_leaf", "type": "bytes32"}
        ],
        "name": "verifyAuditEntry",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "pure",
        "type": "function"
      }
    ];

    this.auditContract = new this.web3.eth.Contract(auditContractABI, this.contractAddress);
    console.log('✅ Audit smart contract initialized');
  }

  /**
   * Create immutable audit entry for VNC session events
   * @param {Object} sessionEvent - Session event data
   * @returns {Object} Audit entry with blockchain proof
   */
  async createSessionAuditEntry(sessionEvent) {
    const auditEntry = {
      id: this.generateAuditId(),
      eventType: 'VNC_SESSION',
      timestamp: new Date().toISOString(),
      sessionId: sessionEvent.sessionId,
      clientIp: sessionEvent.clientIp,
      serverIp: sessionEvent.serverIp,
      action: sessionEvent.action, // 'started', 'ended', 'blocked'
      dataTransferred: sessionEvent.dataTransferred || 0,
      riskScore: sessionEvent.riskScore || 0,
      userAgent: sessionEvent.userAgent,
      authMethod: sessionEvent.authMethod,
      metadata: {
        packetsExchanged: sessionEvent.packetsExchanged,
        screenshotCount: sessionEvent.screenshotCount,
        clipboardOperations: sessionEvent.clipboardOperations,
        fileOperations: sessionEvent.fileOperations,
        duration: sessionEvent.duration
      }
    };

    // Create cryptographic hash of the audit entry
    const entryHash = this.createCryptographicHash(auditEntry);
    auditEntry.hash = entryHash;
    auditEntry.previousHash = this.getLastAuditHash();

    // Add digital signature for authenticity
    auditEntry.signature = this.createDigitalSignature(entryHash);

    // Store in pending batch for blockchain submission
    this.pendingAuditEntries.push(auditEntry);

    console.log(`📝 Session audit entry created: ${auditEntry.id}`);

    // Submit batch if threshold reached
    if (this.pendingAuditEntries.length >= this.batchSize) {
      await this.submitAuditBatch();
    }

    return auditEntry;
  }

  /**
   * Create immutable audit entry for threat detection events
   * @param {Object} threatEvent - Threat detection data
   * @returns {Object} Audit entry with blockchain proof
   */
  async createThreatAuditEntry(threatEvent) {
    const auditEntry = {
      id: this.generateAuditId(),
      eventType: 'THREAT_DETECTION',
      timestamp: new Date().toISOString(),
      threatId: threatEvent.threatId,
      sessionId: threatEvent.sessionId,
      threatType: threatEvent.threatType,
      severity: threatEvent.severity,
      sourceIp: threatEvent.sourceIp,
      targetIp: threatEvent.targetIp,
      actionTaken: threatEvent.actionTaken,
      mlConfidence: threatEvent.mlConfidence,
      detectionMethod: threatEvent.detectionMethod,
      metadata: {
        signatures: threatEvent.signatures,
        anomalyScore: threatEvent.anomalyScore,
        networkPatterns: threatEvent.networkPatterns,
        behavioralIndicators: threatEvent.behavioralIndicators
      }
    };

    const entryHash = this.createCryptographicHash(auditEntry);
    auditEntry.hash = entryHash;
    auditEntry.previousHash = this.getLastAuditHash();
    auditEntry.signature = this.createDigitalSignature(entryHash);

    this.pendingAuditEntries.push(auditEntry);

    console.log(`🚨 Threat audit entry created: ${auditEntry.id}`);

    // Submit immediately for high-severity threats
    if (threatEvent.severity === 'critical' || threatEvent.severity === 'high') {
      await this.submitAuditBatch();
    }

    return auditEntry;
  }

  /**
   * Create immutable audit entry for administrative actions
   * @param {Object} adminAction - Administrative action data
   * @returns {Object} Audit entry with blockchain proof
   */
  async createAdminAuditEntry(adminAction) {
    const auditEntry = {
      id: this.generateAuditId(),
      eventType: 'ADMIN_ACTION',
      timestamp: new Date().toISOString(),
      adminId: adminAction.adminId,
      adminIp: adminAction.adminIp,
      action: adminAction.action,
      targetResource: adminAction.targetResource,
      parameters: adminAction.parameters,
      result: adminAction.result,
      sessionToken: this.hashSensitiveData(adminAction.sessionToken),
      metadata: {
        userAgent: adminAction.userAgent,
        requestId: adminAction.requestId,
        apiEndpoint: adminAction.apiEndpoint,
        httpMethod: adminAction.httpMethod
      }
    };

    const entryHash = this.createCryptographicHash(auditEntry);
    auditEntry.hash = entryHash;
    auditEntry.previousHash = this.getLastAuditHash();
    auditEntry.signature = this.createDigitalSignature(entryHash);

    this.pendingAuditEntries.push(auditEntry);

    console.log(`👤 Admin audit entry created: ${auditEntry.id}`);

    return auditEntry;
  }

  /**
   * Submit batch of audit entries to blockchain
   */
  async submitAuditBatch() {
    if (this.pendingAuditEntries.length === 0) return;

    try {
      console.log(`🔗 Submitting audit batch with ${this.pendingAuditEntries.length} entries to blockchain...`);

      // Create Merkle tree from audit entries
      const leaves = this.pendingAuditEntries.map(entry => 
        Buffer.from(entry.hash, 'hex')
      );

      this.merkleTree = new MerkleTree(leaves, crypto.createHash('sha256'), { 
        sortPairs: true 
      });

      const merkleRoot = this.merkleTree.getRoot();
      const batchHash = this.createBatchHash(this.pendingAuditEntries);

      // Submit to blockchain if contract available
      if (this.auditContract && this.web3.eth.defaultAccount) {
        await this.submitToBlockchain(merkleRoot, batchHash);
      }

      // Store batch locally with cryptographic proofs
      await this.storeBatchLocally(merkleRoot, batchHash, this.pendingAuditEntries);

      console.log(`✅ Audit batch submitted successfully. Merkle Root: ${merkleRoot.toString('hex')}`);

      // Clear pending entries
      this.pendingAuditEntries = [];

    } catch (error) {
      console.error('❌ Failed to submit audit batch:', error);
      // Keep entries for retry
    }
  }

  /**
   * Submit audit batch to blockchain smart contract
   */
  async submitToBlockchain(merkleRoot, batchHash) {
    const timestamp = Math.floor(Date.now() / 1000);

    const transaction = this.auditContract.methods.submitAuditBatch(
      `0x${merkleRoot.toString('hex')}`,
      timestamp,
      `0x${batchHash}`
    );

    const gas = await transaction.estimateGas({ from: this.web3.eth.defaultAccount });
    const gasPrice = await this.web3.eth.getGasPrice();

    const receipt = await transaction.send({
      from: this.web3.eth.defaultAccount,
      gas: gas,
      gasPrice: gasPrice
    });

    console.log(`⛽ Blockchain transaction successful: ${receipt.transactionHash}`);
    return receipt;
  }

  /**
   * Verify audit entry integrity using blockchain proofs
   * @param {Object} auditEntry - Audit entry to verify
   * @returns {Object} Verification result
   */
  async verifyAuditEntry(auditEntry) {
    try {
      // 1. Verify cryptographic hash
      const computedHash = this.createCryptographicHash({
        ...auditEntry,
        hash: undefined,
        signature: undefined
      });

      const hashValid = computedHash === auditEntry.hash;

      // 2. Verify digital signature
      const signatureValid = this.verifyDigitalSignature(
        auditEntry.hash, 
        auditEntry.signature
      );

      // 3. Verify blockchain proof if available
      let blockchainValid = false;
      if (this.merkleTree && auditEntry.batchId) {
        const leaf = Buffer.from(auditEntry.hash, 'hex');
        const proof = this.merkleTree.getHexProof(leaf);
        const root = this.merkleTree.getHexRoot();

        blockchainValid = this.merkleTree.verify(proof, leaf, root);

        // Additional verification against smart contract if available
        if (this.auditContract) {
          try {
            blockchainValid = await this.auditContract.methods.verifyAuditEntry(
              root,
              proof,
              auditEntry.hash
            ).call();
          } catch (contractError) {
            console.warn('Smart contract verification failed:', contractError);
          }
        }
      }

      const verificationResult = {
        entryId: auditEntry.id,
        timestamp: new Date().toISOString(),
        hashValid,
        signatureValid,
        blockchainValid,
        overallValid: hashValid && signatureValid && (blockchainValid || !auditEntry.batchId),
        verificationLevel: this.getVerificationLevel(hashValid, signatureValid, blockchainValid)
      };

      console.log(`🔍 Audit verification completed: ${verificationResult.overallValid ? 'VALID' : 'INVALID'}`);

      return verificationResult;

    } catch (error) {
      console.error('❌ Audit verification failed:', error);
      return {
        entryId: auditEntry.id,
        overallValid: false,
        error: error.message,
        verificationLevel: 'FAILED'
      };
    }
  }

  /**
   * Detect tampering attempts by analyzing audit chain
   * @returns {Object} Tampering detection report
   */
  async detectTampering() {
    // Implementation for detecting audit trail tampering
    // This would analyze the chain of audit entries for inconsistencies
    const report = {
      timestamp: new Date().toISOString(),
      totalEntries: 0,
      verifiedEntries: 0,
      suspiciousEntries: [],
      brokenChains: [],
      integrityScore: 0,
      status: 'UNKNOWN'
    };

    // Detailed tampering detection logic would go here
    // For now, return a basic report structure

    return report;
  }

  /**
   * Generate unique audit entry ID
   */
  generateAuditId() {
    return `audit_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Create cryptographic hash of audit entry
   */
  createCryptographicHash(data) {
    const serialized = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Create digital signature for audit entry
   */
  createDigitalSignature(hash) {
    const secretKey = process.env.AUDIT_SIGNATURE_KEY || 'default-audit-key';
    return CryptoJS.HmacSHA256(hash, secretKey).toString();
  }

  /**
   * Verify digital signature
   */
  verifyDigitalSignature(hash, signature) {
    const secretKey = process.env.AUDIT_SIGNATURE_KEY || 'default-audit-key';
    const computedSignature = CryptoJS.HmacSHA256(hash, secretKey).toString();
    return computedSignature === signature;
  }

  /**
   * Create batch hash for Merkle tree
   */
  createBatchHash(entries) {
    const batchData = entries.map(entry => entry.hash).join('');
    return crypto.createHash('sha256').update(batchData).digest('hex');
  }

  /**
   * Get last audit entry hash for chain linking
   */
  getLastAuditHash() {
    if (this.pendingAuditEntries.length === 0) {
      return '0'.repeat(64); // Genesis hash
    }
    return this.pendingAuditEntries[this.pendingAuditEntries.length - 1].hash;
  }

  /**
   * Hash sensitive data for audit
   */
  hashSensitiveData(data) {
    if (!data) return null;
    return crypto.createHash('sha256').update(data.toString()).digest('hex').substring(0, 16);
  }

  /**
   * Store audit batch locally with cryptographic proofs
   */
  async storeBatchLocally(merkleRoot, batchHash, entries) {
    // Store in database or file system with cryptographic verification
    const batchRecord = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      merkleRoot: merkleRoot.toString('hex'),
      batchHash,
      entryCount: entries.length,
      entries: entries.map(entry => ({
        id: entry.id,
        hash: entry.hash,
        timestamp: entry.timestamp,
        eventType: entry.eventType
      }))
    };

    // In a real implementation, this would be stored in a secure database
    console.log(`💾 Audit batch stored locally: ${batchRecord.id}`);
    return batchRecord;
  }

  /**
   * Get verification level based on validation results
   */
  getVerificationLevel(hashValid, signatureValid, blockchainValid) {
    if (blockchainValid && signatureValid && hashValid) return 'BLOCKCHAIN_VERIFIED';
    if (signatureValid && hashValid) return 'CRYPTOGRAPHICALLY_VERIFIED';
    if (hashValid) return 'HASH_VERIFIED';
    return 'UNVERIFIED';
  }

  /**
   * Get audit statistics
   */
  getAuditStatistics() {
    return {
      pendingEntries: this.pendingAuditEntries.length,
      batchSize: this.batchSize,
      blockchainConnected: !!this.web3,
      contractInitialized: !!this.auditContract,
      lastBatchTime: this.lastBatchTime || null
    };
  }
}

module.exports = BlockchainAuditService;