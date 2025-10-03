class VNCMonitorService {
  constructor(prisma, wsService) {
    this.prisma = prisma;
    this.wsService = wsService;
    this.isRunning = false;
    this.monitoringInterval = null;
    this.activeSessions = new Map();
  }
  
  start() {
    if (this.isRunning) {
      console.log('VNC Monitor is already running');
      return;
    }
    
    this.isRunning = true;
    console.log('Starting VNC Monitor Service...');
    
    // Start monitoring loop
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkVNCConnections();
      } catch (error) {
        console.error('Error in VNC monitoring:', error);
      }
    }, parseInt(process.env.MONITORING_INTERVAL) || 5000);
  }
  
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    console.log('Stopping VNC Monitor Service...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
  
  async checkVNCConnections() {
    try {
      // Simulate VNC connection detection
      // In a real implementation, this would scan network connections for VNC ports
      const connections = this.simulateVNCConnections();
      
      for (const conn of connections) {
        const sessionKey = `${conn.clientIp}:${conn.clientPort}-${conn.serverIp}:${conn.serverPort}`;
        
        if (!this.activeSessions.has(sessionKey)) {
          // New session detected
          const sessionId = await this.createSession(conn);
          if (sessionId) {
            this.activeSessions.set(sessionKey, {
              sessionId,
              startTime: new Date(),
              lastSeen: new Date()
            });
            
            console.log(`New VNC session detected: ${sessionKey}`);
            
            // Broadcast new session
            this.wsService.broadcast({
              type: 'new_session',
              session: {
                id: sessionId,
                client_ip: conn.clientIp,
                server_ip: conn.serverIp,
                client_port: conn.clientPort,
                server_port: conn.serverPort
              },
              timestamp: new Date().toISOString()
            });
          }
        } else {
          // Update existing session
          const sessionInfo = this.activeSessions.get(sessionKey);
          sessionInfo.lastSeen = new Date();
        }
      }
      
      // Check for terminated sessions
      const currentConnectionKeys = new Set(
        connections.map(conn => `${conn.clientIp}:${conn.clientPort}-${conn.serverIp}:${conn.serverPort}`)
      );
      
      for (const [sessionKey, sessionInfo] of this.activeSessions.entries()) {
        if (!currentConnectionKeys.has(sessionKey)) {
          await this.terminateSession(sessionInfo.sessionId);
          this.activeSessions.delete(sessionKey);
          console.log(`VNC session terminated: ${sessionKey}`);
        }
      }
      
    } catch (error) {
      console.error('Error checking VNC connections:', error);
    }
  }
  
  simulateVNCConnections() {
    // This simulates VNC connection detection
    // In a real implementation, you would use network scanning or system APIs
    const connections = [];
    
    // Randomly create some connections for demonstration
    if (Math.random() > 0.7) { // 30% chance of having active connections
      const connectionCount = Math.floor(Math.random() * 3) + 1; // 1-3 connections
      
      for (let i = 0; i < connectionCount; i++) {
        connections.push({
          clientIp: this.generateRandomIP(),
          clientPort: Math.floor(Math.random() * 10000) + 50000,
          serverIp: '127.0.0.1',
          serverPort: 5900 + i,
          status: 'ESTABLISHED'
        });
      }
    }
    
    return connections;
  }
  
  generateRandomIP() {
    const internalRanges = [
      () => `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`,
      () => `10.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`,
      () => `172.${Math.floor(Math.random() * 16) + 16}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`
    ];
    
    const externalIPs = [
      '203.0.113.5',
      '198.51.100.10',
      '192.0.2.50',
      '185.220.101.5'
    ];
    
    // 80% chance of internal IP, 20% external
    if (Math.random() > 0.2) {
      const rangeGenerator = internalRanges[Math.floor(Math.random() * internalRanges.length)];
      return rangeGenerator();
    } else {
      return externalIPs[Math.floor(Math.random() * externalIPs.length)];
    }
  }
  
  async createSession(connInfo) {
    try {
      const riskScore = this.calculateInitialRiskScore(connInfo.clientIp);
      
      const session = await this.prisma.vNCSession.create({
        data: {
          clientIp: connInfo.clientIp,
          serverIp: connInfo.serverIp,
          clientPort: connInfo.clientPort,
          serverPort: connInfo.serverPort,
          startTime: new Date(),
          status: 'active',
          dataTransferred: 0.0,
          riskScore: riskScore
        }
      });
      
      return session.id;
    } catch (error) {
      console.error('Error creating VNC session:', error);
      return null;
    }
  }
  
  async terminateSession(sessionId) {
    try {
      await this.prisma.vNCSession.update({
        where: { id: sessionId },
        data: {
          status: 'terminated',
          endTime: new Date()
        }
      });
      
      // Broadcast session termination
      this.wsService.broadcast({
        type: 'session_terminated',
        session_id: sessionId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  }
  
  calculateInitialRiskScore(clientIp) {
    let riskScore = 0;
    
    // Check if IP is internal
    if (this.isInternalIP(clientIp)) {
      riskScore += 10; // Lower risk for internal IPs
    } else {
      riskScore += 40; // Higher risk for external IPs
    }
    
    // Check for known suspicious IPs
    const suspiciousIPs = ['203.0.113.5', '198.51.100.10', '185.220.101.5'];
    if (suspiciousIPs.includes(clientIp)) {
      riskScore += 50;
    }
    
    // Add some randomness
    riskScore += Math.random() * 20;
    
    return Math.min(riskScore, 100);
  }
  
  isInternalIP(ip) {
    const internalRanges = [
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^127\./
    ];
    
    return internalRanges.some(range => range.test(ip));
  }
  
  getActiveSessionsCount() {
    return this.activeSessions.size;
  }
  
  getActiveSessionsInfo() {
    const sessions = [];
    for (const [sessionKey, sessionInfo] of this.activeSessions.entries()) {
      sessions.push({
        sessionKey,
        sessionId: sessionInfo.sessionId,
        startTime: sessionInfo.startTime,
        lastSeen: sessionInfo.lastSeen
      });
    }
    return sessions;
  }
}

module.exports = VNCMonitorService;