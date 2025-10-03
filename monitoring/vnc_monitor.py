"""
VNC Traffic Monitor - Monitors VNC connections and traffic patterns
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import threading
import psutil
import socket
import sys
import os

# Add parent directory for imports  
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import SessionLocal
from database.models import VNCSession, SystemMetrics

logger = logging.getLogger(__name__)

class VNCMonitor:
    """Monitor VNC connections and detect suspicious activities"""
    
    def __init__(self):
        self.active_sessions = {}
        self.monitoring_active = False
        self.vnc_ports = [5900, 5901, 5902, 5903, 5904, 5905]  # Standard VNC ports
        self.session_data = {}
        
    async def start_monitoring(self):
        """Start continuous VNC monitoring"""
        self.monitoring_active = True
        logger.info("VNC monitoring started")
        
        while self.monitoring_active:
            try:
                await self.check_active_connections()
                await self.update_system_metrics()
                await asyncio.sleep(5)  # Check every 5 seconds
            except Exception as e:
                logger.error(f"Error in VNC monitoring: {e}")
                await asyncio.sleep(10)
    
    def stop_monitoring(self):
        """Stop VNC monitoring"""
        self.monitoring_active = False
        logger.info("VNC monitoring stopped")
    
    async def check_active_connections(self):
        """Check for active VNC connections"""
        try:
            current_connections = self._get_vnc_connections()
            
            # Update existing sessions and detect new ones
            for conn in current_connections:
                conn_key = f"{conn['local_ip']}:{conn['local_port']}-{conn['remote_ip']}:{conn['remote_port']}"
                
                if conn_key not in self.active_sessions:
                    # New VNC session detected
                    session_id = await self._create_session(conn)
                    if session_id:
                        self.active_sessions[conn_key] = {
                            'session_id': session_id,
                            'start_time': datetime.now(),
                            'last_seen': datetime.now(),
                            'data_transferred': 0,
                            'packet_count': 0
                        }
                        logger.info(f"New VNC session detected: {conn_key}")
                else:
                    # Update existing session
                    self.active_sessions[conn_key]['last_seen'] = datetime.now()
            
            # Remove sessions that are no longer active
            active_keys = set(f"{conn['local_ip']}:{conn['local_port']}-{conn['remote_ip']}:{conn['remote_port']}" 
                            for conn in current_connections)
            
            for conn_key in list(self.active_sessions.keys()):
                if conn_key not in active_keys:
                    await self._close_session(conn_key)
                    
        except Exception as e:
            logger.error(f"Error checking VNC connections: {e}")
    
    def _get_vnc_connections(self) -> List[Dict]:
        """Get current VNC network connections"""
        connections = []
        
        try:
            # Get network connections
            for conn in psutil.net_connections(kind='inet'):
                # Check if it's a VNC port
                if (conn.laddr and conn.raddr and 
                    (conn.laddr.port in self.vnc_ports or 
                     conn.raddr.port in self.vnc_ports)):
                    
                    connections.append({
                        'local_ip': conn.laddr.ip,
                        'local_port': conn.laddr.port,
                        'remote_ip': conn.raddr.ip,
                        'remote_port': conn.raddr.port,
                        'status': conn.status,
                        'pid': conn.pid
                    })
                    
        except Exception as e:
            logger.error(f"Error getting network connections: {e}")
            
        return connections
    
    async def _create_session(self, conn_info: Dict) -> Optional[int]:
        """Create new VNC session in database"""
        db = SessionLocal()
        try:
            # Determine client and server based on port
            if conn_info['local_port'] in self.vnc_ports:
                # Server is local
                server_ip = conn_info['local_ip']
                server_port = conn_info['local_port']
                client_ip = conn_info['remote_ip']
                client_port = conn_info['remote_port']
            else:
                # Client is local  
                client_ip = conn_info['local_ip']
                client_port = conn_info['local_port']
                server_ip = conn_info['remote_ip']
                server_port = conn_info['remote_port']
            
            session = VNCSession(
                client_ip=client_ip,
                server_ip=server_ip,
                client_port=client_port,
                server_port=server_port,
                start_time=datetime.utcnow(),
                status="active",
                data_transferred=0.0,
                risk_score=self._calculate_initial_risk_score(client_ip)
            )
            
            db.add(session)
            db.commit()
            db.refresh(session)
            
            return session.id
            
        except Exception as e:
            logger.error(f"Error creating VNC session: {e}")
            db.rollback()
            return None
        finally:
            db.close()
    
    async def _close_session(self, conn_key: str):
        """Close VNC session"""
        if conn_key in self.active_sessions:
            session_info = self.active_sessions[conn_key]
            session_id = session_info['session_id']
            
            db = SessionLocal()
            try:
                session = db.query(VNCSession).filter_by(id=session_id).first()
                if session:
                    session.end_time = datetime.utcnow()
                    session.status = "terminated"
                    db.commit()
                    
                logger.info(f"VNC session {conn_key} terminated")
                
            except Exception as e:
                logger.error(f"Error closing session: {e}")
                db.rollback()
            finally:
                db.close()
                
            del self.active_sessions[conn_key]
    
    def _calculate_initial_risk_score(self, client_ip: str) -> float:
        """Calculate initial risk score based on IP and other factors"""
        risk_score = 0.0
        
        # Check if IP is from internal network
        if self._is_internal_ip(client_ip):
            risk_score += 10  # Lower risk for internal IPs
        else:
            risk_score += 40  # Higher risk for external IPs
        
        # Check for known suspicious IPs (would be loaded from threat intelligence)
        if self._is_suspicious_ip(client_ip):
            risk_score += 50
        
        # Add randomness for demo purposes
        import random
        risk_score += random.uniform(0, 20)
        
        return min(risk_score, 100.0)
    
    def _is_internal_ip(self, ip: str) -> bool:
        """Check if IP is in internal network ranges"""
        internal_ranges = [
            '192.168.', '10.', '172.16.', '172.17.', '172.18.', 
            '172.19.', '172.20.', '172.21.', '172.22.', '172.23.',
            '172.24.', '172.25.', '172.26.', '172.27.', '172.28.',
            '172.29.', '172.30.', '172.31.', '127.'
        ]
        
        return any(ip.startswith(range_prefix) for range_prefix in internal_ranges)
    
    def _is_suspicious_ip(self, ip: str) -> bool:
        """Check if IP is known to be suspicious"""
        # In a real implementation, this would check against threat intelligence feeds
        suspicious_ips = [
            '203.0.113.5', '198.51.100.10', '192.0.2.50',
            '185.220.101.5', '185.220.102.8'  # Example Tor exit nodes
        ]
        
        return ip in suspicious_ips
    
    async def update_system_metrics(self):
        """Update system performance metrics"""
        try:
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            network_io = psutil.net_io_counters()
            
            # Calculate network I/O rate (simplified)
            network_rate = (network_io.bytes_sent + network_io.bytes_recv) / (1024 * 1024)  # MB
            
            # Get active connections count
            active_connections = len(self.active_sessions)
            
            # Store in database
            db = SessionLocal()
            try:
                metrics = SystemMetrics(
                    cpu_usage=cpu_percent,
                    memory_usage=memory.percent,
                    network_io=network_rate,
                    active_connections=active_connections,
                    vnc_sessions_active=active_connections,
                    threats_detected=0,  # Would be updated by threat detection system
                    threats_blocked=0    # Would be updated by prevention system
                )
                
                db.add(metrics)
                db.commit()
                
            except Exception as e:
                logger.error(f"Error storing system metrics: {e}")
                db.rollback()
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error updating system metrics: {e}")
    
    def get_session_statistics(self) -> Dict[str, Any]:
        """Get current session statistics"""
        return {
            'active_sessions': len(self.active_sessions),
            'sessions': [
                {
                    'connection': key,
                    'start_time': info['start_time'].isoformat(),
                    'duration_seconds': (datetime.now() - info['start_time']).total_seconds(),
                    'data_transferred': info['data_transferred']
                }
                for key, info in self.active_sessions.items()
            ]
        }