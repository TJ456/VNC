#!/bin/bash

# Blockchain Infrastructure Setup Script
# This script sets up a private blockchain network for the VNC Protection Platform

set -e

echo "🚀 VNC Protection Platform - Blockchain Infrastructure Setup"
echo "==========================================================="

# Configuration
NETWORK_NAME="vnc-protection-network"
CHAIN_ID="2024"
NETWORK_PORT="8545"
ACCOUNTS_COUNT="10"
INITIAL_BALANCE="1000"

# Directories
BLOCKCHAIN_DIR="./blockchain"
CONTRACTS_DIR="$BLOCKCHAIN_DIR/contracts"
BUILD_DIR="$BLOCKCHAIN_DIR/build"

echo "📁 Creating blockchain infrastructure directories..."
mkdir -p $BLOCKCHAIN_DIR $CONTRACTS_DIR $BUILD_DIR

cd $BLOCKCHAIN_DIR

# Install dependencies
echo "📦 Installing blockchain dependencies..."
if [ ! -f "package.json" ]; then
    npm init -y
fi

npm install --save-dev truffle ganache @truffle/hdwallet-provider
npm install --save web3 @openzeppelin/contracts

# Create truffle configuration
echo "🔧 Setting up Truffle configuration..."
cat > truffle-config.js << 'EOL'
const HDWalletProvider = require('@truffle/hdwallet-provider');

const mnemonic = process.env.BLOCKCHAIN_MNEMONIC || 
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 6721975,
      gasPrice: 20000000000
    },
    
    vnc_protection: {
      provider: () => new HDWalletProvider(mnemonic, `http://localhost:8545`),
      network_id: 2024,
      gas: 6721975,
      gasPrice: 20000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },

  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};
EOL

echo "📄 Creating deployment migrations..."
mkdir -p migrations

cat > migrations/1_initial_migration.js << 'EOL'
const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
};
EOL

cat > migrations/2_deploy_contracts.js << 'EOL'
const AuditTrail = artifacts.require("AuditTrail");
const ZeroTrustAccess = artifacts.require("ZeroTrustAccess");
const ThreatIntelligence = artifacts.require("ThreatIntelligence");
const DataProvenance = artifacts.require("DataProvenance");

module.exports = async function (deployer, network, accounts) {
  console.log("🚀 Deploying VNC Protection Platform Smart Contracts...");
  console.log("Network:", network);
  console.log("Deployer account:", accounts[0]);

  // Deploy Audit Trail Contract
  console.log("📝 Deploying AuditTrail contract...");
  await deployer.deploy(AuditTrail);
  const auditTrail = await AuditTrail.deployed();
  console.log("✅ AuditTrail deployed at:", auditTrail.address);

  // Deploy Zero Trust Access Contract
  console.log("🔐 Deploying ZeroTrustAccess contract...");
  await deployer.deploy(ZeroTrustAccess);
  const zeroTrustAccess = await ZeroTrustAccess.deployed();
  console.log("✅ ZeroTrustAccess deployed at:", zeroTrustAccess.address);

  // Deploy Threat Intelligence Contract
  console.log("🛡️ Deploying ThreatIntelligence contract...");
  await deployer.deploy(ThreatIntelligence);
  const threatIntelligence = await ThreatIntelligence.deployed();
  console.log("✅ ThreatIntelligence deployed at:", threatIntelligence.address);

  // Deploy Data Provenance Contract
  console.log("📊 Deploying DataProvenance contract...");
  await deployer.deploy(DataProvenance);
  const dataProvenance = await DataProvenance.deployed();
  console.log("✅ DataProvenance deployed at:", dataProvenance.address);

  // Save deployment info
  const deploymentInfo = {
    network: network,
    timestamp: new Date().toISOString(),
    contracts: {
      AuditTrail: auditTrail.address,
      ZeroTrustAccess: zeroTrustAccess.address,
      ThreatIntelligence: threatIntelligence.address,
      DataProvenance: dataProvenance.address
    },
    deployer: accounts[0]
  };

  console.log("\n📄 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
};
EOL

# Create Ganache startup script
cat > start-blockchain.js << 'EOL'
const ganache = require('ganache');

const options = {
  accounts: [
    {
      secretKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
      balance: '0x3635C9ADC5DEA00000' // 1000 ETH
    },
    {
      secretKey: '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1',
      balance: '0x3635C9ADC5DEA00000'
    },
    {
      secretKey: '0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c',
      balance: '0x3635C9ADC5DEA00000'
    }
  ],
  chain: {
    chainId: 2024,
    networkId: 2024
  },
  miner: {
    blockTime: 2 // Mine a block every 2 seconds
  },
  logging: {
    quiet: false
  }
};

const server = ganache.server(options);
const PORT = 8545;

server.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Failed to start blockchain:', err);
    process.exit(1);
  }
  
  console.log('🔗 VNC Protection Blockchain Network Started');
  console.log('===========================================');
  console.log(`🌐 RPC Server: http://localhost:${PORT}`);
  console.log(`⛓️ Chain ID: ${options.chain.chainId}`);
  console.log(`💰 Pre-funded accounts: ${options.accounts.length}`);
  console.log('===========================================');
  
  // Display account information
  options.accounts.forEach((account, index) => {
    console.log(`Account ${index}: ${ganache.provider(options).getAccounts().then(accounts => accounts[index])}`);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down blockchain network...');
  server.close(() => {
    console.log('✅ Blockchain network stopped');
    process.exit(0);
  });
});
EOL

