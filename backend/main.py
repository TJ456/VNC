"""
VNC Protection Platform - Main Backend Service
Handles API endpoints, real-time monitoring, and threat detection coordination
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import VNCSession, ThreatLog, SystemMetrics
from database.database import get_db, SessionLocal
from detection.anomaly_detector import AnomalyDetector
from detection.traffic_analyzer import TrafficAnalyzer
from prevention.firewall_manager import FirewallManager
from monitoring.vnc_monitor import VNCMonitor
from sqlalchemy.orm import Session
from sqlalchemy import desc

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="VNC Protection Platform",
    description="Advanced VNC Security Monitoring and Threat Prevention System",
    version="1.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core components
anomaly_detector = AnomalyDetector()
traffic_analyzer = TrafficAnalyzer()
firewall_manager = FirewallManager()
vnc_monitor = VNCMonitor()

# WebSocket connections for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Active connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Active connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending message to websocket: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to websocket: {e}")
                disconnected.append(connection)
        
        # Remove disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for heartbeat
            await manager.send_personal_message(f"Echo: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
async def root():
    return {"message": "VNC Protection Platform API", "status": "active"}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "anomaly_detector": "active",
            "traffic_analyzer": "active", 
            "firewall_manager": "active",
            "vnc_monitor": "active"
        }
    }

@app.get("/api/sessions")
async def get_active_sessions(db: Session = Depends(get_db)):
    """Get all active VNC sessions"""
    try:
        sessions = db.query(VNCSession).filter(
            VNCSession.status == "active"
        ).all()
        
        return {
            "sessions": [
                {
                    "id": session.id,
                    "client_ip": session.client_ip,
                    "server_ip": session.server_ip,
                    "start_time": session.start_time.isoformat(),
                    "status": session.status,
                    "data_transferred": session.data_transferred,
                    "risk_score": session.risk_score
                } for session in sessions
            ],
            "count": len(sessions)
        }
    except Exception as e:
        logger.error(f"Error fetching sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch sessions")

@app.get("/api/threats")
async def get_recent_threats(limit: int = 50, db: Session = Depends(get_db)):
    """Get recent threat detections"""
    try:
        threats = db.query(ThreatLog).order_by(
            desc(ThreatLog.timestamp)
        ).limit(limit).all()
        
        return {
            "threats": [
                {
                    "id": threat.id,
                    "timestamp": threat.timestamp.isoformat(),
                    "threat_type": threat.threat_type,
                    "severity": threat.severity,
                    "source_ip": threat.source_ip,
                    "description": threat.description,
                    "action_taken": threat.action_taken,
                    "session_id": threat.session_id
                } for threat in threats
            ],
            "count": len(threats)
        }
    except Exception as e:
        logger.error(f"Error fetching threats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch threats")

@app.get("/api/metrics")
async def get_system_metrics(db: Session = Depends(get_db)):
    """Get system performance and security metrics"""
    try:
        # Get latest metrics
        latest_metric = db.query(SystemMetrics).order_by(
            desc(SystemMetrics.timestamp)
        ).first()
        
        if not latest_metric:
            return {"error": "No metrics available"}
        
        return {
            "cpu_usage": latest_metric.cpu_usage,
            "memory_usage": latest_metric.memory_usage,
            "network_io": latest_metric.network_io,
            "active_connections": latest_metric.active_connections,
            "threats_blocked": latest_metric.threats_blocked,
            "timestamp": latest_metric.timestamp.isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch metrics")

@app.post("/api/simulate-attack")
async def simulate_attack(attack_type: str, target_ip: str = "127.0.0.1"):
    """Trigger attack simulation for testing"""
    try:
        from simulation.attack_simulator import AttackSimulator
        
        simulator = AttackSimulator()
        result = await simulator.run_attack(attack_type, target_ip)
        
        # Broadcast attack event to connected clients
        await manager.broadcast(json.dumps({
            "type": "attack_simulation",
            "attack_type": attack_type,
            "target_ip": target_ip,
            "result": result
        }))
        
        return {
            "status": "success",
            "attack_type": attack_type,
            "target_ip": target_ip,
            "result": result
        }
    except Exception as e:
        logger.error(f"Error simulating attack: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to simulate attack: {str(e)}")

@app.post("/api/block-ip")
async def block_ip_address(ip: str):
    """Manually block an IP address"""
    try:
        result = firewall_manager.block_ip(ip)
        
        # Broadcast block event
        await manager.broadcast(json.dumps({
            "type": "ip_blocked",
            "ip": ip,
            "timestamp": datetime.now().isoformat()
        }))
        
        return {
            "status": "success",
            "message": f"IP {ip} blocked successfully",
            "result": result
        }
    except Exception as e:
        logger.error(f"Error blocking IP: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to block IP: {str(e)}")

@app.post("/api/unblock-ip")
async def unblock_ip_address(ip: str):
    """Manually unblock an IP address"""
    try:
        result = firewall_manager.unblock_ip(ip)
        
        await manager.broadcast(json.dumps({
            "type": "ip_unblocked", 
            "ip": ip,
            "timestamp": datetime.now().isoformat()
        }))
        
        return {
            "status": "success",
            "message": f"IP {ip} unblocked successfully",
            "result": result
        }
    except Exception as e:
        logger.error(f"Error unblocking IP: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to unblock IP: {str(e)}")

@app.get("/api/analytics/dashboard")
async def get_dashboard_data(db: Session = Depends(get_db)):
    """Get comprehensive dashboard analytics"""
    try:
        # Calculate time ranges
        now = datetime.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        
        # Get threat statistics
        threats_24h = db.query(ThreatLog).filter(
            ThreatLog.timestamp >= last_24h
        ).count()
        
        threats_7d = db.query(ThreatLog).filter(
            ThreatLog.timestamp >= last_7d
        ).count()
        
        # Get active sessions
        active_sessions = db.query(VNCSession).filter(
            VNCSession.status == "active"
        ).count()
        
        # Get blocked IPs count (this would come from firewall manager)
        blocked_ips = len(firewall_manager.get_blocked_ips())
        
        return {
            "threats_24h": threats_24h,
            "threats_7d": threats_7d,
            "active_sessions": active_sessions,
            "blocked_ips": blocked_ips,
            "system_status": "healthy",
            "last_updated": now.isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

# Background task for continuous monitoring
async def monitoring_task():
    """Background task for continuous VNC monitoring"""
    logger.info("Starting VNC monitoring background task")
    
    while True:
        try:
            # Monitor VNC traffic
            await vnc_monitor.check_active_connections()
            
            # Run anomaly detection on recent traffic
            anomaly_results = await anomaly_detector.analyze_recent_traffic()
            
            if anomaly_results and anomaly_results.get("anomalies"):
                # Broadcast anomaly detection
                await manager.broadcast(json.dumps({
                    "type": "anomaly_detected",
                    "anomalies": anomaly_results["anomalies"],
                    "timestamp": datetime.now().isoformat()
                }))
            
            # Wait before next check
            await asyncio.sleep(10)
            
        except Exception as e:
            logger.error(f"Error in monitoring task: {e}")
            await asyncio.sleep(30)  # Wait longer on error

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting VNC Protection Platform...")
    
    try:
        # Initialize database
        from database.database import init_db
        init_db()
        
        # Start monitoring task
        asyncio.create_task(monitoring_task())
        
        logger.info("VNC Protection Platform started successfully!")
    except Exception as e:
        logger.error(f"Failed to start services: {e}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )