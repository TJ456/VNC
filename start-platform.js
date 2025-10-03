#!/usr/bin/env node
/**
 * Comprehensive startup script for VNC Protection Platform
 * Handles Express backend, ML service, and frontend coordination
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class PlatformLauncher {
    constructor() {
        this.services = {
            backend: null,
            frontend: null,
            ml: null
        };
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    log(message, color = colors.reset) {
        console.log(`${color}${message}${colors.reset}`);
    }

    async checkPrerequisites() {
        this.log('\n🔍 Checking prerequisites...', colors.cyan);
        
        // Check if Node.js is available
        try {
            await this.execCommand('node --version');
            this.log('✅ Node.js is available', colors.green);
        } catch (error) {
            this.log('❌ Node.js is not available', colors.red);
            return false;
        }

        // Check if Python is available
        try {
            await this.execCommand('python --version');
            this.log('✅ Python is available', colors.green);
        } catch (error) {
            try {
                await this.execCommand('python3 --version');
                this.log('✅ Python3 is available', colors.green);
            } catch (error) {
                this.log('❌ Python is not available', colors.red);
                return false;
            }
        }

        // Check directories
        const backendDir = path.join(__dirname, 'backend-express');
        const frontendDir = path.join(__dirname, 'frontend');
        
        if (!fs.existsSync(backendDir)) {
            this.log('❌ Backend directory not found', colors.red);
            return false;
        }
        
        if (!fs.existsSync(frontendDir)) {
            this.log('❌ Frontend directory not found', colors.red);
            return false;
        }

        this.log('✅ All prerequisites met', colors.green);
        return true;
    }

    execCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) reject(error);
                else resolve(stdout);
            });
        });
    }

    startService(name, command, cwd, color) {
        return new Promise((resolve) => {
            this.log(`🚀 Starting ${name}...`, color);
            
            const process = spawn(command, { 
                shell: true, 
                cwd,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            process.stdout.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    console.log(`${color}[${name}]${colors.reset} ${output}`);
                }
            });

            process.stderr.on('data', (data) => {
                const error = data.toString().trim();
                if (error) {
                    console.error(`${colors.red}[${name} ERROR]${colors.reset} ${error}`);
                }
            });

            process.on('close', (code) => {
                this.log(`${name} exited with code ${code}`, colors.yellow);
                this.services[name.toLowerCase()] = null;
            });

            this.services[name.toLowerCase()] = process;
            
            // Give service time to start
            setTimeout(() => resolve(process), 2000);
        });
    }

    async startBackend() {
        const backendDir = path.join(__dirname, 'backend-express');
        
        // Check if .env exists, if not copy from .env.example
        const envPath = path.join(backendDir, '.env');
        const envExamplePath = path.join(backendDir, '.env.example');
        
        if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
            fs.copyFileSync(envExamplePath, envPath);
            this.log('📄 Created .env file from .env.example', colors.yellow);
        }

        return this.startService('Backend', 'npm run dev', backendDir, colors.blue);
    }

    async startMLService() {
        const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
        return this.startService('ML', `${pythonCommand} ml_service.py`, __dirname, colors.magenta);
    }

    async startFrontend() {
        const frontendDir = path.join(__dirname, 'frontend');
        return this.startService('Frontend', 'npm start', frontendDir, colors.green);
    }

    async showMenu() {
        this.log('\n🛡️  VNC Protection Platform Launcher', colors.bright);
        this.log('=====================================', colors.bright);
        this.log('1. Start All Services');
        this.log('2. Start Backend Only');
        this.log('3. Start ML Service Only');
        this.log('4. Start Frontend Only');
        this.log('5. Stop All Services');
        this.log('6. Show Service Status');
        this.log('7. Exit');
        this.log('=====================================');

        return new Promise((resolve) => {
            this.rl.question('Select option (1-7): ', (answer) => {
                resolve(answer.trim());
            });
        });
    }

    async handleMenuChoice(choice) {
        switch (choice) {
            case '1':
                this.log('\n🚀 Starting all services...', colors.cyan);
                await this.startMLService();
                await this.startBackend();
                await this.startFrontend();
                this.showServiceUrls();
                break;
            
            case '2':
                await this.startBackend();
                break;
            
            case '3':
                await this.startMLService();
                break;
            
            case '4':
                await this.startFrontend();
                break;
            
            case '5':
                this.stopAllServices();
                break;
            
            case '6':
                this.showServiceStatus();
                break;
            
            case '7':
                this.log('👋 Goodbye!', colors.yellow);
                this.cleanup();
                process.exit(0);
                break;
            
            default:
                this.log('❌ Invalid option', colors.red);
        }
    }

    showServiceUrls() {
        this.log('\n🌐 Service URLs:', colors.bright);
        this.log('===============', colors.bright);
        this.log('Backend API: http://localhost:3000', colors.blue);
        this.log('Frontend:    http://localhost:3000', colors.green);
        this.log('ML Service:  http://localhost:5001', colors.magenta);
        this.log('===============\n', colors.bright);
    }

    showServiceStatus() {
        this.log('\n📊 Service Status:', colors.bright);
        this.log('==================', colors.bright);
        
        Object.entries(this.services).forEach(([name, process]) => {
            const status = process ? '🟢 Running' : '🔴 Stopped';
            this.log(`${name.charAt(0).toUpperCase() + name.slice(1)}: ${status}`);
        });
        
        this.log('==================\n', colors.bright);
    }

    stopAllServices() {
        this.log('\n🛑 Stopping all services...', colors.yellow);
        
        Object.entries(this.services).forEach(([name, process]) => {
            if (process) {
                process.kill('SIGTERM');
                this.log(`Stopped ${name}`, colors.yellow);
            }
        });

        this.services = { backend: null, frontend: null, ml: null };
    }

    cleanup() {
        this.stopAllServices();
        this.rl.close();
    }

    async run() {
        // Check prerequisites
        const prereqsOk = await this.checkPrerequisites();
        if (!prereqsOk) {
            this.log('❌ Prerequisites not met. Please install required software.', colors.red);
            process.exit(1);
        }

        // Main loop
        while (true) {
            const choice = await this.showMenu();
            await this.handleMenuChoice(choice);
            
            if (choice === '7') break;
            
            // Wait before showing menu again
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down...');
    if (global.launcher) {
        global.launcher.cleanup();
    }
    process.exit(0);
});

// Start the launcher
const launcher = new PlatformLauncher();
global.launcher = launcher;
launcher.run().catch(console.error);