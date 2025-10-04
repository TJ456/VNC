const express = require('express');
const router = express.Router();

// Get VNC monitoring status
router.get('/monitoring/status', (req, res) => {
  try {
    const { vncMonitor } = req;
    const status = vncMonitor.isRunning;
    const activeSessions = vncMonitor.getActiveSessionsCount();
    const sessionsInfo = vncMonitor.getActiveSessionsInfo();
    
    res.json({
      monitoring: {
        status: status ? 'running' : 'stopped',
        active_sessions: activeSessions,
        sessions: sessionsInfo,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting VNC monitoring status:', error);
    res.status(500).json({
      error: 'Failed to get VNC monitoring status',
      message: error.message
    });
  }
});

// Start VNC monitoring
router.post('/monitoring/start', (req, res) => {
  try {
    const { vncMonitor } = req;
    
    if (vncMonitor.isRunning) {
      return res.json({
        success: true,
        message: 'VNC monitoring is already running',
        monitoring: {
          status: 'running',
          active_sessions: vncMonitor.getActiveSessionsCount()
        }
      });
    }
    
    vncMonitor.start();
    
    res.json({
      success: true,
      message: 'VNC monitoring started successfully',
      monitoring: {
        status: 'running',
        active_sessions: vncMonitor.getActiveSessionsCount()
      }
    });
  } catch (error) {
    console.error('Error starting VNC monitoring:', error);
    res.status(500).json({
      error: 'Failed to start VNC monitoring',
      message: error.message
    });
  }
});

// Stop VNC monitoring
router.post('/monitoring/stop', (req, res) => {
  try {
    const { vncMonitor } = req;
    
    if (!vncMonitor.isRunning) {
      return res.json({
        success: true,
        message: 'VNC monitoring is already stopped',
        monitoring: {
          status: 'stopped',
          active_sessions: 0
        }
      });
    }
    
    vncMonitor.stop();
    
    res.json({
      success: true,
      message: 'VNC monitoring stopped successfully',
      monitoring: {
        status: 'stopped',
        active_sessions: 0
      }
    });
  } catch (error) {
    console.error('Error stopping VNC monitoring:', error);
    res.status(500).json({
      error: 'Failed to stop VNC monitoring',
      message: error.message
    });
  }
});

// Get file integrity service status
router.get('/file-integrity/status', (req, res) => {
  try {
    // Since FileIntegrityService is instantiated in the middleware, we return a general status
    res.json({
      service: {
        name: 'FileIntegrityService',
        status: 'available',
        features: [
          'size_verification',
          'mime_type_checking',
          'content_analysis',
          'extension_checking',
          'blockchain_hash_verification',
          'digital_signature_checking'
        ],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting file integrity service status:', error);
    res.status(500).json({
      error: 'Failed to get file integrity service status',
      message: error.message
    });
  }
});

// Test file integrity verification
router.post('/file-integrity/test', async (req, res) => {
  try {
    const { fileName, fileContent } = req.body;
    
    if (!fileName || !fileContent) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['fileName', 'fileContent']
      });
    }
    
    // Since we don't have direct access to the FileIntegrityService instance here,
    // we return a mock response indicating the endpoint is available
    res.json({
      test: {
        fileName: fileName,
        status: 'endpoint_available',
        message: 'File integrity testing endpoint is available',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error testing file integrity:', error);
    res.status(500).json({
      error: 'Failed to test file integrity',
      message: error.message
    });
  }
});

// Get VNC protocol middleware status
router.get('/protocol/status', (req, res) => {
  try {
    // Return general status of VNC protocol handling
    res.json({
      protocol: {
        middleware: 'VNCProtocolMiddleware',
        status: 'active',
        features: [
          'real_time_protocol_parsing',
          'file_transfer_monitoring',
          'clipboard_monitoring',
          'session_termination',
          'blockchain_integration'
        ],
        configuration: {
          ports: process.env.VNC_PORTS || '5900,5901,5902,5903,5904,5905',
          proxy_enabled: process.env.VNC_PROXY_ENABLED === 'true',
          proxy_port_offset: parseInt(process.env.VNC_PROXY_PORT_OFFSET) || 100
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting VNC protocol status:', error);
    res.status(500).json({
      error: 'Failed to get VNC protocol status',
      message: error.message
    });
  }
});

// Get preventive actions configuration
router.get('/preventive-actions', (req, res) => {
  try {
    const preventiveActions = {
      blockKeyEvent: process.env.BLOCK_KEY_EVENT === 'true',
      blockPointerEvent: process.env.BLOCK_POINTER_EVENT === 'true',
      blockFileTransfer: process.env.BLOCK_FILE_TRANSFER === 'true',
      blockClipboard: process.env.BLOCK_CLIPBOARD === 'true',
      maxDataTransferRate: parseInt(process.env.MAX_DATA_TRANSFER_RATE) || 100,
      maxScreenshotRate: parseInt(process.env.MAX_SCREENSHOT_RATE) || 10,
      maxFileSize: parseInt(process.env.MAX_FILE_TRANSFER_SIZE) || 104857600
    };
    
    res.json({
      preventive_actions: preventiveActions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting preventive actions configuration:', error);
    res.status(500).json({
      error: 'Failed to get preventive actions configuration',
      message: error.message
    });
  }
});

module.exports = router;