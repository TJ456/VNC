const express = require('express');
const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const { prisma } = req;
    
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get threat counts
    const [threats24h, threats7d, activeSessions, blockedIps] = await Promise.all([
      prisma.threatLog.count({
        where: { timestamp: { gte: last24h } }
      }),
      prisma.threatLog.count({
        where: { timestamp: { gte: last7d } }
      }),
      prisma.vNCSession.count({
        where: { status: 'active' }
      }),
      prisma.firewallRule.count({
        where: { 
          isActive: true,
          action: { in: ['deny', 'drop', 'reject'] }
        }
      })
    ]);
    
    res.json({
      threats_24h: threats24h,
      threats_7d: threats7d,
      active_sessions: activeSessions,
      blocked_ips: blockedIps,
      system_status: 'healthy',
      last_updated: now.toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

module.exports = router;