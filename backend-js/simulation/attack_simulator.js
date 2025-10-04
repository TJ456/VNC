// simulation/attack_simulator.js
import TrafficAnalyzer from "../detection/traffic_analyzer.js";
import ThreatLog from "../database/models/ThreatLog.js";
import FirewallManager from "../prevention/firewall_manager.js";

/**
 * AttackSimulator - runs canned attack scenarios against the system.
 * Each scenario returns a result object and also persists ThreatLog entries.
 *
 * runAttack({ attack_type, target_ip, sessionId, broadcast })
 */
const AttackSimulator = {
  async runAttack({ attack_type = "data_exfiltration", target_ip = "127.0.0.1", sessionId = null, broadcast = null } = {}) {
    const ts = new Date().toISOString();
    if (attack_type === "data_exfiltration") {
      // simulate a large packet stream
      const packet = { size: 6 * 1024 * 1024, srcIp: target_ip, dstIp: "external", payloadEntropy: 8.2 };
      const analysis = TrafficAnalyzer.analyzePacket(packet);

      if (analysis.alerts.length) {
        const t = await ThreatLog.create({
          threatType: "Data Exfiltration",
          severity: "high",
          sourceIp: target_ip,
          description: analysis.alerts.map((a) => a.msg).join("; "),
          actionTaken: "blocked_ip",
          metaInfo: { packet, analysis },
          sessionId,
        });

        FirewallManager.blockIP(target_ip);

        if (broadcast) {
          broadcast({ type: "simulator_threat", threat: t.toJSON(), timestamp: ts });
        }

        return { ok: true, logged: true, action: "blocked", id: t.id };
      }

      return { ok: false, reason: "no alerts" };
    }

    if (attack_type === "brute_force") {
      // simulate many small connection attempts
      const attempts = [];
      for (let i = 0; i < 8; i++) {
        const pkt = { size: 100 + Math.round(Math.random() * 200), srcIp: `${target_ip}`, dstIp: "127.0.0.1", dstPort: 5900, flags: "SYN" };
        const a = TrafficAnalyzer.analyzePacket(pkt);
        attempts.push(a);
      }

      // if many SYNs detected, log
      const threat = await ThreatLog.create({
        threatType: "BruteForce",
        severity: "medium",
        sourceIp: target_ip,
        description: `Multiple connection attempts (${attempts.length})`,
        metaInfo: { attempts },
        actionTaken: "monitor",
        sessionId,
      });

      if (broadcast) broadcast({ type: "simulator_threat", threat: threat.toJSON(), timestamp: ts });
      return { ok: true, logged: true, action: "monitor", id: threat.id };
    }

    return { ok: false, reason: "unknown_attack_type" };
  },
};

export default AttackSimulator;
