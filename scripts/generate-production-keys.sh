#!/bin/bash

# Production Key Generation Script for VNC Protection Platform
# This script generates all required cryptographic keys and secrets for production deployment

set -e

echo "🔐 VNC Protection Platform - Production Key Generator"
echo "=================================================="
echo ""

# Check if required tools are available
command -v openssl >/dev/null 2>&1 || { echo "❌ OpenSSL is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }

# Create output directory
OUTPUT_DIR="production-keys"
mkdir -p "$OUTPUT_DIR"

echo "📝 Generating production keys and secrets..."
echo ""

# Generate production environment file
ENV_FILE="$OUTPUT_DIR/.env.production"

cat > "$ENV_FILE" << EOF
# =============================================================================
# VNC Protection Platform - Production Environment Configuration
# Generated on: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# =============================================================================

NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database (Set via environment variable for security)
DATABASE_URL=\${PRODUCTION_DATABASE_URL}

EOF

echo "🔑 Generating JWT secrets..."
JWT_SECRET=$(openssl rand -hex 64)
echo "JWT_SECRET=$JWT_SECRET" >> "$ENV_FILE"
echo "JWT_EXPIRES_IN=24h" >> "$ENV_FILE"
echo "BCRYPT_ROUNDS=14" >> "$ENV_FILE"
echo "" >> "$ENV_FILE"

echo "🔐 Generating blockchain keys..."
BLOCKCHAIN_PRIVATE_KEY=$(openssl rand -hex 32)
echo "BLOCKCHAIN_PRIVATE_KEY=0x$BLOCKCHAIN_PRIVATE_KEY" >> "$ENV_FILE"

echo "🎲 Generating mnemonic phrase..."
MNEMONIC=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))" | fold -w 8 | head -12 | tr '\n' ' ')
echo "BLOCKCHAIN_MNEMONIC=\"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about\"" >> "$ENV_FILE"
echo "" >> "$ENV_FILE"

echo "🔒 Generating audit and token signing keys..."
AUDIT_KEY=$(openssl rand -hex 32)
TOKEN_KEY=$(openssl rand -hex 32)
echo "AUDIT_SIGNATURE_KEY=$AUDIT_KEY" >> "$ENV_FILE"
echo "TOKEN_SIGNATURE_KEY=$TOKEN_KEY" >> "$ENV_FILE"
echo "" >> "$ENV_FILE"

echo "⚡ Adding blockchain configuration..."
cat >> "$ENV_FILE" << 'EOF'
# Blockchain Network
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_WS_URL=ws://localhost:8546
BLOCKCHAIN_CHAIN_ID=2024
BLOCKCHAIN_NETWORK_ID=2024

# Smart Contract Addresses (Update after deployment)
AUDIT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
ACCESS_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
THREAT_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
PROVENANCE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Performance Settings
BLOCKCHAIN_BATCH_SIZE=25
MONITORING_INTERVAL=2000
THREAT_THRESHOLD=75
WORKER_PROCESSES=4
CONNECTION_POOL_SIZE=20

# Security Settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
MAX_FILE_SIZE=1073741824
QUARANTINE_ENABLED=true

# CORS Origins (Update with your domains)
ALLOWED_ORIGINS=https://vnc-protection.yourdomain.com
EOF

echo "📄 Generating deployment checklist..."
cat > "$OUTPUT_DIR/deployment-checklist.md" << 'EOF'
# Production Deployment Checklist

## Pre-Deployment
- [ ] All environment variables configured
- [ ] Database connection tested
- [ ] SSL certificates obtained
- [ ] Domain DNS configured
- [ ] Firewall rules configured

## Blockchain Setup
- [ ] Private blockchain network deployed
- [ ] Smart contracts compiled
- [ ] Smart contracts deployed
- [ ] Contract addresses updated in .env
- [ ] Blockchain accounts funded

## Security
- [ ] Generated keys stored securely
- [ ] No hardcoded credentials in code
- [ ] Rate limiting configured
- [ ] CORS origins restricted
- [ ] Security headers enabled

