# 🔗 Blockchain API Reference

## Overview
This document provides comprehensive API documentation for all blockchain-enhanced security features in the VNC Protection Platform.

## Base URL
```
Production: https://api.vnc-protection.yourdomain.com
Development: http://localhost:5000
```

## Authentication
All API endpoints require JWT authentication:
```javascript
Headers: {
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

---

## 🔒 Immutable Audit Trail API

### Get Blockchain Status
```http
GET /api/blockchain/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "auditService": {
      "pendingEntries": 5,
      "batchSize": 25,
      "blockchainConnected": true,
      "lastBatchTime": "2024-10-04T10:30:00.000Z"
    },
    "accessService": {
      "activeTokens": 12,
      "policyViolations": 3,
      "contractConnected": true
    },
    "threatService": {
      "localThreats": 45,
      "consortiumNodes": 15,
      "lastSync": "2024-10-04T10:25:00.000Z"
    },
    "provenanceService": {
      "registeredFiles": 1250,
      "integrityChecks": 2100,
      "quarantinedFiles": 3
    }
  }
}
```

### Create Session Audit Entry
```http
POST /api/blockchain/audit/session
```

**Request Body:**
```json
{
  "sessionId": "session_12345",
  "clientIp": "192.168.1.100",
  "serverIp": "10.0.0.50",
  "action": "started",
  "dataTransferred": 1048576,
  "riskScore": 25.5,
  "userAgent": "VNC Client 1.0",
  "authMethod": "certificate",
  "metadata": {
    "packetsExchanged": 1500,
    "screenshotCount": 10,
    "clipboardOperations": 2,
    "fileOperations": 0,
    "duration": 3600
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "auditId": "audit_1696419000_a1b2c3d4",
    "hash": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    "signature": "0x9f8e7d6c5b4a39281f0e9d8c7b6a59483f2e1d0c9b8a79685f4e3d2c1b0a9f8e",
    "message": "Session audit entry created with blockchain proof"
  }
}
```

### Create Threat Audit Entry
```http
POST /api/blockchain/audit/threat
```

**Request Body:**
```json
{
  "threatId": "threat_12345",
  "sessionId": "session_12345",
  "threatType": "CREDENTIAL_THEFT",
  "severity": "high",
  "sourceIp": "203.0.113.10",
  "targetIp": "192.168.1.100",
  "actionTaken": "blocked",
  "mlConfidence": 95.5,
  "detectionMethod": "behavioral_analysis",
  "metadata": {
    "signatures": ["clipboard_monitoring", "keylogger_pattern"],
    "anomalyScore": 87.2,
    "networkPatterns": ["suspicious_data_flow"],
    "behavioralIndicators": ["rapid_key_capture"]
  }
}
```

### Verify Audit Entry
```http
POST /api/blockchain/audit/verify
```

**Request Body:**
```json
{
  "auditEntry": {
    "id": "audit_1696419000_a1b2c3d4",
    "hash": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    "signature": "0x9f8e7d6c5b4a39281f0e9d8c7b6a59483f2e1d0c9b8a79685f4e3d2c1b0a9f8e",
    "timestamp": "2024-10-04T10:30:00.000Z",
    "eventType": "VNC_SESSION"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entryId": "audit_1696419000_a1b2c3d4",
    "timestamp": "2024-10-04T10:35:00.000Z",
    "hashValid": true,
    "signatureValid": true,
    "blockchainValid": true,
    "overallValid": true,
    "verificationLevel": "BLOCKCHAIN_VERIFIED"
  }
}
```

---

## 🔑 Zero-Trust Access Control API

### Generate Access Token
```http
POST /api/blockchain/access/token
```

**Request Body:**
```json
{
  "userId": "user_12345",
  "userAddress": "0xAB123456789012345678901234567890AB123456",
  "clientIp": "192.168.1.100",
  "requestedPermissions": ["VIEW_ONLY", "CLIPBOARD_ACCESS"],
  "dataLimit": 100,
  "timeLimit": 3600,
  "allowedIPs": ["192.168.1.0/24"],
  "sessionType": "standard"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": {
      "id": "zta_1696419000_x1y2z3a4",
      "contractTokenId": 12345,
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "permissions": ["VIEW_ONLY", "CLIPBOARD_ACCESS"],
      "restrictions": {
        "dataLimit": 100,
        "timeLimit": 3600,
        "allowedIPs": ["192.168.1.0/24"],
        "ipRestricted": true
      },
      "status": "active",
      "createdAt": "2024-10-04T10:30:00.000Z",
      "expiresAt": "2024-10-04T11:30:00.000Z"
    },
    "message": "Zero-trust access token generated with smart contract enforcement"
  }
}
```

### Validate Session Access
```http
POST /api/blockchain/access/validate
```

**Request Body:**
```json
{
  "sessionData": {
    "sessionId": "session_12345",
    "clientIp": "192.168.1.100",
    "serverIp": "10.0.0.50",
    "action": "file_transfer",
    "dataSize": 1048576,
    "fileOperations": ["upload:document.pdf"],
    "clipboardAccess": false,
    "controlRequests": []
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allowed": true,
    "code": "ACCESS_GRANTED",
    "message": "All policy checks passed",
    "tokenId": "zta_1696419000_x1y2z3a4",
    "permissions": ["VIEW_ONLY", "CLIPBOARD_ACCESS"],
    "dataRemaining": 99,
    "timeRemaining": 3540000
  }
}
```

### Enforce Policy Violation
```http
POST /api/blockchain/access/enforce
```

**Request Body:**
```json
{
  "tokenId": "zta_1696419000_x1y2z3a4",
  "violationType": "DATA_LIMIT_EXCEEDED",
  "sessionId": "session_12345",
  "severity": "medium",
  "metadata": {
    "dataUsed": 110,
    "dataLimit": 100,
    "timestamp": "2024-10-04T10:45:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "action": "SESSION_TERMINATED",
    "reason": "Data limit exceeded",
    "timestamp": "2024-10-04T10:45:00.000Z",
    "enforcementLogged": true
  }
}
```

---

## 🛡️ Decentralized Threat Intelligence API

### Analyze Threat Pattern
```http
POST /api/blockchain/threat/analyze
```

**Request Body:**
```json
{
  "sessionId": "session_12345",
  "clientIp": "203.0.113.10",
  "serverIp": "192.168.1.100",
  "networkTraffic": [
    {
      "timestamp": "2024-10-04T10:30:00.000Z",
      "protocol": "VNC",
      "sourcePort": 45123,
      "destPort": 5900,
      "payload": "base64_encoded_packet_data",
      "size": 1024
    }
  ],
  "behavioralData": {
    "sessionDuration": 3600,
    "dataTransfer": {
      "uploaded": 1048576,
      "downloaded": 2097152,
      "rate": 1024
    },
    "userInteractions": {
      "mouseClicks": 150,
      "keystrokes": 500,
      "clipboardAccess": 3
    },
    "accessPatterns": {
      "fileAccess": ["document.pdf", "config.txt"],
      "directories": ["/home/user", "/tmp"],
      "commands": ["ls", "cat", "cp"]
    }
  },
  "timestamps": {
    "start": "2024-10-04T10:30:00.000Z",
    "end": "2024-10-04T11:30:00.000Z"
  },
  "anomalyScore": 75.5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "threatId": "threat_1696419000_t1h2r3e4",
    "threatType": "DATA_EXFILTRATION",
    "severity": "high",
    "confidence": 85.2,
    "signatures": [
      "large_data_transfer",
      "unusual_file_access",
      "rapid_clipboard_access"
    ],
    "patterns": [
      "excessive_data_download",
      "sensitive_file_access"
    ],
    "indicators": {
      "networkIndicators": ["high_bandwidth_usage", "unusual_ports"],
      "behavioralIndicators": ["file_enumeration", "data_staging"],
      "temporalIndicators": ["off_hours_access", "rapid_execution"]
    },
    "networkShared": true,
    "blockchainSubmitted": true
  }
}
```

### Share Threat Intelligence
```http
POST /api/blockchain/threat/share
```

**Request Body:**
```json
{
  "threatId": "threat_1696419000_t1h2r3e4",
  "threatType": "DATA_EXFILTRATION",
  "severity": "high",
  "confidence": 85.2,
  "signatures": ["large_data_transfer", "unusual_file_access"],
  "patterns": ["excessive_data_download"],
  "indicators": {
    "networkIndicators": ["high_bandwidth_usage"],
    "behavioralIndicators": ["file_enumeration"]
  },
  "metadata": {
    "sourceNode": "production-node-001",
    "detectionTime": "2024-10-04T10:30:00.000Z"
  }
}
```

### Query Threat Intelligence
```http
GET /api/blockchain/threat/query?signature=0x1a2b3c4d&threatType=DATA_EXFILTRATION&timeRange=86400
```

**Response:**
```json
{
  "success": true,
  "data": {
    "local": [
      {
        "threatId": "threat_1696419000_t1h2r3e4",
        "threatType": "DATA_EXFILTRATION",
        "confidence": 85.2,
        "timestamp": "2024-10-04T10:30:00.000Z"
      }
    ],
    "blockchain": [
      {
        "signature": "0x1a2b3c4d5e6f...",
        "threatType": "DATA_EXFILTRATION",
        "confirmations": 5,
        "networkConfirmed": true
      }
    ],
    "consortium": [
      {
        "nodeId": "node-002",
        "matchingThreats": 3,
        "lastUpdate": "2024-10-04T10:25:00.000Z"
      }
    ],
    "aggregated": {
      "totalThreats": 15,
      "highConfidence": 8,
      "recentDetections": 3
    }
  }
}
```

---

## 📊 Data Provenance & File Integrity API

### Register File Provenance
```http
POST /api/blockchain/provenance/register
```

**Request Body:**
```json
{
  "fileName": "important_document.pdf",
  "fileContent": "base64_encoded_file_content",
  "sourceSession": "session_12345",
  "sourceUser": "user_12345",
  "transferType": "upload",
  "metadata": {
    "originalPath": "/home/user/documents/important_document.pdf",
    "permissions": "644",
    "owner": "user",
    "group": "users"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file_1696419000_f1l2e3s4",
    "primaryHash": "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
    "provenanceId": 67890,
    "riskLevel": "LOW",
    "quarantined": false,
    "blockchainProof": true
  }
}
```

### Verify File Integrity
```http
POST /api/blockchain/provenance/verify
```

**Request Body:**
```json
{
  "fileName": "important_document.pdf",
  "fileContent": "base64_encoded_file_content",
  "originalHash": "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
  "sessionId": "session_12345",
  "transferDirection": "incoming"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": "INTEGRITY_VERIFIED",
    "message": "File integrity confirmed",
    "integrityScore": 100,
    "checks": {
      "primaryHashMatch": true,
      "additionalHashesMatch": 100,
      "sizeMatch": true,
      "malwareDetected": false,
      "tamperingDetected": false
    },
    "verificationTime": "2024-10-04T10:35:00.000Z"
  }
}
```

### Track Data Lineage
```http
POST /api/blockchain/provenance/lineage
```

**Request Body:**
```json
{
  "fileHash": "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
  "fromSession": "session_12345",
  "toSession": "session_67890",
  "fromUser": "user_12345",
  "toUser": "user_67890",
  "transferMethod": "vnc_file_transfer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lineageId": "lineage_1696419000_l1n2e3a4",
    "transferHop": 3,
    "totalHops": 3,
    "suspiciousActivity": false,
    "blockchainRecorded": true
  }
}
```

---

## 📊 Comprehensive Dashboard API

### Get Blockchain Dashboard
```http
GET /api/blockchain/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "auditTrail": {
      "stats": {
        "pendingEntries": 5,
        "batchSize": 25,
        "blockchainConnected": true
      },
      "recentEntries": 5,
      "integrityStatus": "verified"
    },
    "accessControl": {
      "stats": {
        "activeTokens": 12,
        "policyViolations": 3
      },
      "activeTokens": 12,
      "policyViolations": 3
    },
    "threatIntelligence": {
      "stats": {
        "localThreats": 45,
        "consortiumNodes": 15
      },
      "recentThreats": 7,
      "networkNodes": 15
    },
    "dataProvenance": {
      "stats": {
        "registeredFiles": 1250,
        "integrityChecks": 2100,
        "quarantinedFiles": 3
      },
      "filesTracked": 1250,
      "integrityVerifications": 2100
    },
    "blockchainHealth": {
      "connected": true,
      "lastBlock": 1696419000000,
      "networkId": "2024",
      "gasPrice": "20 Gwei"
    },
    "securityScore": {
      "overall": 98.5,
      "auditCompliance": 100,
      "accessSecurity": 97,
      "threatProtection": 99,
      "dataIntegrity": 98
    }
  }
}
```

---

## 🚨 Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| 4001 | Invalid blockchain configuration | Check environment variables |
| 4002 | Smart contract not deployed | Deploy contracts first |
| 4003 | Insufficient gas for transaction | Increase gas limit |
| 4004 | Invalid cryptographic signature | Regenerate signing keys |
| 4005 | File integrity verification failed | File may be tampered |
| 4006 | Threat intelligence sharing failed | Check network connectivity |
| 4007 | Access token validation failed | Token expired or invalid |
| 5001 | Blockchain network unavailable | Check RPC connection |
| 5002 | Database connection error | Check database status |

## 📝 Rate Limits

- **Standard endpoints**: 200 requests per 15 minutes
- **Blockchain operations**: 50 requests per 15 minutes
- **File upload**: 10 requests per 15 minutes
- **Threat analysis**: 25 requests per 15 minutes

## 🔐 Security Headers

All responses include security headers:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```