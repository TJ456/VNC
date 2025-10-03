import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { apiService } from '../services/ApiService';

function NetworkAnalysis() {
  const [sessions, setSessions] = useState([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    loadNetworkData();
    const interval = setInterval(loadNetworkData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadNetworkData = async () => {
    try {
      const response = await apiService.getSessions();
      setSessions(response.sessions || []);
    } catch (error) {
      console.error('Failed to load network data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskScore) => {
    if (riskScore >= 70) return 'error';
    if (riskScore >= 40) return 'warning';
    return 'success';
  };

  const formatDataTransfer = (mb) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb?.toFixed(2) || 0} MB`;
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Network Analysis
      </Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Active Sessions
              </Typography>
              <Typography variant="h3">
                {sessions.filter(s => s.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                High Risk Sessions
              </Typography>
              <Typography variant="h3">
                {sessions.filter(s => s.risk_score >= 70).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                Total Data Transfer
              </Typography>
              <Typography variant="h3">
                {formatDataTransfer(
                  sessions.reduce((sum, s) => sum + (s.data_transferred || 0), 0)
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            VNC Session Details
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Session ID</TableCell>
                  <TableCell>Client IP</TableCell>
                  <TableCell>Server IP</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Data Transfer</TableCell>
                  <TableCell>Risk Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.id}</TableCell>
                    <TableCell>{session.client_ip}</TableCell>
                    <TableCell>{session.server_ip}</TableCell>
                    <TableCell>
                      {new Date(session.start_time).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={session.status.toUpperCase()}
                        color={session.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDataTransfer(session.data_transferred)}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${session.risk_score?.toFixed(1) || 0}%`}
                        color={getRiskColor(session.risk_score)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {sessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">
                        No active sessions found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

export default NetworkAnalysis;