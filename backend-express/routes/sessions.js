const express = require('express');
const router = express.Router();

// Get all VNC sessions
router.get('/', async (req, res) => {
  try {
    const { prisma } = req;
    const { status, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (status) {
      where.status = status;
    }
    
    const sessions = await prisma.vNCSession.findMany({
      where,
      orderBy: {
        startTime: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        threats: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 5
        }
      }
    });
    
    const totalCount = await prisma.vNCSession.count({ where });
    
    res.json({
      sessions: sessions.map(session => ({
        id: session.id,
        client_ip: session.clientIp,
        server_ip: session.serverIp,
        client_port: session.clientPort,
        server_port: session.serverPort,
        start_time: session.startTime,
        end_time: session.endTime,
        status: session.status,
        data_transferred: session.dataTransferred,
        risk_score: session.riskScore,
        anomaly_score: session.anomalyScore,
        threats_count: session.threats.length,
        recent_threats: session.threats.map(threat => ({
          id: threat.id,
          type: threat.threatType,
          severity: threat.severity,
          timestamp: threat.timestamp
        }))
      })),
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: totalCount > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      error: 'Failed to fetch sessions',
      message: error.message
    });
  }
});

// Get specific session by ID
router.get('/:id', async (req, res) => {
  try {
    const { prisma } = req;
    const { id } = req.params;
    
    const session = await prisma.vNCSession.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        threats: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    });
    
    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }
    
    res.json({
      session: {
        id: session.id,
        client_ip: session.clientIp,
        server_ip: session.serverIp,
        client_port: session.clientPort,
        server_port: session.serverPort,
        start_time: session.startTime,
        end_time: session.endTime,
        status: session.status,
        data_transferred: session.dataTransferred,
        packets_sent: session.packetsSent,
        packets_received: session.packetsReceived,
        screenshots_count: session.screenshotsCount,
        clipboard_operations: session.clipboardOperations,
        file_operations: session.fileOperations,
        risk_score: session.riskScore,
        anomaly_score: session.anomalyScore,
        auth_method: session.authMethod,
        user_agent: session.userAgent,
        threats: session.threats.map(threat => ({
          id: threat.id,
          timestamp: threat.timestamp,
          threat_type: threat.threatType,
          severity: threat.severity,
          confidence: threat.confidence,
          description: threat.description,
          action_taken: threat.actionTaken
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      error: 'Failed to fetch session',
      message: error.message
    });
  }
});

// Terminate a session
router.post('/:id/terminate', async (req, res) => {
  try {
    const { prisma, wsService } = req;
    const { id } = req.params;
    const { reason = 'Manual termination' } = req.body;
    
    const session = await prisma.vNCSession.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }
    
    if (session.status !== 'active') {
      return res.status(400).json({
        error: 'Session is not active'
      });
    }
    
    // Update session status
    const updatedSession = await prisma.vNCSession.update({
      where: { id: parseInt(id) },
      data: {
        status: 'terminated',
        endTime: new Date()
      }
    });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        eventType: 'session_terminated',
        actor: 'admin',
        action: 'terminate_session',
        target: `session_${id}`,
        success: true,
        details: {
          session_id: id,
          reason: reason,
          client_ip: session.clientIp
        }
      }
    });
    
    // Broadcast session termination
    wsService.broadcast({
      type: 'session_terminated',
      session_id: parseInt(id),
      client_ip: session.clientIp,
      reason: reason,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Session terminated successfully',
      session: {
        id: updatedSession.id,
        status: updatedSession.status,
        end_time: updatedSession.endTime
      }
    });
  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({
      error: 'Failed to terminate session',
      message: error.message
    });
  }
});

module.exports = router;