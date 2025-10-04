#!/bin/bash

# Express Backend Setup Script

echo "🚀 Setting up VNC Protection Platform Express Backend..."
echo "===================================================="

# Navigate to backend directory
cd backend-express

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if PostgreSQL is available
echo "🗄️  Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL detected"
    
    # Create database and user (requires PostgreSQL to be running)
    echo "📊 Setting up database..."
    
    # Create database (you may need to run this as postgres user)
    # createdb vnc_protection 2>/dev/null || echo "Database may already exist"
    
    echo "⚠️  Please ensure PostgreSQL is running and create the database:"
    echo "   sudo -u postgres createdb vnc_protection"
    echo "   sudo -u postgres psql -c \"CREATE USER vnc_user WITH PASSWORD 'vnc_password';\""
    echo "   sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE vnc_protection TO vnc_user;\""
else
    echo "⚠️  PostgreSQL not detected. Please install and configure PostgreSQL:"
    echo "   Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "   CentOS/RHEL: sudo yum install postgresql-server postgresql-contrib"
    echo "   macOS: brew install postgresql"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run prisma:generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated"

# Run database migrations
echo "📊 Running database migrations..."
npm run prisma:push

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully"
    
    # Seed database
    echo "🌱 Seeding database..."
    npm run prisma:seed
    
    if [ $? -eq 0 ]; then
        echo "✅ Database seeded successfully"
    else
        echo "⚠️  Database seeding failed, but you can continue"
    fi
else
    echo "⚠️  Database migration failed. Please check your PostgreSQL configuration."
    echo "   You can retry with: npm run prisma:push"
fi

echo ""
echo "🎉 Express Backend Setup Complete!"
echo "=================================="
echo ""
echo "To start the backend server:"
echo "  cd backend-express"
echo "  npm start"
echo ""
echo "For development with auto-reload:"
echo "  npm run dev"
echo ""
echo "Backend will be available at: http://localhost:8000"
echo "API Health Check: http://localhost:8000/api/health"
echo ""
echo "📝 Configuration file: backend-express/.env"
echo "📊 Database management: npm run prisma:studio"
echo ""