const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default detection rules
  const detectionRules = [
    {
      ruleName: 'large_file_transfer',
      ruleType: 'threshold',
      category: 'file_transfer',
      conditions: {
        data_size_mb: { operator: '>', value: 100 },
        time_window_seconds: 300
      },
      thresholdValue: 100.0,
      timeWindow: 300,
      severity: 'high',
      description: 'Detects large file transfers that may indicate data exfiltration',
    },
    {
      ruleName: 'screenshot_spam',
      ruleType: 'threshold',
      category: 'screenshot',
      conditions: {
        screenshot_count: { operator: '>', value: 20 },
        time_window_seconds: 60
      },
      thresholdValue: 20.0,
      timeWindow: 60,
      severity: 'medium',
      description: 'Detects excessive screenshot capturing',
    },
    {
      ruleName: 'clipboard_abuse',
      ruleType: 'threshold',
      category: 'clipboard',
      conditions: {
        clipboard_ops: { operator: '>', value: 50 },
        time_window_seconds: 120
      },
      thresholdValue: 50.0,
      timeWindow: 120,
      severity: 'medium',
      description: 'Detects excessive clipboard operations',
    },
    {
      ruleName: 'unusual_connection_pattern',
      ruleType: 'anomaly',
      category: 'connection',
      conditions: {
        check_geo_location: true,
        check_time_pattern: true,
        anomaly_threshold: 0.8
      },
      severity: 'high',
      description: 'Detects connections from unusual locations or times',
    }
  ];

  for (const rule of detectionRules) {
    await prisma.detectionRule.upsert({
      where: { ruleName: rule.ruleName },
      update: rule,
      create: rule,
    });
  }

  // Create default firewall rules
  const firewallRules = [
    {
      ruleName: 'allow_vnc_internal',
      sourceIp: '192.168.0.0/16',
      destinationPort: '5900-5999',
      protocol: 'tcp',
      action: 'allow',
      priority: 50,
      description: 'Allow VNC connections from internal network',
      autoCreated: false,
    },
    {
      ruleName: 'block_external_vnc',
      sourceIp: '0.0.0.0/0',
      destinationPort: '5900-5999',
      protocol: 'tcp',
      action: 'deny',
      priority: 200,
      description: 'Block VNC connections from external networks',
      autoCreated: false,
    }
  ];

  for (const rule of firewallRules) {
    await prisma.firewallRule.upsert({
      where: { ruleName: rule.ruleName },
      update: rule,
      create: rule,
    });
  }

  // Create initial system metrics
  await prisma.systemMetrics.create({
    data: {
      cpuUsage: 15.5,
      memoryUsage: 42.3,
      diskUsage: 68.7,
      networkIo: 2.1,
      activeConnections: 0,
      bandwidthUtilization: 12.5,
      threatsDetected: 0,
      threatsBlocked: 0,
      falsePositives: 0,
      vncSessionsActive: 0,
      vncDataTransferred: 0.0,
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });