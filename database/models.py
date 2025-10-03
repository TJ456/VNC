"""
Database models for VNC Protection Platform
Defines SQLAlchemy models for storing session data, threats, and system metrics
"""

from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import json

Base = declarative_base()

class VNCSession(Base):
    """Model for VNC session tracking"""
    __tablename__ = "vnc_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    client_ip = Column(String, nullable=False, index=True)
    server_ip = Column(String, nullable=False)
    client_port = Column(Integer, nullable=True)
    server_port = Column(Integer, default=5900)
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(String, default="active", nullable=False)  # active, terminated, blocked
    
    # Security metrics
    data_transferred = Column(Float, default=0.0)  # MB
    packets_sent = Column(Integer, default=0)
    packets_received = Column(Integer, default=0)
    screenshots_count = Column(Integer, default=0)
    clipboard_operations = Column(Integer, default=0)
    file_operations = Column(Integer, default=0)
    
    # Risk assessment
    risk_score = Column(Float, default=0.0)  # 0-100 scale
    anomaly_score = Column(Float, default=0.0)
    
    # Authentication
    auth_method = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    # Relationship to threats
    threats = relationship("ThreatLog", back_populates="session")
    
    def to_dict(self):
        return {
            "id": self.id,
            "client_ip": self.client_ip,
            "server_ip": self.server_ip,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "status": self.status,
            "data_transferred": self.data_transferred,
            "risk_score": self.risk_score
        }

class ThreatLog(Base):
    """Model for logging detected threats and attacks"""
    __tablename__ = "threat_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Threat classification
    threat_type = Column(String, nullable=False, index=True)  # file_exfiltration, screenshot_spam, etc.
    severity = Column(String, nullable=False)  # low, medium, high, critical
    confidence = Column(Float, default=0.0)  # Detection confidence 0-1
    
    # Source information
    source_ip = Column(String, nullable=False, index=True)
    source_port = Column(Integer, nullable=True)
    target_ip = Column(String, nullable=True)
    target_port = Column(Integer, nullable=True)
    
    # Threat details
    description = Column(Text, nullable=False)
    attack_vector = Column(String, nullable=True)
    payload_size = Column(Integer, nullable=True)  # bytes
    
    # Detection method
    detection_method = Column(String, nullable=False)  # ml_anomaly, rule_based, signature
    detector_version = Column(String, nullable=True)
    
    # Response actions
    action_taken = Column(String, nullable=False)  # blocked, logged, quarantined
    blocked_automatically = Column(Boolean, default=False)
    manual_review_required = Column(Boolean, default=False)
    
    # Additional metadata
    metadata = Column(Text, nullable=True)  # JSON string for additional data
    
    # Foreign key to VNC session
    session_id = Column(Integer, ForeignKey("vnc_sessions.id"), nullable=True)
    session = relationship("VNCSession", back_populates="threats")
    
    def set_metadata(self, data):
        """Store additional metadata as JSON"""
        self.metadata = json.dumps(data)
    
    def get_metadata(self):
        """Retrieve metadata as dictionary"""
        if self.metadata:
            return json.loads(self.metadata)
        return {}
    
    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "threat_type": self.threat_type,
            "severity": self.severity,
            "source_ip": self.source_ip,
            "description": self.description,
            "action_taken": self.action_taken,
            "session_id": self.session_id
        }

class SystemMetrics(Base):
    """Model for storing system performance and security metrics"""
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # System performance
    cpu_usage = Column(Float, nullable=False)  # Percentage
    memory_usage = Column(Float, nullable=False)  # Percentage
    disk_usage = Column(Float, nullable=True)  # Percentage
    
    # Network statistics
    network_io = Column(Float, nullable=False)  # MB/s
    active_connections = Column(Integer, nullable=False)
    bandwidth_utilization = Column(Float, nullable=True)  # Percentage
    
    # Security metrics
    threats_detected = Column(Integer, default=0)
    threats_blocked = Column(Integer, default=0)
    false_positives = Column(Integer, default=0)
    
    # VNC specific metrics
    vnc_sessions_active = Column(Integer, default=0)
    vnc_data_transferred = Column(Float, default=0.0)  # MB
    
    def to_dict(self):
        return {
            "timestamp": self.timestamp.isoformat(),
            "cpu_usage": self.cpu_usage,
            "memory_usage": self.memory_usage,
            "network_io": self.network_io,
            "active_connections": self.active_connections,
            "threats_blocked": self.threats_blocked
        }

class FirewallRule(Base):
    """Model for tracking firewall rules"""
    __tablename__ = "firewall_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Rule details
    rule_name = Column(String, nullable=False, unique=True)
    source_ip = Column(String, nullable=True)  # IP or CIDR
    source_port = Column(String, nullable=True)  # Port or range
    destination_ip = Column(String, nullable=True)
    destination_port = Column(String, nullable=True)
    protocol = Column(String, default="tcp")  # tcp, udp, icmp, all
    
    # Rule configuration
    action = Column(String, nullable=False)  # allow, deny, drop, reject
    priority = Column(Integer, default=100)
    is_active = Column(Boolean, default=True)
    
    # Automation details
    auto_created = Column(Boolean, default=False)
    trigger_threat_id = Column(Integer, ForeignKey("threat_logs.id"), nullable=True)
    expires_at = Column(DateTime, nullable=True)  # For temporary rules
    
    # Metadata
    description = Column(Text, nullable=True)
    tags = Column(String, nullable=True)  # Comma-separated tags
    
    def to_dict(self):
        return {
            "id": self.id,
            "rule_name": self.rule_name,
            "source_ip": self.source_ip,
            "action": self.action,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat()
        }

class DetectionRule(Base):
    """Model for custom detection rules"""
    __tablename__ = "detection_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Rule identification
    rule_name = Column(String, nullable=False, unique=True)
    rule_type = Column(String, nullable=False)  # threshold, pattern, anomaly
    category = Column(String, nullable=False)  # file_transfer, screenshot, clipboard, etc.
    
    # Rule configuration
    conditions = Column(Text, nullable=False)  # JSON string of conditions
    threshold_value = Column(Float, nullable=True)
    time_window = Column(Integer, nullable=True)  # seconds
    
    # Rule metadata
    severity = Column(String, default="medium")
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Performance metrics
    trigger_count = Column(Integer, default=0)
    false_positive_count = Column(Integer, default=0)
    last_triggered = Column(DateTime, nullable=True)
    
    def get_conditions(self):
        """Parse conditions from JSON"""
        if self.conditions:
            return json.loads(self.conditions)
        return {}
    
    def set_conditions(self, conditions_dict):
        """Store conditions as JSON"""
        self.conditions = json.dumps(conditions_dict)

class AuditLog(Base):
    """Model for system audit logging"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Event details
    event_type = Column(String, nullable=False)  # login, rule_change, threat_response, etc.
    actor = Column(String, nullable=False)  # system, admin, user
    action = Column(String, nullable=False)
    target = Column(String, nullable=True)  # What was acted upon
    
    # Context
    source_ip = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    session_id = Column(String, nullable=True)
    
    # Results
    success = Column(Boolean, nullable=False)
    error_message = Column(Text, nullable=True)
    
    # Additional details
    details = Column(Text, nullable=True)  # JSON string for additional context
    
    def set_details(self, details_dict):
        """Store details as JSON"""
        self.details = json.dumps(details_dict)
    
    def get_details(self):
        """Retrieve details as dictionary"""
        if self.details:
            return json.loads(self.details)
        return {}