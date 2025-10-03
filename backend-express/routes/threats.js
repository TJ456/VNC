const express = require('express');
const router = express.Router();

// Get all threats
router.get('/', async (req, res) => {
  try {
    const { prisma } = req;
    const { 
      severity, 
      threat_type, 
      limit = 50, 
      offset = 0,
      start_date,
      end_date 
    } = req.query;
    
    const where = {};
    
    if (severity) {
      where.severity = severity;
    }
    
    if (threat_type) {
      where.threatType = threat_type;
    }
    
    if (start_date || end_date) {
      where.timestamp = {};
      if (start_date) {
        where.timestamp.gte = new Date(start_date);
      }
      if (end_date) {
        where.timestamp.lte = new Date(end_date);
      }
    }
    
    const threats = await prisma.threatLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        session: {
          select: {
            id: true,
            clientIp: true,
            serverIp: true,
            startTime: true
          }
        }
      }
    });
    
    const totalCount = await prisma.threatLog.count({ where });
    
    res.json({
      threats: threats.map(threat => ({
        id: threat.id,
        timestamp: threat.timestamp,
        threat_type: threat.threatType,
        severity: threat.severity,
        confidence: threat.confidence,
        source_ip: threat.sourceIp,
        source_port: threat.sourcePort,
        target_ip: threat.targetIp,
        target_port: threat.targetPort,
        description: threat.description,
        attack_vector: threat.attackVector,
        detection_method: threat.detectionMethod,
        action_taken: threat.actionTaken,
        blocked_automatically: threat.blockedAutomatically,
        session_id: threat.sessionId,
        session: threat.session ? {
          id: threat.session.id,
          client_ip: threat.session.clientIp,
          server_ip: threat.session.serverIp,
          start_time: threat.session.startTime
        } : null,
        metadata: threat.metadata
      })),
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: totalCount > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching threats:', error);
    res.status(500).json({
      error: 'Failed to fetch threats',
      message: error.message
    });
  }
});

// Get threat statistics
router.get('/stats', async (req, res) => {
  try {
    const { prisma } = req;
    const { period = '24h' } = req.query;
    
    let startDate;
    switch (period) {
      case '1h':
        startDate = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }
    
    // Get threat counts by severity
    const severityStats = await prisma.threatLog.groupBy({
      by: ['severity'],
      where: {
        timestamp: {
          gte: startDate
        }
      },
      _count: {
        severity: true
      }
    });
    
    // Get threat counts by type
    const typeStats = await prisma.threatLog.groupBy({
      by: ['threatType'],
      where: {
        timestamp: {
          gte: startDate
        }
      },
      _count: {
        threatType: true
      },
      orderBy: {
        _count: {
          threatType: 'desc'
        }
      },
      take: 10
    });
    
    // Get detection method stats
    const detectionStats = await prisma.threatLog.groupBy({
      by: ['detectionMethod'],
      where: {
        timestamp: {
          gte: startDate
        }
      },
      _count: {
        detectionMethod: true
      }
    });
    
    // Get hourly threat distribution
    const hourlyStats = await prisma.$queryRaw`
      SELECT 
        EXTRACT(hour FROM timestamp) as hour,
        COUNT(*) as count
      FROM threat_logs 
      WHERE timestamp >= ${startDate}
      GROUP BY EXTRACT(hour FROM timestamp)
      ORDER BY hour
    `;
    
    // Total counts
    const totalThreats = await prisma.threatLog.count({
      where: {
        timestamp: { gte: startDate }
      }
    });
    
    const blockedThreats = await prisma.threatLog.count({
      where: {
        timestamp: { gte: startDate },
        blockedAutomatically: true
      }
    });
    
    res.json({
      period,
      start_date: startDate,
      total_threats: totalThreats,
      blocked_threats: blockedThreats,
      block_rate: totalThreats > 0 ? (blockedThreats / totalThreats * 100).toFixed(2) : 0,
      severity_distribution: severityStats.reduce((acc, item) => {
        acc[item.severity] = item._count.severity;
        return acc;
      }, {}),
      type_distribution: typeStats.map(item => ({
        type: item.threatType,
        count: item._count.threatType
      })),
      detection_method_distribution: detectionStats.reduce((acc, item) => {
        acc[item.detectionMethod] = item._count.detectionMethod;
        return acc;
      }, {}),
      hourly_distribution: hourlyStats.map(item => ({
        hour: parseInt(item.hour),
        count: parseInt(item.count)
      }))
    });
  } catch (error) {
    console.error('Error fetching threat statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch threat statistics',
      message: error.message
    });
  }
});

// Get specific threat by ID
router.get('/:id', async (req, res) => {
  try {
    const { prisma } = req;
    const { id } = req.params;
    
    const threat = await prisma.threatLog.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        session: true,
        firewallRules: true
      }
    });
    
    if (!threat) {
      return res.status(404).json({
        error: 'Threat not found'
      });
    }
    
    res.json({
      threat: {
        id: threat.id,
        timestamp: threat.timestamp,
        threat_type: threat.threatType,
        severity: threat.severity,
        confidence: threat.confidence,
        source_ip: threat.sourceIp,
        source_port: threat.sourcePort,
        target_ip: threat.targetIp,
        target_port: threat.targetPort,
        description: threat.description,
        attack_vector: threat.attackVector,
        payload_size: threat.payloadSize,
        detection_method: threat.detectionMethod,
        detector_version: threat.detectorVersion,
        action_taken: threat.actionTaken,
        blocked_automatically: threat.blockedAutomatically,
        manual_review_required: threat.manualReviewRequired,
        metadata: threat.metadata,
        session: threat.session,
        firewall_rules: threat.firewallRules
      }
    });
  } catch (error) {
    console.error('Error fetching threat:', error);
    res.status(500).json({
      error: 'Failed to fetch threat',
      message: error.message
    });
  }
});

module.exports = router;