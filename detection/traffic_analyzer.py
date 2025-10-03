"""
Traffic Analyzer - Analyzes network traffic for VNC-specific patterns and anomalies
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import statistics
import sys
import os

# Add parent directory for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import SessionLocal
from database.models import VNCSession, ThreatLog, DetectionRule

logger = logging.getLogger(__name__)

class TrafficAnalyzer:
    """Analyzes VNC traffic patterns for anomaly detection"""
    
    def __init__(self):
        self.traffic_patterns = {}
        self.baseline_metrics = {}
        self.analysis_window = 300  # 5 minutes
        self.detection_rules = []
        
    async def initialize(self):
        """Initialize traffic analyzer with detection rules"""
        await self._load_detection_rules()
        await self._calculate_baseline_metrics()
        logger.info("Traffic analyzer initialized")
    
    async def _load_detection_rules(self):
        """Load detection rules from database"""
        db = SessionLocal()
        try:
            rules = db.query(DetectionRule).filter_by(is_active=True).all()
            self.detection_rules = rules
            logger.info(f"Loaded {len(rules)} detection rules")
        except Exception as e:
            logger.error(f"Error loading detection rules: {e}")
        finally:
            db.close()
    
    async def _calculate_baseline_metrics(self):
        """Calculate baseline metrics for normal VNC traffic"""
        db = SessionLocal()
        try:
            # Get sessions from last 7 days for baseline
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            sessions = db.query(VNCSession).filter(
                VNCSession.start_time >= cutoff_date
            ).all()
            
            if sessions:
                # Calculate baseline metrics
                data_transfers = [s.data_transferred for s in sessions if s.data_transferred > 0]
                session_durations = [
                    (s.end_time - s.start_time).total_seconds() / 3600
                    for s in sessions if s.end_time
                ]
                
                self.baseline_metrics = {
                    'avg_data_transfer_mb': statistics.mean(data_transfers) if data_transfers else 10.0,
                    'std_data_transfer_mb': statistics.stdev(data_transfers) if len(data_transfers) > 1 else 5.0,
                    'avg_session_duration_hours': statistics.mean(session_durations) if session_durations else 1.0,
                    'std_session_duration_hours': statistics.stdev(session_durations) if len(session_durations) > 1 else 0.5,
                    'normal_screenshot_rate': 2.0,  # screenshots per minute
                    'normal_clipboard_rate': 5.0    # clipboard ops per minute
                }
            else:
                # Default baseline if no historical data
                self.baseline_metrics = {
                    'avg_data_transfer_mb': 10.0,
                    'std_data_transfer_mb': 5.0,
                    'avg_session_duration_hours': 1.0,
                    'std_session_duration_hours': 0.5,
                    'normal_screenshot_rate': 2.0,
                    'normal_clipboard_rate': 5.0
                }
                
            logger.info("Baseline metrics calculated")
            
        except Exception as e:
            logger.error(f"Error calculating baseline metrics: {e}")
        finally:
            db.close()
    
    async def analyze_session(self, session_id: int) -> Dict[str, Any]:
        """Analyze a specific VNC session for anomalies"""
        db = SessionLocal()
        try:
            session = db.query(VNCSession).filter_by(id=session_id).first()
            if not session:
                return {"error": "Session not found"}
            
            anomalies = []
            risk_factors = []
            
            # Analyze data transfer patterns
            data_anomaly = self._analyze_data_transfer(session)
            if data_anomaly:
                anomalies.append(data_anomaly)
                risk_factors.append("excessive_data_transfer")
            
            # Analyze session duration
            duration_anomaly = self._analyze_session_duration(session)
            if duration_anomaly:
                anomalies.append(duration_anomaly)
                risk_factors.append("unusual_duration")
            
            # Analyze screenshot patterns
            screenshot_anomaly = self._analyze_screenshot_pattern(session)
            if screenshot_anomaly:
                anomalies.append(screenshot_anomaly)
                risk_factors.append("screenshot_abuse")
            
            # Analyze clipboard patterns
            clipboard_anomaly = self._analyze_clipboard_pattern(session)
            if clipboard_anomaly:
                anomalies.append(clipboard_anomaly)
                risk_factors.append("clipboard_abuse")
            
            # Calculate overall risk score
            risk_score = self._calculate_risk_score(session, risk_factors)
            
            # Update session risk score
            session.risk_score = risk_score
            session.anomaly_score = len(anomalies) * 10  # Simple scoring
            db.commit()
            
            analysis_result = {
                "session_id": session_id,
                "risk_score": risk_score,
                "anomaly_count": len(anomalies),
                "anomalies": anomalies,
                "risk_factors": risk_factors,
                "recommendations": self._generate_recommendations(risk_factors),
                "timestamp": datetime.now().isoformat()
            }
            
            # Log high-risk sessions as threats
            if risk_score > 70:
                await self._log_threat_from_analysis(session, analysis_result)
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error analyzing session: {e}")
            return {"error": str(e)}
        finally:
            db.close()
    
    def _analyze_data_transfer(self, session: VNCSession) -> Optional[Dict]:
        """Analyze data transfer patterns"""
        if session.data_transferred <= 0:
            return None
            
        baseline_avg = self.baseline_metrics['avg_data_transfer_mb']
        baseline_std = self.baseline_metrics['std_data_transfer_mb']
        
        # Check if transfer is significantly above normal (z-score > 3)
        z_score = (session.data_transferred - baseline_avg) / baseline_std
        
        if z_score > 3:  # 3 standard deviations above mean
            return {
                "type": "excessive_data_transfer",
                "severity": "high" if z_score > 5 else "medium",
                "details": {
                    "transferred_mb": session.data_transferred,
                    "baseline_avg_mb": baseline_avg,
                    "z_score": z_score,
                    "description": f"Data transfer {z_score:.1f} standard deviations above normal"
                }
            }
        return None
    
    def _analyze_session_duration(self, session: VNCSession) -> Optional[Dict]:
        """Analyze session duration patterns"""
        if not session.end_time:
            return None  # Session still active
            
        duration_hours = (session.end_time - session.start_time).total_seconds() / 3600
        baseline_avg = self.baseline_metrics['avg_session_duration_hours']
        baseline_std = self.baseline_metrics['std_session_duration_hours']
        
        z_score = abs(duration_hours - baseline_avg) / baseline_std
        
        if z_score > 2:  # Unusual duration
            return {
                "type": "unusual_session_duration",
                "severity": "medium" if z_score > 2 else "low",
                "details": {
                    "duration_hours": duration_hours,
                    "baseline_avg_hours": baseline_avg,
                    "z_score": z_score,
                    "description": f"Session duration {z_score:.1f} standard deviations from normal"
                }
            }
        return None
    
    def _analyze_screenshot_pattern(self, session: VNCSession) -> Optional[Dict]:
        """Analyze screenshot capture patterns"""
        if session.screenshots_count <= 0:
            return None
            
        # Calculate rate based on session duration or assume 1 hour if still active
        if session.end_time:
            duration_minutes = (session.end_time - session.start_time).total_seconds() / 60
        else:
            duration_minutes = (datetime.utcnow() - session.start_time).total_seconds() / 60
        
        if duration_minutes <= 0:
            return None
            
        screenshot_rate = session.screenshots_count / duration_minutes
        normal_rate = self.baseline_metrics['normal_screenshot_rate']
        
        if screenshot_rate > normal_rate * 10:  # 10x normal rate
            return {
                "type": "excessive_screenshots",
                "severity": "high" if screenshot_rate > normal_rate * 20 else "medium",
                "details": {
                    "screenshot_count": session.screenshots_count,
                    "rate_per_minute": screenshot_rate,
                    "normal_rate_per_minute": normal_rate,
                    "description": f"Screenshot rate {screenshot_rate:.1f}/min is {screenshot_rate/normal_rate:.1f}x normal"
                }
            }
        return None
    
    def _analyze_clipboard_pattern(self, session: VNCSession) -> Optional[Dict]:
        """Analyze clipboard usage patterns"""
        if session.clipboard_operations <= 0:
            return None
            
        # Calculate rate
        if session.end_time:
            duration_minutes = (session.end_time - session.start_time).total_seconds() / 60
        else:
            duration_minutes = (datetime.utcnow() - session.start_time).total_seconds() / 60
        
        if duration_minutes <= 0:
            return None
            
        clipboard_rate = session.clipboard_operations / duration_minutes
        normal_rate = self.baseline_metrics['normal_clipboard_rate']
        
        if clipboard_rate > normal_rate * 5:  # 5x normal rate
            return {
                "type": "excessive_clipboard_usage",
                "severity": "high" if clipboard_rate > normal_rate * 10 else "medium",
                "details": {
                    "clipboard_operations": session.clipboard_operations,
                    "rate_per_minute": clipboard_rate,
                    "normal_rate_per_minute": normal_rate,
                    "description": f"Clipboard rate {clipboard_rate:.1f}/min is {clipboard_rate/normal_rate:.1f}x normal"
                }
            }
        return None
    
    def _calculate_risk_score(self, session: VNCSession, risk_factors: List[str]) -> float:
        """Calculate overall risk score for session"""
        base_score = session.risk_score or 0
        
        # Add points for each risk factor
        risk_points = {
            "excessive_data_transfer": 30,
            "unusual_duration": 10,
            "screenshot_abuse": 25,
            "clipboard_abuse": 20,
            "external_ip": 15,
            "suspicious_ip": 40
        }
        
        additional_risk = sum(risk_points.get(factor, 0) for factor in risk_factors)
        
        # Check IP-based risk factors
        if not self._is_internal_ip(session.client_ip):
            additional_risk += risk_points["external_ip"]
        
        if self._is_suspicious_ip(session.client_ip):
            additional_risk += risk_points["suspicious_ip"]
        
        final_score = min(base_score + additional_risk, 100.0)
        return final_score
    
    def _is_internal_ip(self, ip: str) -> bool:
        """Check if IP is internal"""
        internal_ranges = ['192.168.', '10.', '172.16.', '127.']
        return any(ip.startswith(range_prefix) for range_prefix in internal_ranges)
    
    def _is_suspicious_ip(self, ip: str) -> bool:
        """Check if IP is suspicious"""
        suspicious_ips = ['203.0.113.5', '198.51.100.10', '192.0.2.50']
        return ip in suspicious_ips
    
    def _generate_recommendations(self, risk_factors: List[str]) -> List[str]:
        """Generate security recommendations based on risk factors"""
        recommendations = []
        
        if "excessive_data_transfer" in risk_factors:
            recommendations.append("Implement data loss prevention (DLP) policies")
            recommendations.append("Monitor and limit file transfer sizes")
        
        if "screenshot_abuse" in risk_factors:
            recommendations.append("Limit screenshot capture frequency")
            recommendations.append("Monitor screen sharing activities")
        
        if "clipboard_abuse" in risk_factors:
            recommendations.append("Restrict clipboard operations for sensitive data")
            recommendations.append("Implement clipboard monitoring")
        
        if "external_ip" in risk_factors:
            recommendations.append("Restrict VNC access to internal networks only")
            recommendations.append("Implement VPN requirements for external access")
        
        if "suspicious_ip" in risk_factors:
            recommendations.append("Block access from known malicious IPs")
            recommendations.append("Enable enhanced monitoring for this IP")
        
        return recommendations
    
    async def _log_threat_from_analysis(self, session: VNCSession, analysis: Dict):
        """Log threat based on traffic analysis"""
        db = SessionLocal()
        try:
            threat = ThreatLog(
                threat_type="traffic_analysis_anomaly",
                severity="high" if analysis["risk_score"] > 85 else "medium",
                source_ip=session.client_ip,
                description=f"Traffic analysis detected {analysis['anomaly_count']} anomalies with risk score {analysis['risk_score']:.1f}",
                detection_method="traffic_analysis",
                action_taken="logged",
                session_id=session.id,
                confidence=min(analysis["risk_score"] / 100, 1.0)
            )
            
            threat.set_metadata({
                "anomalies": analysis["anomalies"],
                "risk_factors": analysis["risk_factors"],
                "analysis_timestamp": analysis["timestamp"]
            })
            
            db.add(threat)
            db.commit()
            
            logger.warning(f"Threat logged for session {session.id}: {analysis['anomaly_count']} anomalies detected")
            
        except Exception as e:
            logger.error(f"Error logging threat from analysis: {e}")
            db.rollback()
        finally:
            db.close()
    
    async def analyze_recent_traffic(self) -> Dict[str, Any]:
        """Analyze recent traffic for anomalies"""
        db = SessionLocal()
        try:
            # Analyze sessions from last hour
            cutoff_time = datetime.utcnow() - timedelta(hours=1)
            recent_sessions = db.query(VNCSession).filter(
                VNCSession.start_time >= cutoff_time
            ).all()
            
            anomalies_found = []
            
            for session in recent_sessions:
                analysis = await self.analyze_session(session.id)
                if analysis.get("anomaly_count", 0) > 0:
                    anomalies_found.append({
                        "session_id": session.id,
                        "client_ip": session.client_ip,
                        "anomalies": analysis["anomalies"],
                        "risk_score": analysis["risk_score"]
                    })
            
            return {
                "analysis_timestamp": datetime.now().isoformat(),
                "sessions_analyzed": len(recent_sessions),
                "anomalies_found": len(anomalies_found),
                "anomalies": anomalies_found
            }
            
        except Exception as e:
            logger.error(f"Error analyzing recent traffic: {e}")
            return {"error": str(e)}
        finally:
            db.close()