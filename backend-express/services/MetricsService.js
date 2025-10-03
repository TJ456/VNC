const os = require('os');

class MetricsService {
  constructor(prisma) {
    this.prisma = prisma;
    this.previousNetworkStats = null;
  }
  
  async updateSystemMetrics() {
    try {
      const metrics = await this.collectSystemMetrics();
      
      await this.prisma.systemMetrics.create({
        data: {
          cpuUsage: metrics.cpuUsage,
          memoryUsage: metrics.memoryUsage,
          diskUsage: metrics.diskUsage,
          networkIo: metrics.networkIo,
          activeConnections: metrics.activeConnections,
          bandwidthUtilization: metrics.bandwidthUtilization,
          threatsDetected: metrics.threatsDetected,
          threatsBlocked: metrics.threatsBlocked,
          falsePositives: metrics.falsePositives,
          vncSessionsActive: metrics.vncSessionsActive,
          vncDataTransferred: metrics.vncDataTransferred
        }
      });
      
      return metrics;
    } catch (error) {
      console.error('Error updating system metrics:', error);
      throw error;
    }
  }
  
  async collectSystemMetrics() {
    // Get CPU usage (approximation)
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const cpuUsage = 100 - (totalIdle / totalTick * 100);
    
    // Get memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
    
    // Get network I/O (simplified - would need actual network monitoring)
    const networkIo = Math.random() * 10; // Placeholder
    
    // Get VNC-specific metrics from database
    const [activeSessionsCount, recentThreatsCount, recentBlockedCount] = await Promise.all([
      this.prisma.vNCSession.count({
        where: { status: 'active' }
      }),
      this.prisma.threatLog.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      this.prisma.threatLog.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          blockedAutomatically: true
        }
      })
    ]);
    
    // Get total VNC data transferred
    const totalDataResult = await this.prisma.vNCSession.aggregate({
      _sum: {
        dataTransferred: true
      },
      where: {
        startTime: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    
    return {
      cpuUsage: parseFloat(cpuUsage.toFixed(2)),
      memoryUsage: parseFloat(memoryUsage.toFixed(2)),
      diskUsage: 0, // Would need disk usage calculation
      networkIo: parseFloat(networkIo.toFixed(2)),
      activeConnections: activeSessionsCount,
      bandwidthUtilization: Math.random() * 50, // Placeholder
      threatsDetected: recentThreatsCount,
      threatsBlocked: recentBlockedCount,
      falsePositives: 0, // Would be calculated based on manual reviews
      vncSessionsActive: activeSessionsCount,
      vncDataTransferred: totalDataResult._sum.dataTransferred || 0
    };
  }
  
  async getLatestMetrics() {
    try {
      const latestMetrics = await this.prisma.systemMetrics.findFirst({
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      return latestMetrics;
    } catch (error) {
      console.error('Error fetching latest metrics:', error);
      throw error;
    }
  }
}

module.exports = MetricsService;