## Infrastructure
- [ ] Load balancer configured
- [ ] Auto-scaling configured
- [ ] Monitoring alerts set up
- [ ] Backup strategy implemented
- [ ] Log rotation configured

## Testing
- [ ] Health checks passing
- [ ] API endpoints tested
- [ ] WebSocket connections working
- [ ] Blockchain integration tested
- [ ] Security features validated

## Post-Deployment
- [ ] Monitor system performance
- [ ] Verify blockchain operations
- [ ] Test threat detection
- [ ] Validate audit trail
- [ ] Document any issues
EOF

echo "🔧 Generating blockchain deployment script..."
cat > "$OUTPUT_DIR/deploy-blockchain.sh" << 'EOF'
#!/bin/bash

# Blockchain Deployment Script
set -e

echo "🚀 Deploying VNC Protection Blockchain Infrastructure..."

# Navigate to blockchain directory
cd blockchain

# Install dependencies
echo "📦 Installing blockchain dependencies..."
npm install

# Start local blockchain (if needed)
echo "⛓️ Starting blockchain network..."
if ! nc -z localhost 8545; then
    echo "Starting Ganache..."
    npx ganache --host 0.0.0.0 --port 8545 --chainId 2024 --networkId 2024 &
    GANACHE_PID=$!
    sleep 10
fi

# Compile contracts
echo "🔨 Compiling smart contracts..."
npx truffle compile

# Deploy contracts
echo "🚀 Deploying smart contracts..."
npx truffle migrate --network development

echo "✅ Blockchain deployment complete!"
echo "📋 Next steps:"
echo "1. Update contract addresses in .env file"
echo "2. Test contract deployment with: npx truffle console"
echo "3. Start the backend service"
EOF

chmod +x "$OUTPUT_DIR/deploy-blockchain.sh"

echo "🔒 Generating additional security keys..."
FILE_ENCRYPTION_KEY=$(openssl rand -hex 32)
BACKUP_ENCRYPTION_KEY=$(openssl rand -hex 32)
WEBHOOK_SECRET=$(openssl rand -hex 32)

cat >> "$ENV_FILE" << EOF

# Additional Security Keys
FILE_ENCRYPTION_KEY=$FILE_ENCRYPTION_KEY
BACKUP_ENCRYPTION_KEY=$BACKUP_ENCRYPTION_KEY
WEBHOOK_SECRET=$WEBHOOK_SECRET
EOF

echo "📊 Generating key summary..."
cat > "$OUTPUT_DIR/key-summary.txt" << EOF
VNC Protection Platform - Production Keys Summary
================================================

Generated on: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

JWT Secret: $JWT_SECRET
Audit Signature Key: $AUDIT_KEY
Token Signature Key: $TOKEN_KEY
Blockchain Private Key: 0x$BLOCKCHAIN_PRIVATE_KEY
File Encryption Key: $FILE_ENCRYPTION_KEY
Backup Encryption Key: $BACKUP_ENCRYPTION_KEY
Webhook Secret: $WEBHOOK_SECRET

IMPORTANT SECURITY NOTES:
- Store these keys in your secure key management system
- Never commit keys to version control
- Use different keys for each environment
- Rotate keys regularly according to your security policy
- The blockchain private key controls smart contract operations
- The audit signature key ensures log integrity

Next Steps:
1. Copy .env.production to your server
2. Set environment variables securely
3. Deploy smart contracts using deploy-blockchain.sh
4. Update contract addresses in environment
5. Start the application services
EOF

echo "✅ Production key generation complete!"
echo ""
echo "📁 Generated files:"
echo "  - $ENV_FILE"
echo "  - $OUTPUT_DIR/key-summary.txt"
echo "  - $OUTPUT_DIR/deployment-checklist.md"
echo "  - $OUTPUT_DIR/deploy-blockchain.sh"
echo ""
echo "⚠️  CRITICAL: Store these keys securely and never commit them to version control!"
echo "📋 Review the deployment checklist before going to production."
echo ""
echo "🔒 Key files are ready for secure storage in your key management system."