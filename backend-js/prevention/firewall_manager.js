// prevention/firewall_manager.js

/**
 * FirewallManager - lightweight in-memory firewall manager.
 * Replace with OS-level iptables / nft / cloud-provider API for production.
 */

const blocked = new Set();

const FirewallManager = {
  blockIP(ip) {
    if (!ip) throw new Error("No IP provided");
    blocked.add(ip);
    console.log(`FirewallManager: blocked ${ip}`);
    return { ip, blocked: true };
  },

  unblockIP(ip) {
    if (!ip) throw new Error("No IP provided");
    blocked.delete(ip);
    console.log(`FirewallManager: unblocked ${ip}`);
    return { ip, blocked: false };
  },

  isBlocked(ip) {
    return blocked.has(ip);
  },

  getBlockedIPs() {
    return Array.from(blocked);
  },
};

export default FirewallManager;
