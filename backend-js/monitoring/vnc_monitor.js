// monitoring/vnc_monitor.js
import VNCSession from "../database/models/VNCSession.js";
import ThreatLog from "../database/models/ThreatLog.js";

/**
 * VNCMonitor - track sessions and check activity.
 * In a real system this would integrate with packet capture, VNC server hooks, etc.
 */
const VNCMonitor = {
  async checkActiveConnections() {
    // Example: update system metrics or detect long sessions
    const sessions = await VNCSession.findAll({ where: { status: "active" } });
    const now = Date.now();

    for (const s of sessions) {
      // detect extremely long sessions -> log threat
      const started = new Date(s.startTime).getTime();
      const durationMs = now - started;
      if (durationMs > 1000 * 60 * 60 * 4) {
        // longer than 4 hours
        await ThreatLog.create({
          threatType: "LongSession",
          severity: "low",
          sourceIp: s.clientIp,
          description: `Session ${s.id} open for >4 hours`,
          sessionId: s.id,
        });
      }
    }

    // return count for caller use
    return { activeSessions: sessions.length };
  },

  async startSession({ user = "unknown", clientIp = "0.0.0.0", serverIp = "127.0.0.1" } = {}) {
    const session = await VNCSession.create({ user, clientIp, serverIp, status: "active" });
    return session;
  },

  async endSession(sessionId) {
    const s = await VNCSession.findByPk(sessionId);
    if (!s) return null;
    s.endTime = new Date();
    s.status = "closed";
    await s.save();
    return s;
  },
};

export default VNCMonitor;
