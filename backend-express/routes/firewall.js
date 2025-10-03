const express = require('express');
const router = express.Router();

// Block IP address
router.post('/block-ip', async (req, res) => {
  try {
    const { prisma, wsService } = req;
    const { ip } = req.query;
    const { duration_minutes, reason = 'Manual block' } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        error: 'IP parameter is required'
      });
    }
    
    // Check if IP is already blocked
    const existingRule = await prisma.firewallRule.findFirst({
      where: {
        sourceIp: ip,
        action: { in: ['deny', 'drop', 'reject'] },
        isActive: true
      }
    });
    
    if (existingRule) {
      return res.status(409).json({
        error: 'IP is already blocked',
        rule_id: existingRule.id
      });
    }
    
    // Create firewall rule
    const rule = await prisma.firewallRule.create({
      data: {
        ruleName: `manual_block_${ip}_${Date.now()}`,
        sourceIp: ip,
        destinationPort: '5900-5999',
        protocol: 'tcp',
        action: 'deny',
        priority: 10,
        description: reason,
        autoCreated: false,
        expiresAt: duration_minutes ? new Date(Date.now() + duration_minutes * 60 * 1000) : null
      }
    });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        eventType: 'ip_blocked',
        actor: 'admin',
        action: 'block_ip',
        target: ip,
        success: true,
        details: {
          ip: ip,
          reason: reason,
          duration_minutes: duration_minutes,
          rule_id: rule.id
        }
      }
    });
    
    // Broadcast IP block event
    wsService.broadcast({
      type: 'ip_blocked',
      ip: ip,
      rule_id: rule.id,
      reason: reason,
      duration_minutes: duration_minutes,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: `IP ${ip} blocked successfully`,
      rule: {
        id: rule.id,
        ip: ip,
        action: rule.action,
        expires_at: rule.expiresAt,
        created_at: rule.createdAt
      }
    });
  } catch (error) {
    console.error('Error blocking IP:', error);
    res.status(500).json({
      error: 'Failed to block IP',
      message: error.message
    });
  }
});

// Unblock IP address
router.post('/unblock-ip', async (req, res) => {
  try {
    const { prisma, wsService } = req;
    const { ip } = req.query;
    const { reason = 'Manual unblock' } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        error: 'IP parameter is required'
      });
    }
    
    // Find and deactivate blocking rules
    const rules = await prisma.firewallRule.findMany({
      where: {
        sourceIp: ip,
        action: { in: ['deny', 'drop', 'reject'] },
        isActive: true
      }
    });
    
    if (rules.length === 0) {
      return res.status(404).json({
        error: 'No active blocking rules found for this IP'
      });
    }
    
    // Deactivate rules
    await prisma.firewallRule.updateMany({
      where: {
        sourceIp: ip,
        action: { in: ['deny', 'drop', 'reject'] },
        isActive: true
      },
      data: {
        isActive: false,
        description: `${rules[0].description} | ${reason}`
      }
    });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        eventType: 'ip_unblocked',
        actor: 'admin',
        action: 'unblock_ip',
        target: ip,
        success: true,
        details: {
          ip: ip,
          reason: reason,
          rules_deactivated: rules.length
        }
      }
    });
    
    // Broadcast IP unblock event
    wsService.broadcast({
      type: 'ip_unblocked',
      ip: ip,
      reason: reason,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: `IP ${ip} unblocked successfully`,
      rules_deactivated: rules.length
    });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    res.status(500).json({
      error: 'Failed to unblock IP',
      message: error.message
    });
  }
});

// Get firewall rules
router.get('/rules', async (req, res) => {
  try {
    const { prisma } = req;
    const { active_only = 'true', limit = 100, offset = 0 } = req.query;
    
    const where = {};
    if (active_only === 'true') {
      where.isActive = true;
    }
    
    const rules = await prisma.firewallRule.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    const totalCount = await prisma.firewallRule.count({ where });
    
    res.json({
      rules: rules.map(rule => ({
        id: rule.id,
        rule_name: rule.ruleName,
        source_ip: rule.sourceIp,
        source_port: rule.sourcePort,
        destination_ip: rule.destinationIp,
        destination_port: rule.destinationPort,
        protocol: rule.protocol,
        action: rule.action,
        priority: rule.priority,
        is_active: rule.isActive,
        auto_created: rule.autoCreated,
        expires_at: rule.expiresAt,
        description: rule.description,
        created_at: rule.createdAt,
        updated_at: rule.updatedAt
      })),
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: totalCount > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching firewall rules:', error);
    res.status(500).json({
      error: 'Failed to fetch firewall rules',
      message: error.message
    });
  }
});

module.exports = router;