// detection/anomaly_detector.js
import ThreatLog from "../database/models/ThreatLog.js";

/**
 * Lightweight anomaly detector.
 * Replace heuristics here with ML model or statistical checks later.
 */
const AnomalyDetector = {
  async analyzeRecentTraffic() {
    // Example heuristic: check newest SystemMetrics for high CPU / network
    // For demo we return a dummy anomaly sometimes.
    const chance = Math.random();
    if (chance > 0.9) {
      const anomaly = {
        id: `anom-${Date.now()}`,
        reason: "Unusual traffic pattern",
        score: 0.85,
      };
      // persist detection
      await ThreatLog.create({
        threatType: "Anomaly",
        severity: "medium",
        description: `Detected anomaly: ${anomaly.reason}`,
        metaInfo: anomaly,
      });
      return { anomalies: [anomaly] };
    }
    return { anomalies: [] };
  },

  // simple function to analyze a traffic sample
  analyzeSample(sample) {
    const anomalies = [];
    if (sample.cpuUsage && sample.cpuUsage > 85) anomalies.push({ reason: "High CPU", score: 0.9 });
    if (sample.packetSize && sample.packetSize > 5 * 1024 * 1024) anomalies.push({ reason: "Large packet", score: 0.75 });
    return anomalies;
  },
};

export default AnomalyDetector;