# Create deployment script
cat > deploy-contracts.sh << 'EOL'
#!/bin/bash

echo "🚀 Deploying VNC Protection Platform Smart Contracts"
echo "==================================================="

# Check if Ganache is running
echo "🔍 Checking blockchain network..."
if ! nc -z localhost 8545; then
    echo "❌ Blockchain network not running. Starting Ganache..."
    node start-blockchain.js &
    GANACHE_PID=$!
    echo "⏳ Waiting for blockchain to start..."
    sleep 10
else
    echo "✅ Blockchain network is running"
fi

# Compile contracts
echo "📝 Compiling smart contracts..."
npx truffle compile

# Deploy contracts
echo "🚀 Deploying contracts to blockchain..."
npx truffle migrate --network development

if [ $? -eq 0 ]; then
    echo "✅ Smart contracts deployed successfully!"
    
    # Generate environment file
    echo "📄 Generating blockchain configuration..."
    cat > ../blockchain-config.env << EOF
# VNC Protection Platform - Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_WS_URL=ws://localhost:8546
BLOCKCHAIN_CHAIN_ID=2024
BLOCKCHAIN_NETWORK_ID=2024

# Contract Addresses (Update after deployment)
AUDIT_CONTRACT_ADDRESS=
ACCESS_CONTRACT_ADDRESS=
THREAT_CONTRACT_ADDRESS=
PROVENANCE_CONTRACT_ADDRESS=
INTEGRITY_CONTRACT_ADDRESS=

# Blockchain Account Configuration
BLOCKCHAIN_PRIVATE_KEY=0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
BLOCKCHAIN_MNEMONIC="abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"

# Security Keys
AUDIT_SIGNATURE_KEY=vnc-audit-secret-key-2024
TOKEN_SIGNATURE_KEY=vnc-token-secret-key-2024

# Blockchain Settings
BLOCKCHAIN_BATCH_SIZE=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

    echo "✅ Blockchain infrastructure setup complete!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Update contract addresses in blockchain-config.env"
    echo "2. Copy blockchain-config.env to your backend .env file"
    echo "3. Install blockchain dependencies in your backend"
    echo "4. Restart your VNC Protection Platform"
    
else
    echo "❌ Contract deployment failed!"
    exit 1
fi
EOL

chmod +x deploy-contracts.sh

echo "✅ Blockchain infrastructure setup script created successfully!"
echo ""
echo "🚀 To deploy the blockchain infrastructure:"
echo "1. cd blockchain"
echo "2. ./deploy-contracts.sh"
echo ""
echo "📁 Files created:"
echo "- blockchain/truffle-config.js"
echo "- blockchain/start-blockchain.js" 
echo "- blockchain/deploy-contracts.sh"
echo "- blockchain/migrations/"
EOL