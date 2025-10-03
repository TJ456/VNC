#!/usr/bin/env python3
"""
ML Service API Server for VNC Protection Platform
Provides ML model integration endpoints for Express.js backend
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from datetime import datetime
import logging
from sklearn.ensemble import IsolationForest, RandomForestClassifier
import pickle
import os

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize ML models (mock for now)
try:
    # Simple mock models for demonstration
    anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
    threat_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
    
    # Generate some dummy training data
    dummy_data = np.random.normal(0, 1, (1000, 10))
    dummy_labels = np.random.randint(0, 2, 1000)
    
    anomaly_detector.fit(dummy_data)
    threat_classifier.fit(dummy_data, dummy_labels)
    
    logger.info("ML models initialized successfully")
except Exception as e:
    logger.error(f"Error initializing ML models: {e}")
    anomaly_detector = None
    threat_classifier = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'anomaly_detector': anomaly_detector is not None,
            'traffic_analyzer': traffic_analyzer is not None,
            'attack_simulator': attack_simulator is not None
        }
    })

@app.route('/status', methods=['GET'])
def get_status():
    """Get ML service status and available models"""
    return jsonify({
        'status': 'online',
        'models': [
            {
                'name': 'anomaly_detector',
                'status': 'ready' if anomaly_detector else 'unavailable',
                'type': 'isolation_forest'
            },
            {
                'name': 'threat_classifier',
                'status': 'ready' if threat_classifier else 'unavailable',
                'type': 'random_forest'
            }
        ],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/analyze', methods=['POST'])
def analyze_vnc_traffic():
    """Analyze VNC traffic data"""
    try:
        data = request.get_json()
        session_data = data.get('session_data', {})
        
        if not session_data:
            return jsonify({'error': 'No session data provided'}), 400
        
        # Mock analysis if traffic_analyzer not available
        if not traffic_analyzer:
            return jsonify({
                'risk_score': 0.5,
                'anomaly_score': 0.3,
                'threats': [],
                'status': 'mock_analysis'
            })
        
        # Perform actual analysis
        analysis_result = traffic_analyzer.analyze_session(session_data)
        
        return jsonify({
            'risk_score': analysis_result.get('risk_score', 0.0),
            'anomaly_score': analysis_result.get('anomaly_score', 0.0),
            'threats': analysis_result.get('threats', []),
            'recommendations': analysis_result.get('recommendations', []),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/detect-anomalies', methods=['POST'])
def detect_anomalies():
    """Detect anomalies in system metrics"""
    try:
        data = request.get_json()
        metrics = data.get('metrics', {})
        
        if not metrics:
            return jsonify({'error': 'No metrics provided'}), 400
        
        # Mock detection if anomaly_detector not available
        if not anomaly_detector:
            return jsonify({
                'anomalies': [],
                'risk_score': 0.2,
                'status': 'mock_detection'
            })
        
        # Convert metrics to format expected by anomaly detector
        metrics_array = np.array([list(metrics.values())])
        
        # Detect anomalies
        is_anomaly = anomaly_detector.detect(metrics_array)
        anomaly_score = anomaly_detector.score_samples(metrics_array)[0]
        
        return jsonify({
            'anomalies': ['system_metrics'] if is_anomaly[0] else [],
            'risk_score': float(abs(anomaly_score)),
            'confidence': 0.85 if is_anomaly[0] else 0.95,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Anomaly detection error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/predict-threat', methods=['POST'])
def predict_threat():
    """Predict threat probability from network data"""
    try:
        data = request.get_json()
        network_data = data.get('network_data', {})
        
        if not network_data:
            return jsonify({'error': 'No network data provided'}), 400
        
        # Mock prediction if traffic_analyzer not available
        if not traffic_analyzer:
            return jsonify({
                'threat_probability': 0.3,
                'threat_type': 'unknown',
                'confidence': 0.7,
                'status': 'mock_prediction'
            })
        
        # Perform threat prediction
        prediction = traffic_analyzer.predict_threat(network_data)
        
        return jsonify({
            'threat_probability': prediction.get('probability', 0.0),
            'threat_type': prediction.get('type', 'unknown'),
            'confidence': prediction.get('confidence', 0.0),
            'features': prediction.get('features', {}),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Threat prediction error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/train', methods=['POST'])
def train_model():
    """Train ML models with new data"""
    try:
        data = request.get_json()
        training_data = data.get('data', {})
        model_type = data.get('model_type', 'anomaly')
        
        if not training_data:
            return jsonify({'error': 'No training data provided'}), 400
        
        # Mock training response
        return jsonify({
            'status': 'training_started',
            'model_type': model_type,
            'data_points': len(training_data),
            'estimated_completion': '5 minutes',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Training error: {e}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🤖 Starting ML Service API Server")
    print("================================")
    print(f"🚀 Server will run on http://localhost:5001")
    print(f"🔬 Anomaly Detector: {'✅ Ready' if anomaly_detector else '❌ Unavailable'}")
    print(f"🤖 Threat Classifier: {'✅ Ready' if threat_classifier else '❌ Unavailable'}")
    print("================================")
    
    # Start Flask server
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=True
    )