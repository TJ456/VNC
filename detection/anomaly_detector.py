"""
ML-based Anomaly Detector for VNC Protection Platform
Uses machine learning to detect anomalous VNC behavior patterns
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import os
import sys

# Add parent directory for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import SessionLocal
from database.models import VNCSession, ThreatLog, SystemMetrics

logger = logging.getLogger(__name__)

class AnomalyDetector:
    """ML-based anomaly detection for VNC traffic patterns"""
    
    def __init__(self):
        self.isolation_forest = None
        self.random_forest = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_columns = [
            'data_transferred', 'session_duration_minutes', 'screenshots_count',
            'clipboard_operations', 'file_operations', 'packets_sent',
            'packets_received', 'hour_of_day', 'day_of_week', 'is_external_ip'
        ]
        self.model_path = "detection/models/"
        
        # Create models directory if it doesn't exist
        os.makedirs(self.model_path, exist_ok=True)
    
    async def initialize(self):
        """Initialize the anomaly detector"""
        try:
            await self.load_or_train_models()
            logger.info("Anomaly detector initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize anomaly detector: {e}")
    
    async def load_or_train_models(self):
        """Load existing models or train new ones"""
        try:
            # Try to load existing models
            if self._load_models():
                logger.info("Loaded existing ML models")
            else:
                logger.info("No existing models found, training new ones...")
                await self.train_models()
        except Exception as e:
            logger.error(f"Error loading/training models: {e}")
            # Create default models for demo purposes
            self._create_default_models()
    
    def _load_models(self) -> bool:
        """Load trained models from disk"""
        try:
            isolation_path = os.path.join(self.model_path, "isolation_forest.joblib")
            random_forest_path = os.path.join(self.model_path, "random_forest.joblib")
            scaler_path = os.path.join(self.model_path, "scaler.joblib")
            
            if (os.path.exists(isolation_path) and 
                os.path.exists(random_forest_path) and 
                os.path.exists(scaler_path)):
                
                self.isolation_forest = joblib.load(isolation_path)
                self.random_forest = joblib.load(random_forest_path)
                self.scaler = joblib.load(scaler_path)
                self.is_trained = True
                return True
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
        
        return False
    
    def _save_models(self):
        """Save trained models to disk"""
        try:
            isolation_path = os.path.join(self.model_path, "isolation_forest.joblib")
            random_forest_path = os.path.join(self.model_path, "random_forest.joblib")
            scaler_path = os.path.join(self.model_path, "scaler.joblib")
            
            joblib.dump(self.isolation_forest, isolation_path)
            joblib.dump(self.random_forest, random_forest_path)
            joblib.dump(self.scaler, scaler_path)
            
            logger.info("Models saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving models: {e}")
    
    def _create_default_models(self):
        """Create default models for demo purposes"""
        try:
            # Create basic isolation forest with default parameters
            self.isolation_forest = IsolationForest(
                contamination=0.1,
                random_state=42,
                n_estimators=100
            )
            
            # Create basic random forest classifier
            self.random_forest = RandomForestClassifier(
                n_estimators=100,
                random_state=42,
                max_depth=10
            )
            
            # Create synthetic training data for demo
            synthetic_data = self._generate_synthetic_data()
            X, y = self._prepare_training_data(synthetic_data)
            
            if len(X) > 0:
                # Fit the scaler
                X_scaled = self.scaler.fit_transform(X)
                
                # Train isolation forest (unsupervised)
                self.isolation_forest.fit(X_scaled)
                
                # Train random forest (supervised)
                if len(set(y)) > 1:  # Ensure we have both classes
                    self.random_forest.fit(X_scaled, y)
                
                self.is_trained = True
                self._save_models()
                logger.info("Created and trained default models with synthetic data")
            
        except Exception as e:
            logger.error(f"Error creating default models: {e}")
    
    def _generate_synthetic_data(self) -> List[Dict]:
        """Generate synthetic VNC session data for training"""
        synthetic_sessions = []
        
        # Generate normal sessions
        for _ in range(800):
            session = {
                'data_transferred': np.random.normal(15, 8),  # MB
                'session_duration_minutes': np.random.normal(45, 20),
                'screenshots_count': np.random.poisson(5),
                'clipboard_operations': np.random.poisson(8),
                'file_operations': np.random.poisson(3),
                'packets_sent': np.random.normal(1500, 500),
                'packets_received': np.random.normal(1200, 400),
                'hour_of_day': np.random.randint(8, 18),  # Business hours
                'day_of_week': np.random.randint(0, 5),   # Weekdays
                'is_external_ip': 0,  # Internal IP
                'is_anomaly': 0  # Normal
            }
            synthetic_sessions.append(session)
        
        # Generate anomalous sessions
        for _ in range(200):
            session = {
                'data_transferred': np.random.normal(150, 50),  # Much higher
                'session_duration_minutes': np.random.normal(120, 60),  # Longer
                'screenshots_count': np.random.poisson(50),  # Many screenshots
                'clipboard_operations': np.random.poisson(100),  # Excessive clipboard
                'file_operations': np.random.poisson(20),  # Many file ops
                'packets_sent': np.random.normal(5000, 1500),  # High traffic
                'packets_received': np.random.normal(4000, 1000),
                'hour_of_day': np.random.choice([2, 3, 22, 23]),  # Off-hours
                'day_of_week': np.random.choice([5, 6]),  # Weekends
                'is_external_ip': np.random.choice([0, 1]),
                'is_anomaly': 1  # Anomalous
            }
            synthetic_sessions.append(session)
        
        return synthetic_sessions
    
    async def train_models(self):
        """Train ML models using historical data"""
        try:
            # Get training data from database
            training_data = await self._get_training_data()
            
            if len(training_data) < 50:  # Not enough data, use synthetic
                logger.warning("Insufficient historical data, using synthetic data for training")
                training_data.extend(self._generate_synthetic_data())
            
            X, y = self._prepare_training_data(training_data)
            
            if len(X) == 0:
                logger.error("No training data available")
                return
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train Isolation Forest (unsupervised anomaly detection)
            self.isolation_forest = IsolationForest(
                contamination=0.1,
                random_state=42,
                n_estimators=100
            )
            self.isolation_forest.fit(X_scaled)
            
            # Train Random Forest (supervised classification)
            if len(set(y)) > 1:
                X_train, X_test, y_train, y_test = train_test_split(
                    X_scaled, y, test_size=0.2, random_state=42, stratify=y
                )
                
                self.random_forest = RandomForestClassifier(
                    n_estimators=100,
                    random_state=42,
                    max_depth=10,
                    class_weight='balanced'
                )
                self.random_forest.fit(X_train, y_train)
                
                # Evaluate model
                y_pred = self.random_forest.predict(X_test)
                logger.info(f"Random Forest Training Results:\n{classification_report(y_test, y_pred)}")
            
            self.is_trained = True
            self._save_models()
            logger.info("Models trained successfully")
            
        except Exception as e:
            logger.error(f"Error training models: {e}")
    
    async def _get_training_data(self) -> List[Dict]:
        """Get training data from database"""
        db = SessionLocal()
        training_data = []
        
        try:
            # Get sessions with associated threats (positive examples)
            threatened_sessions = db.query(VNCSession).join(ThreatLog).all()
            
            for session in threatened_sessions:
                features = self._extract_session_features(session)
                features['is_anomaly'] = 1
                training_data.append(features)
            
            # Get normal sessions (negative examples)
            normal_sessions = db.query(VNCSession).filter(
                ~VNCSession.threats.any()
            ).limit(len(threatened_sessions) * 4).all()  # 4:1 ratio
            
            for session in normal_sessions:
                features = self._extract_session_features(session)
                features['is_anomaly'] = 0
                training_data.append(features)
            
            logger.info(f"Retrieved {len(training_data)} sessions for training")
            
        except Exception as e:
            logger.error(f"Error getting training data: {e}")
        finally:
            db.close()
        
        return training_data
    
    def _extract_session_features(self, session: VNCSession) -> Dict:
        """Extract features from VNC session"""
        duration_minutes = 0
        if session.end_time:
            duration_minutes = (session.end_time - session.start_time).total_seconds() / 60
        elif session.start_time:
            duration_minutes = (datetime.utcnow() - session.start_time).total_seconds() / 60
        
        return {
            'data_transferred': session.data_transferred or 0,
            'session_duration_minutes': max(duration_minutes, 1),  # Avoid zero
            'screenshots_count': session.screenshots_count or 0,
            'clipboard_operations': session.clipboard_operations or 0,
            'file_operations': session.file_operations or 0,
            'packets_sent': session.packets_sent or 0,
            'packets_received': session.packets_received or 0,
            'hour_of_day': session.start_time.hour if session.start_time else 12,
            'day_of_week': session.start_time.weekday() if session.start_time else 0,
            'is_external_ip': 0 if self._is_internal_ip(session.client_ip) else 1
        }
    
    def _prepare_training_data(self, training_data: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare training data for ML models"""
        if not training_data:
            return np.array([]), np.array([])
        
        df = pd.DataFrame(training_data)
        
        # Ensure all required columns exist
        for col in self.feature_columns:
            if col not in df.columns:
                df[col] = 0
        
        X = df[self.feature_columns].values
        y = df.get('is_anomaly', np.zeros(len(df))).values
        
        # Handle any NaN values
        X = np.nan_to_num(X)
        
        return X, y
    
    async def detect_anomaly(self, session_id: int) -> Dict[str, Any]:
        """Detect anomalies in a specific VNC session"""
        if not self.is_trained:
            return {"error": "Models not trained"}
        
        db = SessionLocal()
        try:
            session = db.query(VNCSession).filter_by(id=session_id).first()
            if not session:
                return {"error": "Session not found"}
            
            # Extract features
            features = self._extract_session_features(session)
            X = np.array([[features[col] for col in self.feature_columns]])
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Predict using both models
            isolation_prediction = self.isolation_forest.predict(X_scaled)[0]
            isolation_score = self.isolation_forest.decision_function(X_scaled)[0]
            
            rf_prediction = None
            rf_probability = None
            if self.random_forest:
                rf_prediction = self.random_forest.predict(X_scaled)[0]
                rf_probability = self.random_forest.predict_proba(X_scaled)[0]
            
            # Combine predictions
            is_anomaly = (isolation_prediction == -1) or (rf_prediction == 1 if rf_prediction is not None else False)
            
            # Calculate confidence score
            confidence = self._calculate_confidence(isolation_score, rf_probability)
            
            result = {
                "session_id": session_id,
                "is_anomaly": bool(is_anomaly),
                "confidence": confidence,
                "isolation_forest": {
                    "prediction": "anomaly" if isolation_prediction == -1 else "normal",
                    "score": float(isolation_score)
                },
                "random_forest": {
                    "prediction": "anomaly" if rf_prediction == 1 else "normal",
                    "probability": rf_probability.tolist() if rf_probability is not None else None
                } if rf_prediction is not None else None,
                "features": features,
                "timestamp": datetime.now().isoformat()
            }
            
            # Log high-confidence anomalies as threats
            if is_anomaly and confidence > 0.7:
                await self._log_ml_threat(session, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error detecting anomaly: {e}")
            return {"error": str(e)}
        finally:
            db.close()
    
    def _calculate_confidence(self, isolation_score: float, rf_probability: Optional[np.ndarray]) -> float:
        """Calculate confidence score combining both models"""
        # Normalize isolation forest score (typically between -1 and 1)
        isolation_confidence = max(0, min(1, (1 - abs(isolation_score)) / 2))
        
        if rf_probability is not None:
            rf_confidence = max(rf_probability)  # Max probability from RF
            return (isolation_confidence + rf_confidence) / 2
        else:
            return isolation_confidence
    
    async def _log_ml_threat(self, session: VNCSession, detection_result: Dict):
        """Log ML-detected threat"""
        db = SessionLocal()
        try:
            threat = ThreatLog(
                threat_type="ml_anomaly_detection",
                severity="high" if detection_result["confidence"] > 0.9 else "medium",
                source_ip=session.client_ip,
                description=f"ML anomaly detected with {detection_result['confidence']:.2f} confidence",
                detection_method="machine_learning",
                action_taken="logged",
                session_id=session.id,
                confidence=detection_result["confidence"]
            )
            
            threat.set_metadata({
                "isolation_forest_result": detection_result["isolation_forest"],
                "random_forest_result": detection_result["random_forest"],
                "features": detection_result["features"],
                "ml_timestamp": detection_result["timestamp"]
            })
            
            db.add(threat)
            db.commit()
            
            logger.warning(f"ML threat logged for session {session.id}: confidence {detection_result['confidence']:.2f}")
            
        except Exception as e:
            logger.error(f"Error logging ML threat: {e}")
            db.rollback()
        finally:
            db.close()
    
    async def analyze_recent_traffic(self) -> Dict[str, Any]:
        """Analyze recent traffic using ML models"""
        if not self.is_trained:
            return {"error": "Models not trained"}
        
        db = SessionLocal()
        try:
            # Get recent sessions
            cutoff_time = datetime.utcnow() - timedelta(hours=1)
            recent_sessions = db.query(VNCSession).filter(
                VNCSession.start_time >= cutoff_time
            ).all()
            
            anomalies = []
            for session in recent_sessions:
                detection_result = await self.detect_anomaly(session.id)
                
                if (detection_result.get("is_anomaly") and 
                    detection_result.get("confidence", 0) > 0.5):
                    anomalies.append({
                        "session_id": session.id,
                        "client_ip": session.client_ip,
                        "confidence": detection_result["confidence"],
                        "detection_details": detection_result
                    })
            
            return {
                "analysis_timestamp": datetime.now().isoformat(),
                "sessions_analyzed": len(recent_sessions),
                "anomalies_detected": len(anomalies),
                "anomalies": anomalies
            }
            
        except Exception as e:
            logger.error(f"Error analyzing recent traffic: {e}")
            return {"error": str(e)}
        finally:
            db.close()
    
    def _is_internal_ip(self, ip: str) -> bool:
        """Check if IP is internal"""
        internal_ranges = ['192.168.', '10.', '172.16.', '127.']
        return any(ip.startswith(range_prefix) for range_prefix in internal_ranges)
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about trained models"""
        return {
            "is_trained": self.is_trained,
            "models": {
                "isolation_forest": {
                    "type": "IsolationForest",
                    "trained": self.isolation_forest is not None,
                    "contamination": getattr(self.isolation_forest, 'contamination', None)
                },
                "random_forest": {
                    "type": "RandomForestClassifier", 
                    "trained": self.random_forest is not None,
                    "n_estimators": getattr(self.random_forest, 'n_estimators', None)
                }
            },
            "features": self.feature_columns,
            "model_path": self.model_path
        }