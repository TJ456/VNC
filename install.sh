#!/bin/bash

# VNC Protection Platform Installation Script

echo "======================================"
echo "VNC Protection Platform Setup"
echo "======================================"

# Check if Python 3.8+ is installed
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))' 2>/dev/null)
if [[ -z "$python_version" ]] || [[ $(echo "$python_version 3.8" | awk '{print ($1 >= $2)}') -eq 0 ]]; then
    echo "❌ Python 3.8+ is required but not found. Please install Python 3.8 or later."
    exit 1
fi

echo "✅ Python $python_version detected"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ to run the dashboard."
    echo "   The backend will work without Node.js, but you won't have the web interface."
    read -p "Continue without dashboard? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    SKIP_FRONTEND=true
else
    node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $node_version -lt 16 ]]; then
        echo "⚠️  Node.js version is $node_version, but 16+ is recommended"
    else
        echo "✅ Node.js $(node -v) detected"
    fi
fi

# Create virtual environment
echo "📦 Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p detection/models
mkdir -p configs

# Copy example configuration
if [ ! -f "configs/.env" ]; then
    echo "⚙️  Creating configuration file..."
    cp configs/.env.example configs/.env
    echo "📝 Please edit configs/.env to customize your settings"
fi

# Initialize database
echo "🗄️  Initializing database..."
python database/setup.py

# Install frontend dependencies (if Node.js is available)
if [[ "$SKIP_FRONTEND" != true ]]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo "======================================"
echo "🎉 Installation Complete!"
echo "======================================"
echo ""
echo "To start the VNC Protection Platform:"
echo ""
echo "1. Backend only:"
echo "   python main.py --mode backend"
echo ""
if [[ "$SKIP_FRONTEND" != true ]]; then
    echo "2. Full platform (backend + frontend):"
    echo "   # Terminal 1:"
    echo "   python main.py --mode backend"
    echo "   # Terminal 2:"
    echo "   cd frontend && npm start"
    echo ""
fi
echo "3. Run demo:"
echo "   python main.py --mode demo"
echo ""
echo "📊 Dashboard will be available at: http://localhost:3000"
echo "🔌 API will be available at: http://localhost:8000"
echo ""
echo "📝 Configuration file: configs/.env"
echo "📋 Logs directory: logs/"
echo ""
echo "⚠️  Important Security Notes:"
echo "- Change default passwords and keys in configs/.env"
echo "- Ensure proper firewall configuration"
echo "- Review VNC server settings for security"
echo ""