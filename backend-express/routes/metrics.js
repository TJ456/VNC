const express = require('express');
const router = express.Router();

// Get system metrics
router.get('/', async (req, res) => {
  try {
    const { prisma } = req;
    
    // Get latest metrics
    const latestMetrics = await prisma.systemMetrics.findFirst({
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    if (!latestMetrics) {
      return res.status(404).json({
        error: 'No metrics available'
      });
    }
    
    res.json({
      cpu_usage: latestMetrics.cpuUsage,
      memory_usage: latestMetrics.memoryUsage,
      disk_usage: latestMetrics.diskUsage,
      network_io: latestMetrics.networkIo,
      active_connections: latestMetrics.activeConnections,
      bandwidth_utilization: latestMetrics.bandwidthUtilization,
      threats_detected: latestMetrics.threatsDetected,
      threats_blocked: latestMetrics.threatsBlocked,
      false_positives: latestMetrics.falsePositives,
      vnc_sessions_active: latestMetrics.vncSessionsActive,
      vnc_data_transferred: latestMetrics.vncDataTransferred,
      timestamp: latestMetrics.timestamp
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error.message
    });
  }
});

// Get metrics history
router.get('/history', async (req, res) => {
  try {
    const { prisma } = req;
    const { period = '24h', limit = 100 } = req.query;
    
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
    
    const metrics = await prisma.systemMetrics.findMany({
      where: {
        timestamp: {
          gte: startDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      },
      take: parseInt(limit)
    });
    
    res.json({
      period,
      start_date: startDate,
      metrics: metrics.map(metric => ({
        timestamp: metric.timestamp,
        cpu_usage: metric.cpuUsage,
        memory_usage: metric.memoryUsage,
        network_io: metric.networkIo,
        active_connections: metric.activeConnections,
        threats_detected: metric.threatsDetected,
        threats_blocked: metric.threatsBlocked,
        vnc_sessions_active: metric.vncSessionsActive
      }))
    });
  } catch (error) {
    console.error('Error fetching metrics history:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics history',
      message: error.message
    });
  }
});

module.exports = router;