import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Block as BlockIcon,

  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { apiService } from '../services/ApiService';

function ThreatMonitoring() {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [, setSelectedThreat] = useState(null);
  const [blockIp, setBlockIp] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadThreats();
    const interval = setInterval(loadThreats, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const loadThreats = async () => {
    try {
      const response = await apiService.getThreats(100);
      setThreats(response.threats || []);
    } catch (error) {
      console.error('Failed to load threats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIp = async () => {
    try {
      const response = await apiService.blockIp(blockIp);
      if (response.success) {
        setMessage({ type: 'success', text: `IP ${blockIp} blocked successfully` });
        setBlockDialogOpen(false);
        setBlockIp('');
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to block IP' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to block IP' });
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const openBlockDialog = (threat) => {
    setSelectedThreat(threat);
    setBlockIp(threat.source_ip);
    setBlockDialogOpen(true);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Threat Monitoring</Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={loadThreats}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detected Threats ({threats.length})
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Source IP</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Action Taken</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {threats.map((threat) => (
                  <TableRow key={threat.id}>
                    <TableCell>{formatTimestamp(threat.timestamp)}</TableCell>
                    <TableCell>{threat.threat_type.replace(/_/g, ' ').toUpperCase()}</TableCell>
                    <TableCell>
                      <Chip
                        label={threat.severity.toUpperCase()}
                        color={getSeverityColor(threat.severity)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{threat.source_ip}</TableCell>
                    <TableCell>
                      <Tooltip title={threat.description}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {threat.description}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{threat.action_taken}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Block IP">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => openBlockDialog(threat)}
                          >
                            <BlockIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => console.log('View details:', threat)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {threats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">
                        No threats detected
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Block IP Dialog */}
      <Dialog open={blockDialogOpen} onClose={() => setBlockDialogOpen(false)}>
        <DialogTitle>Block IP Address</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Block IP address to prevent further attacks from this source.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="IP Address"
            value={blockIp}
            onChange={(e) => setBlockIp(e.target.value)}
            fullWidth
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBlockIp} variant="contained" color="error">
            Block IP
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ThreatMonitoring;