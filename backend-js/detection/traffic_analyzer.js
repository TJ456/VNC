// detection/traffic_analyzer.js

/**
 * TrafficAnalyzer - simple analyzer for VNC-like traffic
 * Returns object with analysis results
 */
const TrafficAnalyzer = {
  analyzePacket(packet = {}) {
    // packet { size, srcIp, dstIp, flags, duration, payloadEntropy }
    const alerts = [];

    if (packet.size && packet.size > 10 * 1024 * 1024) {
      alerts.push({ type: "large_transfer", msg: `Large transfer ${packet.size} bytes` });
    }

    if (packet.payloadEntropy && packet.payloadEntropy > 7.5) {
      alerts.push({ type: "high_entropy", msg: "High payload entropy (likely exfiltration/encoded)" });
    }

    // suspicious port usage example
    if (packet.dstPort && (packet.dstPort === 5900 || packet.dstPort === 5901) && packet.flags === "SYN") {
      alerts.push({ type: "vnc_connection", msg: "New VNC connection attempt" });
    }

    return { alerts, packet };
  },
};

export default TrafficAnalyzer;
