"""
VNC Attack Simulator - Simulates various VNC-based attacks for testing
This module creates realistic attack scenarios to test the detection system
"""

import asyncio
import random
import time
import os
import sys
import logging
from datetime import datetime
from typing import Dict, Any, List
import socket
import threading
from pathlib import Path

# Add parent directory for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import SessionLocal
from database.models import VNCSession, ThreatLog

logger = logging.getLogger(__name__)

class AttackSimulator:
    """Simulates various VNC-based attack scenarios"""
    
    def __init__(self):
        self.active_simulations = {}
        self.simulation_data = {}
        
    async def run_attack(self, attack_type: str, target_ip: str = "127.0.0.1") -> Dict[str, Any]:
        """Run a specific attack simulation"""
        
        attack_methods = {
            "file_exfiltration": self.simulate_file_exfiltration,
            "screenshot_spam": self.simulate_screenshot_spam,
            "clipboard_stealing": self.simulate_clipboard_stealing,
            "keystroke_logging": self.simulate_keystroke_logging,
            "large_data_transfer": self.simulate_large_data_transfer,
            "credential_harvesting": self.simulate_credential_harvesting,
            "lateral_movement": self.simulate_lateral_movement
        }
        
        if attack_type not in attack_methods:
            return {
                "success": False,
                "error": f"Unknown attack type: {attack_type}",
                "available_attacks": list(attack_methods.keys())
            }
        
        try:
            result = await attack_methods[attack_type](target_ip)
            return {
                "success": True,
                "attack_type": attack_type,
                "target_ip": target_ip,
                "result": result,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Attack simulation failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "attack_type": attack_type
            }
    
    async def simulate_file_exfiltration(self, target_ip: str) -> Dict[str, Any]:
        """Simulate large file exfiltration attack"""
        logger.info("Starting file exfiltration simulation...")
        
        # Create fake VNC session
        session_id = await self._create_fake_session(target_ip, "file_exfiltration")
        
        # Simulate file transfer patterns
        files_transferred = []
        total_data_mb = 0
        
        # Simulate multiple file transfers
        for i in range(random.randint(3, 8)):
            file_size_mb = random.uniform(50, 200)  # Large files
            file_name = f"confidential_doc_{i+1}.pdf"
            
            # Simulate transfer time (faster than normal for suspicion)
            transfer_time = file_size_mb / random.uniform(20, 40)  # Fast transfer
            
            files_transferred.append({
                "filename": file_name,
                "size_mb": round(file_size_mb, 2),
                "transfer_time_seconds": round(transfer_time, 2)
            })
            
            total_data_mb += file_size_mb
            
            # Simulate transfer delay
            await asyncio.sleep(random.uniform(0.5, 2.0))
        
        # Log the threat
        await self._log_threat(
            session_id=session_id,
            threat_type="file_exfiltration",
            severity="high",
            source_ip=target_ip,
            description=f"Detected large file exfiltration: {len(files_transferred)} files, {total_data_mb:.1f}MB total",
            metadata={
                "files_transferred": files_transferred,
                "total_size_mb": total_data_mb,
                "transfer_rate_mbps": total_data_mb / sum(f["transfer_time_seconds"] for f in files_transferred) * 8
            }
        )
        
        return {
            "files_count": len(files_transferred),
            "total_size_mb": round(total_data_mb, 2),
            "files": files_transferred,
            "detection_likelihood": "high"
        }
    
    async def simulate_screenshot_spam(self, target_ip: str) -> Dict[str, Any]:
        """Simulate excessive screenshot capturing"""
        logger.info("Starting screenshot spam simulation...")
        
        session_id = await self._create_fake_session(target_ip, "screenshot_spam")
        
        # Simulate rapid screenshot capturing
        screenshot_count = random.randint(50, 150)
        time_window_seconds = random.randint(30, 120)
        
        screenshots = []
        start_time = time.time()
        
        for i in range(screenshot_count):
            screenshot_size_kb = random.randint(150, 800)  # Typical screenshot size
            timestamp = start_time + (i * time_window_seconds / screenshot_count)
            
            screenshots.append({
                "screenshot_id": i + 1,
                "timestamp": timestamp,
                "size_kb": screenshot_size_kb
            })
            
            # Short delay to simulate rapid capturing
            await asyncio.sleep(time_window_seconds / screenshot_count / 10)
        
        total_size_mb = sum(s["size_kb"] for s in screenshots) / 1024
        
        await self._log_threat(
            session_id=session_id,
            threat_type="screenshot_spam",
            severity="medium",
            source_ip=target_ip,
            description=f"Excessive screenshot activity: {screenshot_count} screenshots in {time_window_seconds}s",
            metadata={
                "screenshot_count": screenshot_count,
                "time_window_seconds": time_window_seconds,
                "total_size_mb": total_size_mb,
                "rate_per_minute": (screenshot_count / time_window_seconds) * 60
            }
        )
        
        return {
            "screenshot_count": screenshot_count,
            "time_window_seconds": time_window_seconds,
            "total_size_mb": round(total_size_mb, 2),
            "rate_per_minute": round((screenshot_count / time_window_seconds) * 60, 1),
            "detection_likelihood": "medium"
        }
    
    async def simulate_clipboard_stealing(self, target_ip: str) -> Dict[str, Any]:
        """Simulate clipboard data stealing"""
        logger.info("Starting clipboard stealing simulation...")
        
        session_id = await self._create_fake_session(target_ip, "clipboard_stealing")
        
        # Simulate clipboard operations
        clipboard_ops = random.randint(80, 200)
        sensitive_data_types = ["passwords", "credit_cards", "ssn", "emails", "api_keys"]
        
        clipboard_data = []
        for i in range(clipboard_ops):
            data_type = random.choice(sensitive_data_types)
            data_size = random.randint(20, 500)  # bytes
            
            clipboard_data.append({
                "operation_id": i + 1,
                "data_type": data_type,
                "size_bytes": data_size,
                "timestamp": time.time() + i * 0.5
            })
            
            await asyncio.sleep(0.01)  # Very fast clipboard access
        
        total_sensitive_items = len([d for d in clipboard_data if d["data_type"] in ["passwords", "credit_cards", "api_keys"]])
        
        await self._log_threat(
            session_id=session_id,
            threat_type="clipboard_stealing",
            severity="high" if total_sensitive_items > 10 else "medium",
            source_ip=target_ip,
            description=f"Suspicious clipboard activity: {clipboard_ops} operations, {total_sensitive_items} sensitive items",
            metadata={
                "total_operations": clipboard_ops,
                "sensitive_items": total_sensitive_items,
                "data_types": list(set(d["data_type"] for d in clipboard_data)),
                "total_size_bytes": sum(d["size_bytes"] for d in clipboard_data)
            }
        )
        
        return {
            "total_operations": clipboard_ops,
            "sensitive_items": total_sensitive_items,
            "data_types_accessed": list(set(d["data_type"] for d in clipboard_data)),
            "detection_likelihood": "high" if total_sensitive_items > 10 else "medium"
        }
    
    async def simulate_keystroke_logging(self, target_ip: str) -> Dict[str, Any]:
        """Simulate keystroke logging attack"""
        logger.info("Starting keystroke logging simulation...")
        
        session_id = await self._create_fake_session(target_ip, "keystroke_logging")
        
        # Simulate keystroke patterns
        keystrokes = random.randint(2000, 5000)
        session_duration = random.randint(300, 1800)  # 5-30 minutes
        
        # Simulate different typing patterns
        patterns = {
            "password_entry": random.randint(5, 15),
            "credit_card_entry": random.randint(1, 5),
            "email_typing": random.randint(10, 30),
            "document_editing": random.randint(200, 800)
        }
        
        sensitive_sequences = patterns["password_entry"] + patterns["credit_card_entry"]
        
        await self._log_threat(
            session_id=session_id,
            threat_type="keystroke_logging",
            severity="critical",
            source_ip=target_ip,
            description=f"Keystroke logging detected: {keystrokes} keystrokes over {session_duration}s",
            metadata={
                "total_keystrokes": keystrokes,
                "session_duration_seconds": session_duration,
                "typing_patterns": patterns,
                "sensitive_sequences": sensitive_sequences,
                "keystrokes_per_minute": (keystrokes / session_duration) * 60
            }
        )
        
        return {
            "total_keystrokes": keystrokes,
            "session_duration_seconds": session_duration,
            "sensitive_sequences": sensitive_sequences,
            "typing_patterns": patterns,
            "detection_likelihood": "critical"
        }
    
    async def simulate_large_data_transfer(self, target_ip: str) -> Dict[str, Any]:
        """Simulate large data transfer to external server"""
        logger.info("Starting large data transfer simulation...")
        
        session_id = await self._create_fake_session(target_ip, "large_data_transfer")
        
        # Simulate massive data transfer
        total_data_gb = random.uniform(1.0, 5.0)
        transfer_rate_mbps = random.uniform(50, 100)  # Unusually fast
        transfer_time = (total_data_gb * 1024) / transfer_rate_mbps
        
        # Simulate external destination
        external_ips = ["203.0.113.5", "198.51.100.10", "192.0.2.50"]
        destination_ip = random.choice(external_ips)
        
        await self._log_threat(
            session_id=session_id,
            threat_type="large_data_transfer",
            severity="critical",
            source_ip=target_ip,
            description=f"Large data exfiltration: {total_data_gb:.2f}GB to {destination_ip}",
            metadata={
                "total_data_gb": total_data_gb,
                "destination_ip": destination_ip,
                "transfer_rate_mbps": transfer_rate_mbps,
                "transfer_time_seconds": transfer_time,
                "external_transfer": True
            }
        )
        
        return {
            "total_data_gb": round(total_data_gb, 2),
            "destination_ip": destination_ip,
            "transfer_rate_mbps": round(transfer_rate_mbps, 1),
            "transfer_time_seconds": round(transfer_time, 1),
            "detection_likelihood": "critical"
        }
    
    async def simulate_credential_harvesting(self, target_ip: str) -> Dict[str, Any]:
        """Simulate credential harvesting attack"""
        logger.info("Starting credential harvesting simulation...")
        
        session_id = await self._create_fake_session(target_ip, "credential_harvesting")
        
        # Simulate credential access patterns
        applications_accessed = [
            "browser_passwords", "email_client", "ftp_client", 
            "ssh_keys", "vpn_profiles", "database_connections"
        ]
        
        credentials_found = {}
        for app in applications_accessed:
            count = random.randint(1, 20)
            credentials_found[app] = count
        
        total_credentials = sum(credentials_found.values())
        
        await self._log_threat(
            session_id=session_id,
            threat_type="credential_harvesting",
            severity="critical",
            source_ip=target_ip,
            description=f"Credential harvesting detected: {total_credentials} credentials from {len(applications_accessed)} sources",
            metadata={
                "total_credentials": total_credentials,
                "applications_accessed": applications_accessed,
                "credentials_by_source": credentials_found
            }
        )
        
        return {
            "total_credentials": total_credentials,
            "applications_accessed": applications_accessed,
            "credentials_by_source": credentials_found,
            "detection_likelihood": "critical"
        }
    
    async def simulate_lateral_movement(self, target_ip: str) -> Dict[str, Any]:
        """Simulate lateral movement through network"""
        logger.info("Starting lateral movement simulation...")
        
        session_id = await self._create_fake_session(target_ip, "lateral_movement")
        
        # Simulate network scanning and connections
        internal_ips = [
            f"192.168.1.{i}" for i in random.sample(range(2, 255), 10)
        ]
        
        connections_attempted = []
        for ip in internal_ips:
            ports = random.sample([22, 23, 135, 139, 445, 3389, 5900], 3)
            for port in ports:
                success = random.random() > 0.7  # 30% success rate
                connections_attempted.append({
                    "target_ip": ip,
                    "port": port,
                    "success": success,
                    "service": self._get_service_name(port)
                })
        
        successful_connections = [c for c in connections_attempted if c["success"]]
        
        await self._log_threat(
            session_id=session_id,
            threat_type="lateral_movement",
            severity="high",
            source_ip=target_ip,
            description=f"Lateral movement detected: {len(successful_connections)} successful connections",
            metadata={
                "total_attempts": len(connections_attempted),
                "successful_connections": len(successful_connections),
                "target_ips": internal_ips,
                "connection_details": connections_attempted
            }
        )
        
        return {
            "total_attempts": len(connections_attempted),
            "successful_connections": len(successful_connections),
            "target_ips": internal_ips,
            "detection_likelihood": "high"
        }
    
    def _get_service_name(self, port: int) -> str:
        """Get service name for port number"""
        services = {
            22: "SSH", 23: "Telnet", 135: "RPC", 139: "NetBIOS",
            445: "SMB", 3389: "RDP", 5900: "VNC"
        }
        return services.get(port, "Unknown")
    
    async def _create_fake_session(self, client_ip: str, attack_type: str) -> int:
        """Create a fake VNC session for simulation"""
        db = SessionLocal()
        try:
            session = VNCSession(
                client_ip=client_ip,
                server_ip="127.0.0.1",
                client_port=random.randint(50000, 60000),
                server_port=5900,
                start_time=datetime.utcnow(),
                status="active",
                data_transferred=0.0,
                risk_score=random.uniform(70, 95)  # High risk for attacks
            )
            
            db.add(session)
            db.commit()
            db.refresh(session)
            return session.id
            
        except Exception as e:
            logger.error(f"Failed to create fake session: {e}")
            db.rollback()
            return None
        finally:
            db.close()
    
    async def _log_threat(self, session_id: int, threat_type: str, severity: str, 
                         source_ip: str, description: str, metadata: Dict = None):
        """Log threat to database"""
        db = SessionLocal()
        try:
            threat = ThreatLog(
                threat_type=threat_type,
                severity=severity,
                source_ip=source_ip,
                description=description,
                detection_method="simulation",
                action_taken="logged",
                session_id=session_id,
                confidence=1.0  # 100% confidence for simulations
            )
            
            if metadata:
                threat.set_metadata(metadata)
            
            db.add(threat)
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to log threat: {e}")
            db.rollback()
        finally:
            db.close()

# CLI interface for manual testing
if __name__ == "__main__":
    import sys
    
    async def main():
        simulator = AttackSimulator()
        
        if len(sys.argv) > 1:
            attack_type = sys.argv[1]
            target_ip = sys.argv[2] if len(sys.argv) > 2 else "127.0.0.1"
            
            result = await simulator.run_attack(attack_type, target_ip)
            print(f"Attack simulation result: {result}")
        else:
            print("Available attack types:")
            print("- file_exfiltration")
            print("- screenshot_spam") 
            print("- clipboard_stealing")
            print("- keystroke_logging")
            print("- large_data_transfer")
            print("- credential_harvesting")
            print("- lateral_movement")
            print("\nUsage: python attack_simulator.py <attack_type> [target_ip]")
    
    asyncio.run(main())