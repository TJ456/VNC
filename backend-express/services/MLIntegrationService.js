const axios = require('axios');
const { prisma } = require('../config/database');

class MLIntegrationService {
  constructor() {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
  }

  async analyzeVNCTraffic(sessionData) {
    try {
      const response = await axios.post(`${this.mlServiceUrl}/analyze`, {
        session_data: sessionData,
        analysis_type: 'vnc_traffic'
      });
      return response.data;
    } catch (error) {
      console.error('ML Analysis error:', error.message);
      throw new Error('ML analysis service unavailable');
    }
  }

  async detectAnomalies(metricsData) {
    try {
      const response = await axios.post(`${this.mlServiceUrl}/detect-anomalies`, {
        metrics: metricsData
      });
      return response.data;
    } catch (error) {
      console.error('Anomaly detection error:', error.message);
      return { anomalies: [], risk_score: 0.0 };
    }
  }

  async predictThreat(networkData) {
    try {
      const response = await axios.post(`${this.mlServiceUrl}/predict-threat`, {
        network_data: networkData
      });
      return response.data;
    } catch (error) {
      console.error('Threat prediction error:', error.message);
      return { threat_probability: 0.0, threat_type: 'unknown' };
    }
  }

  async trainModel(trainingData) {
    try {
      const response = await axios.post(`${this.mlServiceUrl}/train`, {
        data: trainingData
      });
      return response.data;
    } catch (error) {
      console.error('Model training error:', error.message);
      throw new Error('Model training failed');
    }
  }

  async getModelStatus() {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/status`);
      return response.data;
    } catch (error) {
      console.error('ML service status error:', error.message);
      return { status: 'unavailable', models: [] };
    }
  }
}

module.exports = new MLIntegrationService();