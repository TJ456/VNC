const express = require('express');
const router = express.Router();
const mlController = require('../controllers/mlController');
const { validate, schemas } = require('../middleware');

// ML Analysis routes
router.post('/analyze/:sessionId', mlController.analyzeSession);
router.post('/detect-anomalies', mlController.detectAnomalies);
router.post('/predict-threat', mlController.predictThreat);
router.post('/train', mlController.trainModel);
router.get('/status', mlController.getStatus);

module.exports = router;