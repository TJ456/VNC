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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  NetworkCheck as NetworkIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import { apiService } from '../services/ApiService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [threats, setThreats] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const [dashboardRes, sessionsRes, threatsRes, metricsRes] = await Promise.all([
        apiService.getDashboardData(),
        apiService.getSessions(),
        apiService.getThreats(10),
        apiService.getMetrics(),
      ]);

      setDashboardData(dashboardRes);
      setSessions(sessionsRes.sessions || []);
      setThreats(threatsRes.threats || []);
      setMetrics(metricsRes);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadDashboardData();
  };

  const runAttackSimulation = async (attackType) => {
    try {
      await apiService.simulateAttack(attackType);
      // Refresh data after simulation
      setTimeout(loadDashboardData, 2000);
    } catch (err) {
      console.error('Attack simulation failed:', err);
    }
  };

  if (loading && !dashboardData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Chart data for threats over time
  const threatChartData = {
    labels: ['1h ago', '45m', '30m', '15m', 'Now'],
    datasets: [
      {
        label: 'Threats Detected',
        data: [2, 5, 3, 8, threats.length],
        borderColor: 'rgb(244, 67, 54)',
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Threat Detection Timeline',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Security Dashboard
        </Typography>
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

      {/* Key Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SecurityIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Sessions
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.active_sessions || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WarningIcon color="error" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Threats (24h)
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.threats_24h || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BlockIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Blocked IPs
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.blocked_ips || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <NetworkIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    System Status
                  </Typography>
                  <Chip
                    label={dashboardData?.system_status || 'Unknown'}
                    color={dashboardData?.system_status === 'healthy' ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* System Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Performance
              </Typography>
              
              {metrics && (
                <Box>
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">CPU Usage</Typography>
                      <Typography variant="body2">{metrics.cpu_usage?.toFixed(1) || 0}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.cpu_usage || 0}
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Memory Usage</Typography>
                      <Typography variant="body2">{metrics.memory_usage?.toFixed(1) || 0}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.memory_usage || 0}
                      color="secondary"
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Network I/O</Typography>
                      <Typography variant="body2">{metrics.network_io?.toFixed(2) || 0} MB/s</Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Active Connections</Typography>
                      <Typography variant="body2">{metrics.active_connections || 0}</Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Threat Timeline Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Line data={threatChartData} options={chartOptions} />
            </CardContent>
          </Card>
        </Grid>

        {/* Active Sessions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active VNC Sessions
              </Typography>
              
              {sessions.length === 0 ? (
                <Typography color="textSecondary">
                  No active sessions
                </Typography>
              ) : (
                <List dense>
                  {sessions.slice(0, 5).map((session) => (
                    <ListItem key={session.id}>
                      <ListItemIcon>
                        <NetworkIcon color={session.risk_score > 50 ? 'error' : 'primary'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${session.client_ip} → ${session.server_ip}`}
                        secondary={`Risk Score: ${session.risk_score?.toFixed(1) || 0} | Data: ${session.data_transferred?.toFixed(1) || 0} MB`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Threats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Threats
              </Typography>
              
              {threats.length === 0 ? (
                <Typography color="textSecondary">
                  No recent threats detected
                </Typography>
              ) : (
                <List dense>
                  {threats.slice(0, 5).map((threat) => (
                    <ListItem key={threat.id}>
                      <ListItemIcon>
                        <WarningIcon 
                          color={
                            threat.severity === 'critical' ? 'error' :
                            threat.severity === 'high' ? 'error' :
                            threat.severity === 'medium' ? 'warning' : 'info'
                          }
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={threat.threat_type.replace('_', ' ').toUpperCase()}
                        secondary={`${threat.source_ip} | ${threat.severity.toUpperCase()} | ${threat.action_taken}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Attack Simulation */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attack Simulation (Demo)
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Run simulated attacks to test the detection system
              </Typography>
              
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => runAttackSimulation('file_exfiltration')}
                >
                  File Exfiltration
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => runAttackSimulation('screenshot_spam')}
                >
                  Screenshot Spam
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => runAttackSimulation('clipboard_stealing')}
                >
                  Clipboard Stealing
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => runAttackSimulation('large_data_transfer')}
                >
                  Large Data Transfer
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => runAttackSimulation('credential_harvesting')}
                >
                  Credential Harvesting
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;