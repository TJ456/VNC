const mlService = require('../services/MLIntegrationService');

class MLController {
  async analyzeSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { session_data } = req.body;

      if (!session_data) {
        return res.status(400).json({
          success: false,
          message: 'Session data required'
        });
      }

      const analysis = await mlService.analyzeVNCTraffic(session_data);
      
      res.json({
        success: true,
        data: {
          session_id: sessionId,
          analysis
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async detectAnomalies(req, res) {
    try {
      const { metrics } = req.body;

      if (!metrics) {
        return res.status(400).json({
          success: false,
          message: 'Metrics data required'
        });
      }

      const anomalies = await mlService.detectAnomalies(metrics);
      
      res.json({
        success: true,
        data: anomalies
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async predictThreat(req, res) {
    try {
      const { network_data } = req.body;

      if (!network_data) {
        return res.status(400).json({
          success: false,
          message: 'Network data required'
        });
      }

      const prediction = await mlService.predictThreat(network_data);
      
      res.json({
        success: true,
        data: prediction
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async trainModel(req, res) {
    try {
      const { training_data, model_type } = req.body;

      if (!training_data || !model_type) {
        return res.status(400).json({
          success: false,
          message: 'Training data and model type required'
        });
      }

      const result = await mlService.trainModel({ training_data, model_type });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getStatus(req, res) {
    try {
      const status = await mlService.getModelStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new MLController();