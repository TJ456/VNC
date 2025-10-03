"""
Database setup and initialization script
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import init_db, SessionLocal
from database.models import DetectionRule, FirewallRule
from datetime import datetime
import json

def create_default_detection_rules():
    """Create default detection rules"""
    db = SessionLocal()
    
    try:
        # File exfiltration rule
        if not db.query(DetectionRule).filter_by(rule_name="large_file_transfer").first():
            file_rule = DetectionRule(
                rule_name="large_file_transfer",
                rule_type="threshold",
                category="file_transfer",
                threshold_value=100.0,  # 100MB
                time_window=300,  # 5 minutes
                severity="high",
                description="Detects large file transfers that may indicate data exfiltration",
                conditions=json.dumps({
                    "data_size_mb": {"operator": ">", "value": 100},
                    "time_window_seconds": 300
                })
            )
            db.add(file_rule)
        
        # Screenshot spam rule
        if not db.query(DetectionRule).filter_by(rule_name="screenshot_spam").first():
            screenshot_rule = DetectionRule(
                rule_name="screenshot_spam",
                rule_type="threshold",
                category="screenshot",
                threshold_value=20.0,  # 20 screenshots
                time_window=60,  # 1 minute
                severity="medium",
                description="Detects excessive screenshot capturing",
                conditions=json.dumps({
                    "screenshot_count": {"operator": ">", "value": 20},
                    "time_window_seconds": 60
                })
            )
            db.add(screenshot_rule)
        
        # Clipboard abuse rule
        if not db.query(DetectionRule).filter_by(rule_name="clipboard_abuse").first():
            clipboard_rule = DetectionRule(
                rule_name="clipboard_abuse",
                rule_type="threshold", 
                category="clipboard",
                threshold_value=50.0,  # 50 operations
                time_window=120,  # 2 minutes
                severity="medium",
                description="Detects excessive clipboard operations",
                conditions=json.dumps({
                    "clipboard_ops": {"operator": ">", "value": 50},
                    "time_window_seconds": 120
                })
            )
            db.add(clipboard_rule)
        
        # Unusual connection pattern rule
        if not db.query(DetectionRule).filter_by(rule_name="unusual_connection_pattern").first():
            pattern_rule = DetectionRule(
                rule_name="unusual_connection_pattern",
                rule_type="anomaly",
                category="connection",
                severity="high",
                description="Detects connections from unusual locations or times",
                conditions=json.dumps({
                    "check_geo_location": True,
                    "check_time_pattern": True,
                    "anomaly_threshold": 0.8
                })
            )
            db.add(pattern_rule)
        
        db.commit()
        print("Default detection rules created successfully!")
        
    except Exception as e:
        print(f"Error creating default rules: {e}")
        db.rollback()
    finally:
        db.close()

def create_default_firewall_rules():
    """Create default firewall rules"""
    db = SessionLocal()
    
    try:
        # Default allow VNC on standard port
        if not db.query(FirewallRule).filter_by(rule_name="allow_vnc_internal").first():
            allow_rule = FirewallRule(
                rule_name="allow_vnc_internal",
                source_ip="192.168.0.0/16",  # Internal network
                destination_port="5900-5999",  # VNC port range
                protocol="tcp",
                action="allow",
                priority=100,
                description="Allow VNC connections from internal network",
                auto_created=False
            )
            db.add(allow_rule)
        
        # Block external VNC by default
        if not db.query(FirewallRule).filter_by(rule_name="block_external_vnc").first():
            block_rule = FirewallRule(
                rule_name="block_external_vnc",
                source_ip="0.0.0.0/0",  # Any external IP
                destination_port="5900-5999",
                protocol="tcp", 
                action="deny",
                priority=200,
                description="Block VNC connections from external networks",
                auto_created=False
            )
            db.add(block_rule)
        
        db.commit()
        print("Default firewall rules created successfully!")
        
    except Exception as e:
        print(f"Error creating default firewall rules: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    """Main setup function"""
    print("Setting up VNC Protection Platform Database...")
    
    try:
        # Initialize database
        init_db()
        
        # Create default rules
        create_default_detection_rules()
        create_default_firewall_rules()
        
        print("\nDatabase setup completed successfully!")
        print("Default detection and firewall rules have been created.")
        
    except Exception as e:
        print(f"Database setup failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()