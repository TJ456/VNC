#!/usr/bin/env node

/**
 * VNC Protection Platform Startup Script (Express + React)
 * Starts the Express.js backend and React frontend
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

let backendProcess = null;
let frontendProcess = null;

function printBanner() {
  console.log("=" * 70);
  console.log("🛡️  VNC Protection Platform - Express Edition");
  console.log("Advanced VNC Security Monitoring with Express.js + PostgreSQL");
  console.log("=" * 70);
  console.log();
}

function checkDependencies() {
  console.log("🔍 Checking dependencies...");
  
  // Check Node.js
  try {
    const nodeVersion = process.version;
    console.log(`   ✅ Node.js ${nodeVersion}`);
  } catch (error) {
    console.log("   ❌ Node.js not found");
    return false;
  }
  
  // Check if backend dependencies are installed
  const backendNodeModules = path.join(__dirname, 'backend-express', 'node_modules');
  if (fs.existsSync(backendNodeModules)) {
    console.log("   ✅ Backend dependencies");
  } else {
    console.log("   ❌ Backend dependencies not installed");
    console.log("      Run: cd backend-express && npm install");
    return false;
  }
  
  // Check if frontend dependencies are installed
  const frontendNodeModules = path.join(__dirname, 'frontend', 'node_modules');
  if (fs.existsSync(frontendNodeModules)) {
    console.log("   ✅ Frontend dependencies");
  } else {
    console.log("   ❌ Frontend dependencies not installed");
    console.log("      Run: cd frontend && npm install");
    return false;
  }
  
  console.log("✅ Dependency check completed\n");
  return true;
}

function startBackend() {
  return new Promise((resolve, reject) => {
    console.log("🚀 Starting Express.js backend...");
    
    backendProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'backend-express'),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let backendReady = false;
    
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Backend] ${output.trim()}`);
      
      if (output.includes('Server running on') && !backendReady) {
        backendReady = true;
        resolve();
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error] ${data.toString().trim()}`);
    });
    
    backendProcess.on('close', (code) => {
      if (code !== 0 && !backendReady) {
        reject(new Error(`Backend process exited with code ${code}`));
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!backendReady) {
        reject(new Error('Backend startup timeout'));
      }
    }, 30000);
  });
}

function startFrontend() {
  return new Promise((resolve, reject) => {
    console.log("🌐 Starting React frontend...");
    
    frontendProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, BROWSER: 'none' } // Don't auto-open browser
    });
    
    let frontendReady = false;
    
    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Frontend] ${output.trim()}`);
      
      if ((output.includes('webpack compiled') || output.includes('Local:')) && !frontendReady) {
        frontendReady = true;
        resolve();
      }
    });
    
    frontendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('Warning')) {
        console.error(`[Frontend Error] ${error.trim()}`);
      }
    });
    
    frontendProcess.on('close', (code) => {
      if (code !== 0 && !frontendReady) {
        reject(new Error(`Frontend process exited with code ${code}`));
      }
    });
    
    // Timeout after 60 seconds
    setTimeout(() => {
      if (!frontendReady) {
        reject(new Error('Frontend startup timeout'));
      }
    }, 60000);
  });
}

function startFullPlatform() {
  console.log("🚀 Starting Full VNC Protection Platform (Express + React)...\n");
  
  startBackend()
    .then(() => {
      console.log("✅ Backend started successfully!");
      console.log("🔌 API available at: http://localhost:8000");
      console.log("📊 API Health: http://localhost:8000/api/health");
      
      return startFrontend();
    })
    .then(() => {
      console.log("✅ Frontend started successfully!");
      console.log("🌐 Dashboard available at: http://localhost:3000");
      
      console.log("\n" + "=" * 60);
      console.log("🎉 VNC Protection Platform is now running!");
      console.log("=" * 60);
      console.log("📊 Dashboard: http://localhost:3000");
      console.log("🔌 API: http://localhost:8000");
      console.log("📚 API Docs: http://localhost:8000/api/health");
      console.log("🔄 WebSocket: ws://localhost:8000/ws");
      console.log("\nPress Ctrl+C to stop all services...");
      
    })
    .catch((error) => {
      console.error("❌ Startup failed:", error.message);
      cleanup();
      process.exit(1);
    });
}

function startBackendOnly() {
  console.log("🔌 Starting Backend Only...\n");
  
  startBackend()
    .then(() => {
      console.log("✅ Backend started successfully!");
      console.log("\n" + "=" * 50);
      console.log("🔌 API available at: http://localhost:8000");
      console.log("📊 Health Check: http://localhost:8000/api/health"); 
      console.log("🔄 WebSocket: ws://localhost:8000/ws");
      console.log("\nPress Ctrl+C to stop...");
    })
    .catch((error) => {
      console.error("❌ Backend startup failed:", error.message);
      process.exit(1);
    });
}

function runDemo() {
  console.log("🎯 Running VNC Protection Platform Demo...\n");
  
  const demoProcess = spawn('node', ['quick_demo.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  demoProcess.on('close', (code) => {
    if (code === 0) {
      console.log("\n✅ Demo completed successfully!");
    } else {
      console.log("\n❌ Demo failed");
    }
    
    console.log("\nPress Enter to return to menu...");
    process.stdin.once('data', () => {
      showMenu();
    });
  });
}

function cleanup() {
  console.log("\n⏹️  Shutting down VNC Protection Platform...");
  
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  
  if (frontendProcess) {
    frontendProcess.kill();
    frontendProcess = null;
  }
  
  console.log("✅ All services stopped");
}

function showMenu() {
  console.log("🚀 VNC Protection Platform Startup Options:");
  console.log();
  console.log("1. 📊 Full Platform (Express Backend + React Frontend)");
  console.log("2. 🔌 Backend Only (Express API Server)");
  console.log("3. 🎯 Run Demo (Attack Simulation)");
  console.log("4. ⚙️  Setup Backend (Install Dependencies)");
  console.log("5. 📚 View Documentation");
  console.log("6. ❌ Exit");
  console.log();
  
  process.stdout.write("Select option (1-6): ");
}

function handleMenuChoice(choice) {
  choice = choice.toString().trim();
  
  switch (choice) {
    case '1':
      if (!checkDependencies()) {
        console.log("\nPlease install dependencies first (option 4)");
        setTimeout(showMenu, 2000);
        return;
      }
      startFullPlatform();
      break;
      
    case '2':
      if (!checkDependencies()) {
        console.log("\nPlease install dependencies first (option 4)");
        setTimeout(showMenu, 2000);
        return;
      }
      startBackendOnly();
      break;
      
    case '3':
      runDemo();
      break;
      
    case '4':
      console.log("\n🔧 Setting up backend dependencies...");
      console.log("Please run one of the following:");
      console.log("Windows: setup-express-backend.bat");
      console.log("Linux/macOS: chmod +x setup-express-backend.sh && ./setup-express-backend.sh");
      setTimeout(showMenu, 3000);
      break;
      
    case '5':
      console.log("\n📚 Documentation available:");
      console.log("- README.md - Project overview");
      console.log("- DEMO_INSTRUCTIONS.md - Demo guide");
      console.log("- docs/TECHNICAL_DOCUMENTATION.md - Technical details");
      setTimeout(showMenu, 3000);
      break;
      
    case '6':
      console.log("👋 Goodbye!");
      process.exit(0);
      break;
      
    default:
      console.log("❌ Invalid option. Please select 1-6.");
      setTimeout(showMenu, 1000);
      break;
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

// Handle process termination
process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

// Main execution
async function main() {
  try {
    printBanner();
    
    // Show menu and wait for input
    showMenu();
    
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', handleMenuChoice);
    
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { startBackend, startFrontend, startFullPlatform, cleanup };