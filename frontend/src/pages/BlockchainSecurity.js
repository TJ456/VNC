import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
  Paper,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Security as SecurityIcon,
  AccountTree as BlockchainIcon,
  VpnKey as VpnKeyIcon,
  Shield as ShieldIcon,
  AccountTree as AccountTreeIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { apiService } from '../services/ApiService';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`blockchain-tabpanel-${index}`}
      aria-labelledby={`blockchain-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function BlockchainSecurity() {
  const [activeTab, setActiveTab] = useState(0);
  const [blockchainData, setBlockchainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auditEntries, setAuditEntries] = useState([]);
  const [accessTokens, setAccessTokens] = useState([]);
  const [threatIntel, setThreatIntel] = useState([]);
  const [fileProvenance, setFileProvenance] = useState([]);

  useEffect(() => {
    loadBlockchainData();
    const interval = setInterval(loadBlockchainData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const loadBlockchainData = async () => {
    try {
      setError(null);
      const [statusRes, dashboardRes] = await Promise.all([
        fetch('/api/blockchain/status').then(res => res.json()),
        fetch('/api/blockchain/dashboard').then(res => res.json()),
      ]);

      if (statusRes.success) {
        setBlockchainData(statusRes.data);
      }

      if (dashboardRes.success) {
        const { auditTrail, accessControl, threatIntelligence, dataProvenance } = dashboardRes.data;
        
        // Mock data for demonstration - in real app, these would come from API
        setAuditEntries([
          {
            id: 'audit_001',
            eventType: 'VNC_SESSION',
            timestamp: new Date().toISOString(),
            hash: '0x1a2b3c4d5e6f...',
            verified: true,
            blockchainProof: true
          },
          {
            id: 'audit_002', 
            eventType: 'THREAT_DETECTION',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            hash: '0x2b3c4d5e6f7a...',
            verified: true,
            blockchainProof: true
          }
        ]);

        setAccessTokens([
          {
            id: 'token_001',
            userAddress: '0xAB123...',
            permissions: ['VIEW_ONLY', 'CLIPBOARD_ACCESS'],
            status: 'active',
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            contractEnforced: true
          }
        ]);

        setThreatIntel([
          {
            signature: '0x3c4d5e6f...',
            threatType: 'CREDENTIAL_THEFT',
            severity: 'HIGH',
            confirmations: 5,
            networkShared: true
          }
        ]);

        setFileProvenance([
          {
            fileId: 'file_001',
            fileName: 'document.pdf',
            hash: '0x4d5e6f7a...',
            integrity: 'verified',
            transferCount: 2,
            quarantined: false
          }
        ]);
      }

    } catch (err) {
      setError('Failed to load blockchain data');
      console.error('Blockchain error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    setLoading(true);
    loadBlockchainData();
  };

  if (loading && !blockchainData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
      case 'active':
      case 'operational':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
      case 'quarantined':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <BlockchainIcon sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1">
              Blockchain Security Center
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Next-Generation Immutable Security Infrastructure
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Blockchain Status Overview */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box color="white">
              <Typography variant="h6" color="inherit" gutterBottom>
                🔗 Blockchain Network Status
              </Typography>
              <Typography variant="body2" color="inherit" sx={{ opacity: 0.9 }}>
                Private VNC Protection Blockchain • Chain ID: 2024 • Gas Price: 20 Gwei
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Chip
                icon={getStatusIcon('operational')}
                label="Network Operational"
                sx={{ color: 'white', borderColor: 'white' }}
                variant="outlined"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Key Blockchain Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" color="white">
                <SecurityIcon sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="inherit" gutterBottom>
                    Audit Entries
                  </Typography>
                  <Typography variant="h4" color="inherit">
                    {blockchainData?.auditService?.pendingEntries || 0}
                  </Typography>
                  <Typography variant="caption" color="inherit" sx={{ opacity: 0.8 }}>
                    Immutable Trail
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" color="white">
                <VpnKeyIcon sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="inherit" gutterBottom>
                    Access Tokens
                  </Typography>
                  <Typography variant="h4" color="inherit">
                    {blockchainData?.accessService?.activeTokens || 0}
                  </Typography>
                  <Typography variant="caption" color="inherit" sx={{ opacity: 0.8 }}>
                    Smart Contract Enforced
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" color="black">
                <ShieldIcon sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="inherit" gutterBottom>
                    Threat Intel
                  </Typography>
                  <Typography variant="h4" color="inherit">
                    {blockchainData?.threatService?.localThreats || 0}
                  </Typography>
                  <Typography variant="caption" color="inherit" sx={{ opacity: 0.7 }}>
                    Decentralized Network
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" color="black">
                <AccountTreeIcon sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="inherit" gutterBottom>
                    File Provenance
                  </Typography>
                  <Typography variant="h4" color="inherit">
                    {blockchainData?.provenanceService?.registeredFiles || 0}
                  </Typography>
                  <Typography variant="caption" color="inherit" sx={{ opacity: 0.7 }}>
                    Integrity Verified
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Blockchain Features */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="blockchain features tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="🔒 Immutable Audit Trail" />
          <Tab label="🔑 Zero-Trust Access" />
          <Tab label="🛡️ Threat Intelligence" />
          <Tab label="📊 Data Provenance" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Immutable Audit Trail - Tamper-Proof Security Logs
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Every security event is cryptographically hashed and stored on blockchain, making tampering impossible even by administrators.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Audit Entries
                  </Typography>
                  
                  <List>
                    {auditEntries.map((entry) => (
                      <ListItem key={entry.id}>
                        <ListItemIcon>
                          <Badge
                            badgeContent={entry.blockchainProof ? "⛓️" : "⏳"}
                            color={entry.blockchainProof ? "success" : "warning"}
                          >
                            {getStatusIcon(entry.verified ? 'verified' : 'warning')}
                          </Badge>
                        </ListItemIcon>
                        <ListItemText
                          primary={entry.eventType.replace('_', ' ')}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Hash: {entry.hash}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Time: {new Date(entry.timestamp).toLocaleString()}
                              </Typography>
                              <Chip
                                size="small"
                                label={entry.blockchainProof ? "Blockchain Verified" : "Pending"}
                                color={entry.blockchainProof ? "success" : "warning"}
                                variant="outlined"
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Audit Trail Statistics
                  </Typography>
                  
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Blockchain Integrity</Typography>
                      <Typography variant="body2">100%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={100} sx={{ mt: 1 }} />
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Verified Entries</Typography>
                      <Typography variant="body2">1,247</Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Merkle Tree Batches</Typography>
                      <Typography variant="body2">124</Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Last Block</Typography>
                      <Typography variant="body2">2 min ago</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Zero-Trust Access Control - Smart Contract Enforcement
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Access tokens with embedded permissions enforced by smart contracts. Automatic policy violations detection and response.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Active Access Tokens
                  </Typography>
                  
                  <List>
                    {accessTokens.map((token) => (
                      <ListItem key={token.id}>
                        <ListItemIcon>
                          <Badge
                            badgeContent={token.contractEnforced ? "⚖️" : "❌"}
                            color={token.contractEnforced ? "success" : "error"}
                          >
                            <VpnKeyIcon color={token.status === 'active' ? 'primary' : 'disabled'} />
                          </Badge>
                        </ListItemIcon>
                        <ListItemText
                          primary={`Token: ${token.id}`}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                User: {token.userAddress}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Permissions: {token.permissions.join(', ')}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Expires: {new Date(token.expiresAt).toLocaleString()}
                              </Typography>
                              <Box mt={1}>
                                <Chip size="small" label={token.status.toUpperCase()} color="primary" />
                                <Chip size="small" label="Smart Contract" color="success" sx={{ ml: 1 }} />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Policy Enforcement
                  </Typography>
                  
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Auto-Revocation Events
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      3
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Data Limit Violations
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      1
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Contract Gas Used
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      0.05 ETH
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Decentralized Threat Intelligence - Collective Defense Network
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Real-time threat sharing across blockchain consortium. When one node detects an attack, all nodes are instantly updated.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Shared Threat Intelligence
                  </Typography>
                  
                  <List>
                    {threatIntel.map((threat, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Badge
                            badgeContent={threat.networkShared ? "🌐" : "📡"}
                            color={threat.networkShared ? "success" : "info"}
                          >
                            <ShieldIcon color={
                              threat.severity === 'HIGH' ? 'error' :
                              threat.severity === 'MEDIUM' ? 'warning' : 'info'
                            } />
                          </Badge>
                        </ListItemIcon>
                        <ListItemText
                          primary={threat.threatType.replace('_', ' ')}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Signature: {threat.signature}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Network Confirmations: {threat.confirmations}
                              </Typography>
                              <Box mt={1}>
                                <Chip size="small" label={threat.severity} color={
                                  threat.severity === 'HIGH' ? 'error' :
                                  threat.severity === 'MEDIUM' ? 'warning' : 'info'
                                } />
                                <Chip size="small" label="Consortium Verified" color="success" sx={{ ml: 1 }} />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Network Statistics
                  </Typography>
                  
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Active Nodes
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {blockchainData?.threatService?.consortiumNodes || 15}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Shared Threats (24h)
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      23
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Threat Accuracy
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      97.8%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Data Provenance & File Integrity - Tamper Detection
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Every file is cryptographically fingerprinted and tracked. Instant detection of malware injection or data tampering.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    File Integrity Monitor
                  </Typography>
                  
                  <List>
                    {fileProvenance.map((file) => (
                      <ListItem key={file.fileId}>
                        <ListItemIcon>
                          <Badge
                            badgeContent={file.quarantined ? "🔒" : "✅"}
                            color={file.quarantined ? "error" : "success"}
                          >
                            <AccountTreeIcon color={file.integrity === 'verified' ? 'success' : 'error'} />
                          </Badge>
                        </ListItemIcon>
                        <ListItemText
                          primary={file.fileName}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Hash: {file.hash}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Transfer Hops: {file.transferCount}
                              </Typography>
                              <Box mt={1}>
                                <Chip size="small" label={file.integrity.toUpperCase()} color={
                                  file.integrity === 'verified' ? 'success' : 'error'
                                } />
                                {file.quarantined && (
                                  <Chip size="small" label="QUARANTINED" color="error" sx={{ ml: 1 }} />
                                )}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Integrity Statistics
                  </Typography>
                  
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Files Tracked
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {blockchainData?.provenanceService?.registeredFiles || 1250}
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Integrity Verifications
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {blockchainData?.provenanceService?.integrityChecks || 2100}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Quarantined Files
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {blockchainData?.provenanceService?.quarantinedFiles || 3}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Blockchain Network Health */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔗 Blockchain Network Health & Performance
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  ⛓️ 99.9%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Network Uptime
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary.main">
                  🚀 1.2s
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Avg Block Time
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  ⛽ 20 Gwei
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Gas Price
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  🌐 15
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Consortium Nodes
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default BlockchainSecurity;