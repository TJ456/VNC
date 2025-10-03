#!/usr/bin/env python3
"""
VNC Protection Platform Startup Script
Provides easy startup options for different deployment scenarios
"""

import asyncio
import subprocess
import sys
import os
import time
import signal
import threading
from pathlib import Path

def print_banner():
    """Print startup banner"""
    print("=" * 70)
    print(" ██╗   ██╗███╗   ██╗ ██████╗    ██████╗ ██████╗  ██████╗ ████████╗███████╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗")
    print(" ██║   ██║████╗  ██║██╔════╝    ██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║")
    print(" ██║   ██║██╔██╗ ██║██║         ██████╔╝██████╔╝██║   ██║   ██║   █████╗  ██║        ██║   ██║██║   ██║██╔██╗ ██║")
    print(" ╚██╗ ██╔╝██║╚██╗██║██║         ██╔═══╝ ██╔══██╗██║   ██║   ██║   ██╔══╝  ██║        ██║   ██║██║   ██║██║╚██╗██║")
    print("  ╚████╔╝ ██║ ╚████║╚██████╗    ██║     ██║  ██║╚██████╔╝   ██║   ███████╗╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║")
    print("   ╚═══╝  ╚═╝  ╚═══╝ ╚═════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚══════╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝")
    print()
    print("                    Advanced VNC Security Monitoring and Threat Prevention")
    print("=" * 70)
    print()

