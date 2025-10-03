const express = require('express');
const router = express.Router();

// Get comprehensive analytics data
router.get('/comprehensive', async (req, res) => {
  try {
    const { prisma } = req;
    const { period = '7d' } = req.query;
    
    const now = new Date();
    let startDate;
    
    // Calculate start date based on period
    switch (period) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get all threats within the period
    const allThreats = await prisma.threatLog.findMany({
      where: {
        timestamp: { gte: startDate }
      },
      include: {
        session: true
      }
    });

    // Calculate total threats
    const totalThreats = allThreats.length;

    // Calculate threats blocked (assuming actionTaken indicates blocking)
    const threatsBlocked = allThreats.filter(threat => 
      threat.actionTaken && 
      (threat.actionTaken.toLowerCase().includes('block') || 
       threat.actionTaken.toLowerCase().includes('deny') ||
       threat.actionTaken.toLowerCase().includes('drop'))
    ).length;

    // Calculate false positives (assuming some manual review system exists)
    // For now, estimate false positives as threats with very low confidence
    const falsePositives = allThreats.filter(threat => 
      threat.confidence && threat.confidence < 0.3
    ).length;

    // Calculate success rate
    const successRate = totalThreats > 0 ? (threatsBlocked / totalThreats * 100) : 0;
    const falsePositiveRate = totalThreats > 0 ? (falsePositives / totalThreats * 100) : 0;

    // Calculate average response time
    const sessionsWithThreats = await prisma.vNCSession.findMany({
      where: {
        threats: {
          some: {
            timestamp: { gte: startDate }
          }
        }
      },
      include: {
        threats: {
          where: {
            timestamp: { gte: startDate }
          },
          orderBy: {
            timestamp: 'asc'
          },
          take: 1
        }
      }
    });

    // Calculate response times
    const responseTimes = sessionsWithThreats
      .filter(session => session.threats.length > 0)
      .map(session => {
        const sessionStart = new Date(session.startTime);
        const firstThreat = new Date(session.threats[0].timestamp);
        return (firstThreat.getTime() - sessionStart.getTime()) / 1000; // in seconds
      })
      .filter(time => time >= 0 && time <= 300); // filter realistic response times (0-5 minutes)

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 2.3; // fallback to default

    // Get threat type distribution
    const threatTypeStats = await prisma.threatLog.groupBy({
      by: ['threatType'],
      where: {
        timestamp: { gte: startDate }
      },
      _count: {
        threatType: true
      },
      orderBy: {
        _count: {
          threatType: 'desc'
        }
      }
    });

    // Get severity distribution
    const severityStats = await prisma.threatLog.groupBy({
      by: ['severity'],
      where: {
        timestamp: { gte: startDate }
      },
      _count: {
        severity: true
      }
    });

    // Get timeline data (hourly for last 24h, daily for longer periods)
    const timelineInterval = period === '24h' || period === '1h' ? 'hour' : 'day';
    const timelineData = await generateTimelineData(prisma, startDate, now, timelineInterval);

    res.json({
      period,
      start_date: startDate.toISOString(),
      end_date: now.toISOString(),
      summary: {
        total_threats: totalThreats,
        threats_blocked: threatsBlocked,
        success_rate: parseFloat(successRate.toFixed(1)),
        false_positives: falsePositives,
        false_positive_rate: parseFloat(falsePositiveRate.toFixed(1)),
        average_response_time: parseFloat(averageResponseTime.toFixed(1))
      },
      threat_types: threatTypeStats.map(stat => ({
        type: stat.threatType,
        count: stat._count.threatType
      })),
      severity_distribution: severityStats.map(stat => ({
        severity: stat.severity,
        count: stat._count.severity
      })),
      timeline: timelineData,
      last_updated: now.toISOString()
    });
  } catch (error) {
    console.error('Error fetching comprehensive analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics data',
      message: error.message
    });
  }
});

// Helper function to generate timeline data
async function generateTimelineData(prisma, startDate, endDate, interval) {
  const timePoints = [];
  const currentTime = new Date(startDate);
  
  // Generate time points based on interval
  while (currentTime < endDate) {
    const nextTime = new Date(currentTime);
    if (interval === 'hour') {
      nextTime.setHours(nextTime.getHours() + 1);
    } else {
      nextTime.setDate(nextTime.getDate() + 1);
    }
    
    // Get threats detected in this time window
    const threatsDetected = await prisma.threatLog.count({
      where: {
        timestamp: {
          gte: currentTime,
          lt: nextTime
        }
      }
    });
    
    // Get threats blocked in this time window
    const threatsBlocked = await prisma.threatLog.count({
      where: {
        timestamp: {
          gte: currentTime,
          lt: nextTime
        },
        actionTaken: {
          contains: 'block',
          mode: 'insensitive'
        }
      }
    });
    
    timePoints.push({
      timestamp: currentTime.toISOString(),
      threats_detected: threatsDetected,
      threats_blocked: threatsBlocked
    });
    
    currentTime.setTime(nextTime.getTime());
  }
  
  return timePoints;
}

// Get dashboard analytics (existing endpoint)
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