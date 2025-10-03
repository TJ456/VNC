const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const { prisma } = req;
    
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get basic system info
    const activeSessionsCount = await prisma.vNCSession.count({
      where: {
        status: 'active'
      }
    });
    
    const recentThreatsCount = await prisma.threatLog.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      components: {
        database: 'active',
        websocket: 'active',
        vnc_monitor: 'active',
        metrics_service: 'active'
      },
      stats: {
        active_sessions: activeSessionsCount,
        recent_threats: recentThreatsCount
      },
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      components: {
        database: 'error',
        websocket: 'unknown',
        vnc_monitor: 'unknown',
        metrics_service: 'unknown'
      }
    });
  }
});

module.exports = router;