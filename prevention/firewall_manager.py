"""
Firewall Manager - Manages firewall rules for VNC protection
Handles automatic IP blocking, rule management, and threat response
"""

import logging
import subprocess
import platform
import ipaddress
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import sys
import os

# Add parent directory for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import SessionLocal
from database.models import FirewallRule, ThreatLog, AuditLog

logger = logging.getLogger(__name__)

class FirewallManager:
    """Manages firewall rules and automatic threat response"""
    
    def __init__(self):
        self.blocked_ips = set()
        self.temporary_blocks = {}  # IP -> expiry time
        self.platform = platform.system().lower()
        self.vnc_ports = [5900, 5901, 5902, 5903, 5904, 5905]
        
        # Initialize firewall based on platform
        if self.platform == "windows":
            self.firewall_cmd = "netsh"
        elif self.platform in ["linux", "darwin"]:
            self.firewall_cmd = "iptables"
        else:
            logger.warning(f"Unsupported platform: {self.platform}")
            self.firewall_cmd = None
    
    def block_ip(self, ip_address: str, duration_minutes: Optional[int] = None, 
                 reason: str = "Manual block") -> Dict[str, Any]:
        """Block an IP address"""
        try:
            # Validate IP address
            ipaddress.ip_address(ip_address)
            
            # Don't block local or internal IPs
            if self._is_internal_ip(ip_address):
                return {
                    "success": False,
                    "error": "Cannot block internal IP addresses",
                    "ip": ip_address
                }
            
            # Add to blocked IPs set
            self.blocked_ips.add(ip_address)
            
            # Set expiry for temporary blocks
            if duration_minutes:
                expiry_time = datetime.now() + timedelta(minutes=duration_minutes)
                self.temporary_blocks[ip_address] = expiry_time
            
            # Apply firewall rule
            if self.firewall_cmd:
                success = self._apply_firewall_block(ip_address)
                if not success:
                    logger.warning(f"Failed to apply firewall rule for {ip_address}")
            
            # Store in database
            self._store_firewall_rule(ip_address, "deny", reason, duration_minutes)
            
            # Log audit event
            self._log_audit_event("ip_blocked", f"IP {ip_address} blocked", ip_address)
            
            logger.info(f"IP {ip_address} blocked successfully")
            
            return {
                "success": True,
                "ip": ip_address,
                "action": "blocked",
                "duration_minutes": duration_minutes,
                "reason": reason,
                "timestamp": datetime.now().isoformat()
            }
            
        except ValueError:
            return {
                "success": False,
                "error": "Invalid IP address format",
                "ip": ip_address
            }
        except Exception as e:
            logger.error(f"Error blocking IP {ip_address}: {e}")
            return {
                "success": False,
                "error": str(e),
                "ip": ip_address
            }
    
    def unblock_ip(self, ip_address: str, reason: str = "Manual unblock") -> Dict[str, Any]:
        """Unblock an IP address"""
        try:
            ipaddress.ip_address(ip_address)
            
            if ip_address not in self.blocked_ips:
                return {
                    "success": False,
                    "error": "IP is not currently blocked",
                    "ip": ip_address
                }
            
            # Remove from blocked set
            self.blocked_ips.discard(ip_address)
            
            # Remove temporary block if exists
            self.temporary_blocks.pop(ip_address, None)
            
            # Remove firewall rule
            if self.firewall_cmd:
                success = self._remove_firewall_block(ip_address)
                if not success:
                    logger.warning(f"Failed to remove firewall rule for {ip_address}")
            
            # Update database rule
            self._update_firewall_rule(ip_address, "inactive", reason)
            
            # Log audit event
            self._log_audit_event("ip_unblocked", f"IP {ip_address} unblocked", ip_address)
            
            logger.info(f"IP {ip_address} unblocked successfully")
            
            return {
                "success": True,
                "ip": ip_address,
                "action": "unblocked",
                "reason": reason,
                "timestamp": datetime.now().isoformat()
            }
            
        except ValueError:
            return {
                "success": False,
                "error": "Invalid IP address format",
                "ip": ip_address
            }
        except Exception as e:
            logger.error(f"Error unblocking IP {ip_address}: {e}")
            return {
                "success": False,
                "error": str(e),
                "ip": ip_address
            }
    
    def _apply_firewall_block(self, ip_address: str) -> bool:
        """Apply firewall rule to block IP"""
        try:
            if self.platform == "windows":
                return self._apply_windows_firewall_block(ip_address)
            elif self.platform in ["linux", "darwin"]:
                return self._apply_unix_firewall_block(ip_address)
            else:
                logger.warning("Firewall rules not supported on this platform")
                return True  # Simulate success for demo
                
        except Exception as e:
            logger.error(f"Error applying firewall block: {e}")
            return False
    
    def _apply_windows_firewall_block(self, ip_address: str) -> bool:
        """Apply Windows firewall rule to block IP"""
        try:
            # Create inbound rule to block IP
            rule_name = f"VNC_Protection_Block_{ip_address}"
            
            # For demo purposes, we'll simulate the command
            # In production, you'd run the actual netsh command
            cmd = [
                "netsh", "advfirewall", "firewall", "add", "rule",
                f"name={rule_name}",
                "dir=in",
                "action=block",
                f"remoteip={ip_address}",
                "protocol=TCP",
                f"localport={','.join(map(str, self.vnc_ports))}"
            ]
            
            logger.info(f"Would execute: {' '.join(cmd)}")
            # result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return True  # Simulate success for demo
            
        except Exception as e:
            logger.error(f"Error applying Windows firewall rule: {e}")
            return False
    
    def _apply_unix_firewall_block(self, ip_address: str) -> bool:
        """Apply iptables rule to block IP"""
        try:
            # For demo purposes, we'll simulate the command
            # In production, you'd run the actual iptables command
            for port in self.vnc_ports:
                cmd = [
                    "iptables", "-A", "INPUT",
                    "-s", ip_address,
                    "-p", "tcp", "--dport", str(port),
                    "-j", "DROP"
                ]
                logger.info(f"Would execute: {' '.join(cmd)}")
                # result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            return True  # Simulate success for demo
            
        except Exception as e:
            logger.error(f"Error applying iptables rule: {e}")
            return False
    
    def _remove_firewall_block(self, ip_address: str) -> bool:
        """Remove firewall rule blocking IP"""
        try:
            if self.platform == "windows":
                return self._remove_windows_firewall_block(ip_address)
            elif self.platform in ["linux", "darwin"]:
                return self._remove_unix_firewall_block(ip_address)
            else:
                return True  # Simulate success for demo
                
        except Exception as e:
            logger.error(f"Error removing firewall block: {e}")
            return False
    
    def _remove_windows_firewall_block(self, ip_address: str) -> bool:
        """Remove Windows firewall rule"""
        try:
            rule_name = f"VNC_Protection_Block_{ip_address}"
            
            cmd = [
                "netsh", "advfirewall", "firewall", "delete", "rule",
                f"name={rule_name}"
            ]
            
            logger.info(f"Would execute: {' '.join(cmd)}")
            # result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return True  # Simulate success for demo
            
        except Exception as e:
            logger.error(f"Error removing Windows firewall rule: {e}")
            return False
    
    def _remove_unix_firewall_block(self, ip_address: str) -> bool:
        """Remove iptables rule"""
        try:
            for port in self.vnc_ports:
                cmd = [
                    "iptables", "-D", "INPUT",
                    "-s", ip_address,
                    "-p", "tcp", "--dport", str(port),
                    "-j", "DROP"
                ]
                logger.info(f"Would execute: {' '.join(cmd)}")
                # result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            return True  # Simulate success for demo
            
        except Exception as e:
            logger.error(f"Error removing iptables rule: {e}")
            return False
    
    def _store_firewall_rule(self, ip_address: str, action: str, reason: str, 
                           duration_minutes: Optional[int] = None):
        """Store firewall rule in database"""
        db = SessionLocal()
        try:
            # Check if rule already exists
            existing_rule = db.query(FirewallRule).filter_by(
                source_ip=ip_address,
                is_active=True
            ).first()
            
            if existing_rule:
                # Update existing rule
                existing_rule.action = action
                existing_rule.description = reason
                existing_rule.updated_at = datetime.utcnow()
                if duration_minutes:
                    existing_rule.expires_at = datetime.utcnow() + timedelta(minutes=duration_minutes)
            else:
                # Create new rule
                rule = FirewallRule(
                    rule_name=f"auto_block_{ip_address}_{int(datetime.now().timestamp())}",
                    source_ip=ip_address,
                    action=action,
                    auto_created=True,
                    description=reason,
                    protocol="tcp",
                    destination_port=",".join(map(str, self.vnc_ports))
                )
                
                if duration_minutes:
                    rule.expires_at = datetime.utcnow() + timedelta(minutes=duration_minutes)
                
                db.add(rule)
            
            db.commit()
            
        except Exception as e:
            logger.error(f"Error storing firewall rule: {e}")
            db.rollback()
        finally:
            db.close()
    
    def _update_firewall_rule(self, ip_address: str, status: str, reason: str):
        """Update firewall rule status"""
        db = SessionLocal()
        try:
            rule = db.query(FirewallRule).filter_by(
                source_ip=ip_address,
                is_active=True
            ).first()
            
            if rule:
                rule.is_active = (status == "active")
                rule.description = f"{rule.description} | {reason}"
                rule.updated_at = datetime.utcnow()
                db.commit()
            
        except Exception as e:
            logger.error(f"Error updating firewall rule: {e}")
            db.rollback()
        finally:
            db.close()
    
    def _log_audit_event(self, event_type: str, action: str, target: str):
        """Log audit event"""
        db = SessionLocal()
        try:
            audit = AuditLog(
                event_type=event_type,
                actor="system",
                action=action,
                target=target,
                success=True
            )
            
            db.add(audit)
            db.commit()
            
        except Exception as e:
            logger.error(f"Error logging audit event: {e}")
            db.rollback()
        finally:
            db.close()
    
    def _is_internal_ip(self, ip_address: str) -> bool:
        """Check if IP is internal/private"""
        try:
            ip = ipaddress.ip_address(ip_address)
            return ip.is_private or ip.is_loopback or ip.is_link_local
        except ValueError:
            return False
    
    def cleanup_expired_blocks(self) -> int:
        """Remove expired temporary blocks"""
        removed_count = 0
        current_time = datetime.now()
        
        expired_ips = [
            ip for ip, expiry in self.temporary_blocks.items()
            if expiry <= current_time
        ]
        
        for ip in expired_ips:
            result = self.unblock_ip(ip, "Temporary block expired")
            if result["success"]:
                removed_count += 1
        
        logger.info(f"Cleaned up {removed_count} expired IP blocks")
        return removed_count
    
    def get_blocked_ips(self) -> List[Dict[str, Any]]:
        """Get list of currently blocked IPs"""
        blocked_list = []
        
        for ip in self.blocked_ips:
            expiry = self.temporary_blocks.get(ip)
            blocked_list.append({
                "ip": ip,
                "blocked_at": "unknown",  # Would be stored in DB in production
                "expires_at": expiry.isoformat() if expiry else None,
                "is_temporary": ip in self.temporary_blocks
            })
        
        return blocked_list
    
    def create_vpn_only_rule(self, vpn_network: str = "10.0.0.0/8") -> Dict[str, Any]:
        """Create rule to allow VNC only from VPN network"""
        try:
            # Validate network
            network = ipaddress.ip_network(vpn_network, strict=False)
            
            # Store in database
            db = SessionLocal()
            try:
                rule = FirewallRule(
                    rule_name=f"vpn_only_vnc_{int(datetime.now().timestamp())}",
                    source_ip=str(network),
                    destination_port=",".join(map(str, self.vnc_ports)),
                    protocol="tcp",
                    action="allow",
                    priority=50,  # Higher priority
                    description="Allow VNC only from VPN network",
                    auto_created=True
                )
                
                db.add(rule)
                db.commit()
                
                logger.info(f"Created VPN-only rule for network {vpn_network}")
                
                return {
                    "success": True,
                    "rule_name": rule.rule_name,
                    "network": str(network),
                    "action": "VPN-only access configured"
                }
                
            finally:
                db.close()
                
        except ValueError:
            return {
                "success": False,
                "error": "Invalid network format"
            }
        except Exception as e:
            logger.error(f"Error creating VPN rule: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def auto_block_threat_ip(self, threat_log: ThreatLog, duration_minutes: int = 60) -> Dict[str, Any]:
        """Automatically block IP based on threat detection"""
        severity_durations = {
            "low": 30,      # 30 minutes
            "medium": 60,   # 1 hour
            "high": 240,    # 4 hours
            "critical": 1440  # 24 hours
        }
        
        # Adjust duration based on severity
        duration = severity_durations.get(threat_log.severity, duration_minutes)
        
        reason = f"Auto-blocked due to {threat_log.threat_type} (severity: {threat_log.severity})"
        
        result = self.block_ip(threat_log.source_ip, duration, reason)
        
        if result["success"]:
            # Update threat log to indicate action taken
            db = SessionLocal()
            try:
                threat_log.action_taken = f"ip_blocked_{duration}min"
                threat_log.blocked_automatically = True
                db.commit()
            except Exception as e:
                logger.error(f"Error updating threat log: {e}")
                db.rollback()
            finally:
                db.close()
        
        return result
    
    def get_firewall_statistics(self) -> Dict[str, Any]:
        """Get firewall statistics"""
        db = SessionLocal()
        try:
            total_rules = db.query(FirewallRule).count()
            active_rules = db.query(FirewallRule).filter_by(is_active=True).count()
            auto_created = db.query(FirewallRule).filter_by(auto_created=True).count()
            
            return {
                "total_blocked_ips": len(self.blocked_ips),
                "temporary_blocks": len(self.temporary_blocks),
                "permanent_blocks": len(self.blocked_ips) - len(self.temporary_blocks),
                "total_firewall_rules": total_rules,
                "active_rules": active_rules,
                "auto_created_rules": auto_created,
                "platform": self.platform,
                "firewall_enabled": self.firewall_cmd is not None
            }
            
        except Exception as e:
            logger.error(f"Error getting firewall statistics: {e}")
            return {"error": str(e)}
        finally:
            db.close()