// server.js
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { sequelize } from "./database/models/index.js";
import VNCSession from "./database/models/VNCSession.js";
import ThreatLog from "./database/models/ThreatLog.js";
import SystemMetrics from "./database/models/SystemMetrics.js";

import AnomalyDetector from "./detection/anomaly_detector.js";
import TrafficAnalyzer from "./detection/traffic_analyzer.js";
import FirewallManager from "./prevention/firewall_manager.js";
import VNCMonitor from "./monitoring/vnc_monitor.js";
import AttackSimulator from "./simulation/attack_simulator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));

/** WebSocket setup **/
const wss = new WebSocketServer({ server, path: "/ws" });
const activeSockets = new Set();

wss.on("connection", (ws) => {
  activeSockets.add(ws);
  console.info("WebSocket connected. Active:", activeSockets.size);
  ws.on("message", (msg) => {
    // Simple echo for heartbeat
    try {
      ws.send(`Echo: ${msg}`);
    } catch (err) {
      console.error("WS send error", err);
    }
  });

  ws.on("close", () => {
    activeSockets.delete(ws);
    console.info("WebSocket disconnected. Active:", activeSockets.size);
  });
});

const broadcast = (obj) => {
  const msg = JSON.stringify(obj);
  for (const s of activeSockets) {
    if (s.readyState === 1) {
      s.send(msg);
    }
  }
};

/** Health and basic routes **/
app.get("/", (req, res) => {
  res.json({ message: "VNC Protection Platform API", status: "active" });
});

app.get("/api/health", (req, res) =>
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    components: {
      anomaly_detector: "active",
      traffic_analyzer: "active",
      firewall_manager: "active",
      vnc_monitor: "active",
    },
  })
);

/** Sessions **/
app.get("/api/sessions", async (req, res) => {
  try {
    const sessions = await VNCSession.findAll({ where: { status: "active" } });
    res.json({
      sessions: sessions.map((s) => s.toJSON()),
      count: sessions.length,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

/** Threats **/
app.get("/api/threats", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const threats = await ThreatLog.findAll({
      order: [["timestamp", "DESC"]],
      limit,
    });
    res.json({ threats: threats.map((t) => t.toJSON()), count: threats.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch threats" });
  }
});

/** Metrics **/
app.get("/api/metrics", async (req, res) => {
  try {
    const latest = await SystemMetrics.findOne({
      order: [["timestamp", "DESC"]],
    });
    if (!latest) return res.json({ error: "No metrics available" });
    res.json(latest.toJSON());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

/** Simulate attack */
app.post("/api/simulate-attack", async (req, res) => {
  try {
    const { attack_type, target_ip = "127.0.0.1", sessionId = null } = req.body;
    const result = await AttackSimulator.runAttack({ attack_type, target_ip, sessionId, broadcast });
    // broadcast event to websocket clients
    broadcast({
      type: "attack_simulation",
      attack_type,
      target_ip,
      result,
      timestamp: new Date().toISOString(),
    });
    res.json({ status: "success", attack_type, target_ip, result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: `Failed to simulate attack: ${e.message}` });
  }
});

/** Block / Unblock IP */
app.post("/api/block-ip", (req, res) => {
  try {
    const { ip } = req.body;
    const result = FirewallManager.blockIP(ip);
    broadcast({ type: "ip_blocked", ip, timestamp: new Date().toISOString() });
    res.json({ status: "success", message: `IP ${ip} blocked`, result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: `Failed to block IP: ${e.message}` });
  }
});

app.post("/api/unblock-ip", (req, res) => {
  try {
    const { ip } = req.body;
    const result = FirewallManager.unblockIP(ip);
    broadcast({ type: "ip_unblocked", ip, timestamp: new Date().toISOString() });
    res.json({ status: "success", message: `IP ${ip} unblocked`, result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: `Failed to unblock IP: ${e.message}` });
  }
});

/** Dashboard analytics **/
app.get("/api/analytics/dashboard", async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const threats24h = await ThreatLog.count({ where: { timestamp: { [ThreatLog.sequelize.Op.gte]: last24h } } });
    const threats7d = await ThreatLog.count({ where: { timestamp: { [ThreatLog.sequelize.Op.gte]: last7d } } });
    const activeSessions = await VNCSession.count({ where: { status: "active" } });
    const blockedIps = FirewallManager.getBlockedIPs().length;

    res.json({
      threats_24h: threats24h,
      threats_7d: threats7d,
      active_sessions: activeSessions,
      blocked_ips: blockedIps,
      system_status: "healthy",
      last_updated: now.toISOString(),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

/** Background monitoring task (interval-based) **/
const startMonitoringTask = () => {
  console.info("Starting VNC monitoring background task (interval 10s)");
  setInterval(async () => {
    try {
      await VNCMonitor.checkActiveConnections();
      const anomalyResults = await AnomalyDetector.analyzeRecentTraffic();
      if (anomalyResults && anomalyResults.anomalies?.length) {
        broadcast({ type: "anomaly_detected", anomalies: anomalyResults.anomalies, timestamp: new Date().toISOString() });
      }
    } catch (err) {
      console.error("Error in monitoring task:", err);
    }
  }, 10_000);
};

/** Start server **/
const PORT = process.env.PORT || 8000;
(async () => {
  try {
    await sequelize.sync(); // create tables if missing
    startMonitoringTask();
    server.listen(PORT, () => {
      console.log(`🚀 server listening http://localhost:${PORT}`);
      console.log(`WebSocket path: ws://localhost:${PORT}/ws`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
})();
