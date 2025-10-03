import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  NetworkCheck as NetworkIcon,
  Notifications as NotificationIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';

function Settings() {
  const [settings, setSettings] = useState({
    realTimeMonitoring: true,
    autoBlocking: true,
    mlDetection: true,
    notifications: true,
    logRetention: 30,
    threatThreshold: 70,
    vpnOnlyAccess: false,
    encryptionRequired: true,
  });

  const [message, setMessage] = useState(null);

  const handleSettingChange = (setting) => (event) => {
    setSettings({
      ...settings,
      [setting]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    });
  };

  const saveSettings = () => {
    // In a real app, this would save to the backend
    setMessage({ type: 'success', text: 'Settings saved successfully!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetSettings = () => {
    setSettings({
      realTimeMonitoring: true,
      autoBlocking: true,
      mlDetection: true,
      notifications: true,
      logRetention: 30,
      threatThreshold: 70,
      vpnOnlyAccess: false,
      encryptionRequired: true,
    });
    setMessage({ type: 'info', text: 'Settings reset to defaults' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        System Settings
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SecurityIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Security Settings</Typography>
              </Box>
              
              <List>
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.realTimeMonitoring}
                        onChange={handleSettingChange('realTimeMonitoring')}
                      />
                    }
                    label="Real-time Monitoring"
                  />
                </ListItem>
                
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoBlocking}
                        onChange={handleSettingChange('autoBlocking')}
                      />
                    }
                    label="Automatic IP Blocking"
                  />
                </ListItem>
                
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.mlDetection}
                        onChange={handleSettingChange('mlDetection')}
                      />
                    }
                    label="ML-based Anomaly Detection"
                  />
                </ListItem>
                
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.encryptionRequired}
                        onChange={handleSettingChange('encryptionRequired')}
                      />
                    }
                    label="Require TLS Encryption"
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <TextField
                label="Threat Score Threshold"
                type="number"
                value={settings.threatThreshold}
                onChange={handleSettingChange('threatThreshold')}
                inputProps={{ min: 0, max: 100 }}
                helperText="Threats above this score trigger alerts"
                fullWidth
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Network Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <NetworkIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Network Settings</Typography>
              </Box>
              
              <List>
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.vpnOnlyAccess}
                        onChange={handleSettingChange('vpnOnlyAccess')}
                      />
                    }
                    label="VPN-only Access"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText
                    primary="Allowed VNC Ports"
                    secondary="5900-5905"
                  />
                  <Chip label="Active" color="success" size="small" />
                </ListItem>
                
                <ListItem>
                  <ListItemText
                    primary="Firewall Rules"
                    secondary="15 active rules"
                  />
                  <Button size="small" variant="outlined">
                    Manage
                  </Button>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <NotificationIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Notifications</Typography>
              </Box>
              
              <List>
                <ListItem>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications}
                        onChange={handleSettingChange('notifications')}
                      />
                    }
                    label="Enable Notifications"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText
                    primary="Email Alerts"
                    secondary="admin@company.com"
                  />
                  <Chip label="Configured" color="success" size="small" />
                </ListItem>
                
                <ListItem>
                  <ListItemText
                    primary="Webhook URL"
                    secondary="https://hooks.slack.com/..."
                  />
                  <Button size="small" variant="outlined">
                    Configure
                  </Button>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Data & Storage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <StorageIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Data & Storage</Typography>
              </Box>
              
              <TextField
                label="Log Retention (days)"
                type="number"
                value={settings.logRetention}
                onChange={handleSettingChange('logRetention')}
                inputProps={{ min: 1, max: 365 }}
                helperText="How long to keep threat logs"
                fullWidth
                sx={{ mb: 2 }}
              />
              
              <List>
                <ListItem>
                  <ListItemText
                    primary="Database Size"
                    secondary="156 MB"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText
                    primary="Total Sessions Logged"
                    secondary="2,347"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText
                    primary="Total Threats Detected"
                    secondary="489"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      ✓
                    </Typography>
                    <Typography variant="body2">
                      VNC Monitor
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      ✓
                    </Typography>
                    <Typography variant="body2">
                      ML Detection
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      ✓
                    </Typography>
                    <Typography variant="body2">
                      Firewall
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      ✓
                    </Typography>
                    <Typography variant="body2">
                      Database
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={saveSettings}
            >
              Save Settings
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="large"
              onClick={resetSettings}
            >
              Reset to Defaults
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Settings;