def check_dependencies():
    """Check if all dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    # Check Python packages
    required_packages = [
        'fastapi', 'uvicorn', 'sqlalchemy', 'scikit-learn', 
        'psutil', 'numpy', 'pandas'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
            print(f"   ✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"   ❌ {package} (missing)")
    
    if missing_packages:
        print(f"\n❌ Missing Python packages: {', '.join(missing_packages)}")
        print("   Please run: pip install -r requirements.txt")
        return False
    
    # Check Node.js for frontend
    try:
        subprocess.run(['node', '--version'], 
                      capture_output=True, check=True)
        print("   ✅ Node.js (for frontend)")
        frontend_available = True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("   ⚠️  Node.js (not available - frontend disabled)")
        frontend_available = False
    
    print("✅ Dependency check completed\n")
    return True, frontend_available

def setup_environment():
    """Setup environment and configuration"""
    print("⚙️  Setting up environment...")
    
    # Create necessary directories
    directories = ['logs', 'detection/models', 'configs']
    for dir_path in directories:
        os.makedirs(dir_path, exist_ok=True)
        print(f"   📁 Created: {dir_path}")
    
    # Check configuration file
    env_path = Path('configs/.env')
    if not env_path.exists():
        print("   📝 Creating configuration file from template...")
        template_path = Path('configs/.env.example')
        if template_path.exists():
            import shutil
            shutil.copy(template_path, env_path)
            print("   ✅ Configuration file created")
            print("   ⚠️  Please review and customize configs/.env")
        else:
            print("   ❌ Template configuration file not found")
            return False
    else:
        print("   ✅ Configuration file exists")
    
    print("✅ Environment setup completed\n")
    return True

def initialize_database():
    """Initialize the database"""
    print("🗄️  Initializing database...")
    
    try:
        # Import and run database setup
        from database.setup import main as setup_db
        setup_db()
        print("✅ Database initialized successfully\n")
        return True
    except Exception as e:
        print(f"❌ Database initialization failed: {e}\n")
        return False

def start_backend(port=8000):
    """Start the backend API server"""
    print(f"🚀 Starting backend server on port {port}...")
    
    try:
        import uvicorn
        from backend.main import app
        
        # Run server
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=port,
            log_level="info",
            reload=False
        )
    except Exception as e:
        print(f"❌ Backend startup failed: {e}")
        return False

def start_frontend():
    """Start the React frontend"""
    print("🌐 Starting frontend dashboard...")
    
    try:
        # Change to frontend directory and start
        os.chdir('frontend')
        process = subprocess.Popen(
            ['npm', 'start'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a bit and check if it started successfully
        time.sleep(3)
        if process.poll() is None:
            print("✅ Frontend started successfully")
            return process
        else:
            print("❌ Frontend failed to start")
            return None
            
    except Exception as e:
        print(f"❌ Frontend startup failed: {e}")
        return None
    finally:
        os.chdir('..')

def run_quick_demo():
    """Run the quick demonstration"""
    print("🎯 Starting VNC Protection Platform Demo...\n")
    
    try:
        from quick_demo import QuickDemo
        
        async def demo_runner():
            demo = QuickDemo()
            return await demo.run_complete_demo()
        
        result = asyncio.run(demo_runner())
        
        if result.get('demo_completed'):
            print("🎉 Demo completed successfully!")
            return True
        else:
            print("❌ Demo failed")
            return False
            
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        return False

def show_menu():
    """Show startup menu options"""
    print("🚀 VNC Protection Platform Startup Options:")
    print()
    print("1. 📊 Full Platform (Backend + Frontend)")
    print("2. 🔌 Backend Only (API Server)")
    print("3. 🎯 Run Demo (Attack Simulation)")
    print("4. ⚙️  Setup & Configuration Check")
    print("5. 📚 View Documentation")
    print("6. 🛠️  Troubleshooting Mode")
    print("7. ❌ Exit")
    print()

def view_documentation():
    """Show documentation options"""
    print("📚 Documentation Options:")
    print()
    print("1. 📖 README.md - General overview")
    print("2. 🔧 Technical Documentation")
    print("3. 🌐 API Documentation")
    print("4. 💡 Quick Start Guide")
    print()
    
    docs = {
        '1': 'README.md',
        '2': 'docs/TECHNICAL_DOCUMENTATION.md',
        '3': 'View at: http://localhost:8000/docs (when backend is running)',
        '4': 'Run installation script or see README.md'
    }
    
    choice = input("Select documentation (1-4): ").strip()
    
    if choice in docs:
        if choice == '3':
            print(f"\n📖 {docs[choice]}")
        else:
            doc_path = Path(docs[choice])
            if doc_path.exists():
                print(f"\n📖 Opening {docs[choice]}...")
                try:
                    # Try to open with default system viewer
                    if sys.platform.startswith('win'):
                        os.startfile(doc_path)
                    elif sys.platform.startswith('darwin'):
                        subprocess.run(['open', doc_path])
                    else:
                        subprocess.run(['xdg-open', doc_path])
                except Exception:
                    print(f"Please manually open: {doc_path}")
            else:
                print(f"❌ Documentation file not found: {docs[choice]}")

def troubleshooting_mode():
    """Run troubleshooting diagnostics"""
    print("🛠️  VNC Protection Platform Troubleshooting")
    print("=" * 50)
    
    # System information
    print("📋 System Information:")
    print(f"   Platform: {sys.platform}")
    print(f"   Python Version: {sys.version}")
    print(f"   Working Directory: {os.getcwd()}")
    print()
    
    # Check dependencies
    deps_ok, frontend_ok = check_dependencies()
    
    # Check configuration
    config_path = Path('configs/.env')
    print(f"📝 Configuration:")
    print(f"   Config file exists: {'✅' if config_path.exists() else '❌'}")
    
    if config_path.exists():
        print(f"   Config file size: {config_path.stat().st_size} bytes")
    print()
    
    # Check database
    print("🗄️  Database Check:")
    db_path = Path('vnc_protection.db')
    print(f"   Database file exists: {'✅' if db_path.exists() else '❌'}")
    
    if db_path.exists():
        print(f"   Database size: {db_path.stat().st_size} bytes")
    
    # Test database connection
    try:
        from database.database import SessionLocal
        db = SessionLocal()
        db.close()
        print("   Database connection: ✅")
    except Exception as e:
        print(f"   Database connection: ❌ ({e})")
    print()
    
    # Check ports
    print("🔌 Port Availability:")
    import socket
    
    ports_to_check = [8000, 3000, 5900]
    for port in ports_to_check:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', port))
        status = "❌ In use" if result == 0 else "✅ Available"
        print(f"   Port {port}: {status}")
        sock.close()
    
    print()
    print("🔧 If you're experiencing issues:")
    print("   1. Ensure all dependencies are installed: pip install -r requirements.txt")
    print("   2. Check configuration file: configs/.env")
    print("   3. Initialize database: python database/setup.py")
    print("   4. Check firewall/antivirus settings")
    print("   5. Verify Python and Node.js versions")

def main():
    """Main application entry point"""
    try:
        print_banner()
        
        while True:
            show_menu()
            choice = input("Select option (1-7): ").strip()
            
            if choice == '1':
                # Full platform
                print("\n🚀 Starting Full VNC Protection Platform...\n")
                
                # Check dependencies and setup
                deps_ok, frontend_ok = check_dependencies()
                if not deps_ok:
                    continue
                
                if not setup_environment():
                    continue
                
                if not initialize_database():
                    continue
                
                if frontend_ok:
                    # Start frontend in separate thread
                    frontend_process = start_frontend()
                    
                    if frontend_process:
                        print("🌐 Frontend available at: http://localhost:3000")
                    
                    # Give frontend time to start
                    time.sleep(2)
                
                print("🔌 Backend starting at: http://localhost:8000")
                print("📊 API Documentation: http://localhost:8000/docs")
                print("\nPress Ctrl+C to stop all services\n")
                
                try:
                    # Start backend (this blocks)
                    start_backend()
                except KeyboardInterrupt:
                    print("\n⏹️  Shutting down VNC Protection Platform...")
                    if 'frontend_process' in locals() and frontend_process:
                        frontend_process.terminate()
                    break
            
            elif choice == '2':
                # Backend only
                print("\n🔌 Starting Backend Only...\n")
                
                deps_ok, _ = check_dependencies()
                if not deps_ok:
                    continue
                
                if not setup_environment():
                    continue
                
                if not initialize_database():
                    continue
                
                print("🔌 Backend starting at: http://localhost:8000")
                print("📊 API Documentation: http://localhost:8000/docs")
                print("\nPress Ctrl+C to stop\n")
                
                try:
                    start_backend()
                except KeyboardInterrupt:
                    print("\n⏹️  Backend stopped")
                    break
            
            elif choice == '3':
                # Run demo
                print()
                if not initialize_database():
                    continue
                
                run_quick_demo()
                input("\nPress Enter to return to menu...")
            
            elif choice == '4':
                # Setup check
                print()
                check_dependencies()
                setup_environment()
                initialize_database()
                input("Press Enter to return to menu...")
            
            elif choice == '5':
                # Documentation
                print()
                view_documentation()
                input("\nPress Enter to return to menu...")
            
            elif choice == '6':
                # Troubleshooting
                print()
                troubleshooting_mode()
                input("\nPress Enter to return to menu...")
            
            elif choice == '7':
                # Exit
                print("👋 Goodbye!")
                break
            
            else:
                print("❌ Invalid option. Please select 1-7.")
                time.sleep(1)
            
            print()  # Add spacing between menu iterations
    
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print("🛠️  Try running troubleshooting mode (option 6)")

if __name__ == "__main__":
    main()