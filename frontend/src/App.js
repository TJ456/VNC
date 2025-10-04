import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Alert,
  Snackbar,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  NetworkCheck as NetworkIcon,
  Assessment as AnalyticsIcon,
  Settings as SettingsIcon,
  Warning as ThreatIcon,
  AccountTree as BlockchainIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

// Import components
import Dashboard from './pages/Dashboard';
import ThreatMonitoring from './pages/ThreatMonitoring';
import NetworkAnalysis from './pages/NetworkAnalysis';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import BlockchainSecurity from './pages/BlockchainSecurity';
import { WebSocketService } from './services/WebSocketService';

const drawerWidth = 240;

function App() {

  const [currentAlert, setCurrentAlert] = useState(null);
  const [threatCount, setThreatCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Initialize WebSocket connection
    const wsService = new WebSocketService();
    
    wsService.connect('ws://localhost:5000/ws', {
      onMessage: (data) => {
        handleWebSocketMessage(data);
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
      }
    });

    return () => {
      wsService.disconnect();
    };
  }, []);

  const handleWebSocketMessage = (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'attack_simulation':
          setCurrentAlert({
            severity: 'warning',
            message: `Attack simulation: ${message.attack_type} on ${message.target_ip}`
          });
          break;
        
        case 'anomaly_detected':
          setThreatCount(prev => prev + message.anomalies.length);
          setCurrentAlert({
            severity: 'error',
            message: `${message.anomalies.length} anomalies detected!`
          });
          break;
        
        case 'ip_blocked':
          setCurrentAlert({
            severity: 'info',
            message: `IP ${message.ip} has been blocked`
          });
          break;
        
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  const handleCloseAlert = () => {
    setCurrentAlert(null);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { 
      text: 'Threat Monitoring', 
      icon: (
        <Badge badgeContent={threatCount} color="error">
          <ThreatIcon />
        </Badge>
      ), 
      path: '/threats' 
    },
    { text: 'Blockchain Security', icon: <BlockchainIcon />, path: '/blockchain' },
    { text: 'Network Analysis', icon: <NetworkIcon />, path: '/network' },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          VNC Protection
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <SecurityIcon sx={{ mr: 2 }} />
          <Typography variant="h6" noWrap component="div">
            VNC Protection Platform
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/threats" element={<ThreatMonitoring />} />
          <Route path="/blockchain" element={<BlockchainSecurity />} />
          <Route path="/network" element={<NetworkAnalysis />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Box>

      {/* Real-time alerts */}
      <Snackbar
        open={!!currentAlert}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={currentAlert?.severity || 'info'}
          sx={{ width: '100%' }}
        >
          {currentAlert?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;