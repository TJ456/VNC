// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AuditTrail
 * @dev Immutable audit trail for VNC Protection Platform
 * Stores cryptographic proofs of all security events
 */
contract AuditTrail is Ownable, ReentrancyGuard {
    
    struct AuditBatch {
        bytes32 merkleRoot;
        uint256 timestamp;
        bytes32 batchHash;
        uint256 entryCount;
        bool verified;
        address submitter;
    }
    
    struct AuditEntry {
        bytes32 entryHash;
        uint256 batchId;
        uint256 timestamp;
        string eventType;
        bool exists;
    }
    
    mapping(uint256 => AuditBatch) public auditBatches;
    mapping(bytes32 => AuditEntry) public auditEntries;
    mapping(address => bool) public authorizedNodes;
    
    uint256 public batchCounter;
    uint256 public totalEntries;
    
    event AuditBatchSubmitted(
        uint256 indexed batchId,
        bytes32 indexed merkleRoot,
        uint256 entryCount,
        address submitter
    );
    
    event AuditEntryVerified(
        bytes32 indexed entryHash,
        uint256 indexed batchId,
        bool verified
    );
    
    modifier onlyAuthorized() {
        require(authorizedNodes[msg.sender] || msg.sender == owner(), "Unauthorized");
        _;
    }
    
    constructor() {
        authorizedNodes[msg.sender] = true;
    }
    
    /**
     * @dev Submit batch of audit entries with Merkle proof
     */
    function submitAuditBatch(
        bytes32 _merkleRoot,
        uint256 _timestamp,
        bytes32 _batchHash
    ) external onlyAuthorized nonReentrant returns (uint256) {
        require(_merkleRoot != bytes32(0), "Invalid merkle root");
        
        uint256 batchId = ++batchCounter;
        
        auditBatches[batchId] = AuditBatch({
            merkleRoot: _merkleRoot,
            timestamp: _timestamp,
            batchHash: _batchHash,
            entryCount: 10, // Default batch size
            verified: true,
            submitter: msg.sender
        });
        
        totalEntries += 10;
        
        emit AuditBatchSubmitted(batchId, _merkleRoot, 10, msg.sender);
        
        return batchId;
    }
    
    /**
     * @dev Verify audit entry using Merkle proof
     */
    function verifyAuditEntry(
        bytes32 _merkleRoot,
        bytes32[] memory _proof,
        bytes32 _leaf
    ) public pure returns (bool) {
        bytes32 computedHash = _leaf;
        
        for (uint256 i = 0; i < _proof.length; i++) {
            bytes32 proofElement = _proof[i];
            
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        
        return computedHash == _merkleRoot;
    }
    
    /**
     * @dev Add authorized node
     */
    function addAuthorizedNode(address _node) external onlyOwner {
        authorizedNodes[_node] = true;
    }
    
    /**
     * @dev Get audit batch details
     */
    function getAuditBatch(uint256 _batchId) external view returns (
        bytes32 merkleRoot,
        uint256 timestamp,
        bytes32 batchHash,
        bool verified
    ) {
        AuditBatch memory batch = auditBatches[_batchId];
        return (
            batch.merkleRoot,
            batch.timestamp,
            batch.batchHash,
            batch.verified
        );
    }
}