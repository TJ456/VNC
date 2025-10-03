const express = require('express');
const router = express.Router();
const AttackSimulator = require('../services/AttackSimulator');

// Simulate attack endpoint
router.post('/', async (req, res) => {
  try {
    const { prisma, wsService } = req;
    const { attack_type, target_ip = '127.0.0.1' } = req.query;
    
    if (!attack_type) {
      return res.status(400).json({
        error: 'attack_type parameter is required',
        available_types: [
          'file_exfiltration',
          'screenshot_spam', 
          'clipboard_stealing',
          'large_data_transfer',
          'credential_harvesting',
          'keystroke_logging',
          'lateral_movement'
        ]
      });
    }
    
    const simulator = new AttackSimulator(prisma, wsService);
    const result = await simulator.runAttack(attack_type, target_ip);
    
    if (result.success) {
      // Broadcast attack simulation event
      wsService.broadcast({
        type: 'attack_simulation',
        attack_type: attack_type,
        target_ip: target_ip,
        result: result.result,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error simulating attack:', error);
    res.status(500).json({
      error: 'Failed to simulate attack',
      message: error.message
    });
  }
});

// Get available attack types
router.get('/types', (req, res) => {
  res.json({
    attack_types: [
      {
        type: 'file_exfiltration',
        description: 'Simulates large file transfers that may indicate data theft',
        severity: 'high',
        estimated_duration: '30-60 seconds'
      },
      {
        type: 'screenshot_spam',
        description: 'Simulates rapid screenshot capturing for surveillance',
        severity: 'medium',
        estimated_duration: '15-30 seconds'
      },
      {
        type: 'clipboard_stealing',
        description: 'Simulates excessive clipboard operations to steal copied data',
        severity: 'medium',
        estimated_duration: '20-40 seconds'
      },
      {
        type: 'large_data_transfer',
        description: 'Simulates massive data exfiltration to external servers',
        severity: 'critical',
        estimated_duration: '45-90 seconds'
      },
      {
        type: 'credential_harvesting',
        description: 'Simulates extraction of stored passwords and keys',
        severity: 'critical',
        estimated_duration: '30-60 seconds'
      },
      {
        type: 'keystroke_logging',
        description: 'Simulates keylogger behavior capturing user input',
        severity: 'high',
        estimated_duration: '60-120 seconds'
      },
      {
        type: 'lateral_movement',
        description: 'Simulates network scanning and penetration attempts',
        severity: 'high',
        estimated_duration: '45-75 seconds'
      }
    ]
  });
});

module.exports = router;