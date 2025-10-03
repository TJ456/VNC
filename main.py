"""
Main runner script for VNC Protection Platform
Integrates all components and provides unified startup
"""

import asyncio
import logging
import signal
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('configs/.env')

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import all components
from database.setup import main as setup_database
from backend.main import app as backend_app
from monitoring.vnc_monitor import VNCMonitor
from detection.anomaly_detector import AnomalyDetector
from detection.traffic_analyzer import TrafficAnalyzer
from prevention.firewall_manager import FirewallManager
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/vnc_protection.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class VNCProtectionPlatform:
    """Main application class that coordinates all components"""
    
    def __init__(self):
        self.vnc_monitor = VNCMonitor()
        self.anomaly_detector = AnomalyDetector()
        self.traffic_analyzer = TrafficAnalyzer()
        self.firewall_manager = FirewallManager()
        self.running = False
        
        # Create logs directory
        os.makedirs('logs', exist_ok=True)
        
    async def initialize(self):
        """Initialize all components"""
        logger.info("Initializing VNC Protection Platform...")
        
        try:
            # Setup database
            logger.info("Setting up database...")
            setup_database()
            
            # Initialize ML models
            logger.info("Initializing ML models...")
            await self.anomaly_detector.initialize()
            
            # Initialize traffic analyzer
            logger.info("Initializing traffic analyzer...")
            await self.traffic_analyzer.initialize()
            
            # Clean up expired firewall blocks
            logger.info("Cleaning up expired firewall blocks...")
            self.firewall_manager.cleanup_expired_blocks()
            
            logger.info("VNC Protection Platform initialized successfully!")
            
        except Exception as e:
            logger.error(f"Failed to initialize platform: {e}")
            raise
    
    async def start_monitoring(self):
        """Start all monitoring services"""
        logger.info("Starting monitoring services...")
        
        try:
            # Start VNC monitoring
            asyncio.create_task(self.vnc_monitor.start_monitoring())
            
            # Start periodic tasks
            asyncio.create_task(self._periodic_analysis())
            asyncio.create_task(self._periodic_cleanup())
            
            self.running = True
            logger.info("All monitoring services started!")
            
        except Exception as e:
            logger.error(f"Failed to start monitoring: {e}")
            raise
    
    async def _periodic_analysis(self):
        """Run periodic traffic analysis"""
        while self.running:
            try:
                logger.debug("Running periodic traffic analysis...")
                
                # Analyze recent traffic with ML
                ml_results = await self.anomaly_detector.analyze_recent_traffic()
                if ml_results.get("anomalies_detected", 0) > 0:
                    logger.warning(f"ML detected {ml_results['anomalies_detected']} anomalies")
                
                # Analyze with rule-based system
                rule_results = await self.traffic_analyzer.analyze_recent_traffic()
                if rule_results.get("anomalies_found", 0) > 0:
                    logger.warning(f"Rules detected {rule_results['anomalies_found']} anomalies")
                
                # Wait 5 minutes before next analysis
                await asyncio.sleep(300)
                
            except Exception as e:
                logger.error(f"Error in periodic analysis: {e}")
                await asyncio.sleep(60)  # Wait 1 minute on error
    
    async def _periodic_cleanup(self):
        """Run periodic cleanup tasks"""
        while self.running:
            try:
                logger.debug("Running periodic cleanup...")
                
                # Clean up expired firewall blocks
                removed = self.firewall_manager.cleanup_expired_blocks()
                if removed > 0:
                    logger.info(f"Cleaned up {removed} expired IP blocks")
                
                # Wait 1 hour before next cleanup
                await asyncio.sleep(3600)
                
            except Exception as e:
                logger.error(f"Error in periodic cleanup: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error
    
    def stop(self):
        """Stop all services"""
        logger.info("Stopping VNC Protection Platform...")
        self.running = False
        self.vnc_monitor.stop_monitoring()
        logger.info("VNC Protection Platform stopped")

# Global platform instance
platform = VNCProtectionPlatform()

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info(f"Received signal {signum}, shutting down...")
    platform.stop()
    sys.exit(0)

async def main():
    """Main application entry point"""
    print("=" * 60)
    print("VNC Protection Platform")
    print("Advanced VNC Security Monitoring and Threat Prevention")
    print("=" * 60)
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Initialize platform
        await platform.initialize()
        
        # Start monitoring
        await platform.start_monitoring()
        
        print("\n🛡️  VNC Protection Platform is now running!")
        print(f"📊 Dashboard: http://localhost:3000")
        print(f"🔌 API: http://localhost:{os.getenv('API_PORT', 8000)}")
        print("📝 Check logs/vnc_protection.log for detailed logs")
        print("\nPress Ctrl+C to stop...")
        
        # Keep the main thread alive
        while platform.running:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    except Exception as e:
        logger.error(f"Application error: {e}")
        raise
    finally:
        platform.stop()

def run_backend_only():
    """Run only the backend API server"""
    print("Starting VNC Protection Platform Backend...")
    
    # Initialize database
    setup_database()
    
    # Start FastAPI server
    uvicorn.run(
        "backend.main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=os.getenv("DEBUG", "False").lower() == "true",
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    )

def run_demo():
    """Run demonstration scenarios"""
    print("Running VNC Protection Platform Demo...")
    
    async def demo_main():
        await platform.initialize()
        
        # Import and run demo
        from simulation.demo import DemoRunner
        demo_runner = DemoRunner()
        
        print("\n🎯 Running comprehensive attack simulation demo...")
        result = await demo_runner.run_comprehensive_demo()
        
        print(f"\n✅ Demo completed successfully!")
        print(f"📊 {result['scenarios_completed']} scenarios executed")
        print("🔍 Check the dashboard for detection results")
    
    asyncio.run(demo_main())

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="VNC Protection Platform")
    parser.add_argument("--mode", choices=["full", "backend", "demo"], default="full",
                       help="Run mode: full platform, backend only, or demo")
    
    args = parser.parse_args()
    
    if args.mode == "full":
        asyncio.run(main())
    elif args.mode == "backend":
        run_backend_only()
    elif args.mode == "demo":
        run_demo()