# Complete VNC Integration Setup Guide

This guide provides step-by-step instructions for setting up and testing the VNC Protection Platform with TigerVNC and RealVNC.

## Prerequisites

1. Node.js 16+ installed
2. Python 3.8+ installed
3. PostgreSQL database (or SQLite for development)
4. Git installed
5. Administrative privileges for firewall configuration

## Installation Steps

### 1. Clone and Setup the Platform

```bash
# Clone the repository
git clone <repository-url>
cd vnc-protection-platform

# Install backend dependencies
cd backend-express
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install Python dependencies
cd ..
pip install -r requirements.txt

# Create environment configuration
cp backend-express/.env.example backend-express/.env
cp configs/.env.example configs/.env
```

### 2. Database Setup

```bash
# Initialize the database
python database/setup.py

# For Express backend, run Prisma migrations
cd backend-express
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Configure VNC Integration

Edit `backend-express/.env`:

```env
# VNC Configuration
VNC_PORTS=5900,5901,5902
VNC_PROXY_ENABLED=true
VNC_PROXY_PORT_OFFSET=100
VNC_SERVER_HOST=127.0.0.1

# Preventive Actions (set to true for active prevention)
BLOCK_KEY_EVENT=false
BLOCK_POINTER_EVENT=false
BLOCK_FILE_TRANSFER=false
BLOCK_CLIPBOARD=false
MAX_DATA_TRANSFER_RATE=100
MAX_SCREENSHOT_RATE=10
MAX_FILE_TRANSFER_SIZE=104857600
```

## TigerVNC Setup

### Installation

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install tigervnc-standalone-server tigervnc-common
```

#### CentOS/RHEL:
```bash
sudo yum install tigervnc-server
```

#### Windows:
Download from https://tigervnc.org/

### Configuration

1. Set VNC password:
```bash
vncpasswd
```

2. Create xstartup file:
```bash
mkdir -p ~/.vnc
cat > ~/.vnc/xstartup << EOF
#!/bin/sh
xrdb $HOME/.Xresources
startxfce4 &
EOF

chmod +x ~/.vnc/xstartup
```

3. Start TigerVNC server:
```bash
# Start on display :1 (port 5901)
vncserver :1 -geometry 1920x1080 -depth 24

# Start on display :2 (port 5902)
vncserver :2 -geometry 1920x1080 -depth 24
```

## RealVNC Setup

### Installation

#### Linux:
```bash
# Download from https://www.realvnc.com/download/server/
wget https://www.realvnc.com/download/file/vnc.files/VNC-Server-7.0.0-Linux-x64.deb
sudo dpkg -i VNC-Server-7.0.0-Linux-x64.deb
```

#### Windows:
Download from https://www.realvnc.com/download/server/

### Configuration

1. Set VNC password:
```bash
sudo vncpasswd -service
```

2. Configure VNC Server:
```bash
sudo vncserver-x11 -service -host 0.0.0.0 -port 5903
```

## Platform Configuration for VNC Integration

### 1. Update VNC Ports Configuration

Edit `backend-express/.env` to match your VNC server ports:
```env
VNC_PORTS=5901,5902,5903
```

### 2. Enable Active Protocol Interception

To enable active protocol interception, set:
```env
VNC_PROXY_ENABLED=true
VNC_PROXY_PORT_OFFSET=100
```

This will create proxy ports:
- VNC Server on 5901 → Proxy on 6001
- VNC Server on 5902 → Proxy on 6002
- VNC Server on 5903 → Proxy on 6003

### 3. Configure Preventive Actions (Optional)

Enable specific preventive actions:
```env
BLOCK_KEY_EVENT=true
BLOCK_FILE_TRANSFER=true
MAX_DATA_TRANSFER_RATE=50
MAX_SCREENSHOT_RATE=5
```

## Running the Platform

### Start All Services

```bash
# Terminal 1: Start Express Backend
cd backend-express
npm run dev

# Terminal 2: Start Python ML Service
cd ..
python ml_service.py

# Terminal 3: Start React Frontend
cd frontend
npm start
```

Or use the interactive startup script:
```bash
python start_platform.py
```

## Testing with TigerVNC and RealVNC

### 1. Connect Through Proxy Ports

Instead of connecting directly to VNC servers, connect through the proxy ports:

```bash
# Using TigerVNC Viewer
vncviewer localhost:6001  # Connects to proxy for VNC server on 5901
vncviewer localhost:6002  # Connects to proxy for VNC server on 5902

# Using RealVNC Viewer
vncviewer localhost:6003  # Connects to proxy for VNC server on 5903
```

### 2. Monitor Connections

1. Open the dashboard at http://localhost:3000
2. Navigate to the "Active Sessions" panel
3. You should see connections appearing as clients connect through proxy ports

### 3. Test Attack Scenarios

Run attack simulations to test detection capabilities:

```bash
# Test file exfiltration
python simulation/attack_simulator.py file_exfiltration

# Test clipboard stealing
python simulation/attack_simulator.py clipboard_stealing

# Test credential harvesting
python simulation/attack_simulator.py credential_harvesting
```

## Verification Steps

### 1. Passive Monitoring Verification

- Connect VNC clients directly to VNC servers (ports 5901, 5902, 5903)
- Verify sessions appear in the dashboard
- Check that normal activities are classified as low risk

### 2. Active Interception Verification

- Connect VNC clients through proxy ports (6001, 6002, 6003)
- Verify protocol messages are intercepted and analyzed
- Check that the VNC Protocol Middleware logs show interception

### 3. Attack Detection Verification

- Run attack simulations
- Verify threats are detected and logged
- Confirm automatic IP blocking for high-risk threats

### 4. Blockchain Integration Verification

- Check that audit trails are created
- Verify smart contract enforcement actions
- Confirm file integrity verification

## Troubleshooting

### Common Issues

1. **VNC Connections Not Detected**:
   - Verify VNC_PORTS configuration matches actual VNC server ports
   - Check firewall settings to ensure ports are accessible
   - Confirm the platform is running in full mode

2. **Protocol Interception Not Working**:
   - Verify VNC_PROXY_ENABLED is set to true
   - Check that proxy ports are not already in use
   - Ensure clients are connecting to proxy ports, not direct VNC ports

3. **Blockchain Integration Issues**:
   - Verify blockchain services are running
   - Check smart contract addresses in configuration
   - Confirm network connectivity to blockchain nodes

### Logs and Debugging

Check logs for troubleshooting:
```bash
# Backend logs
tail -f backend-express/logs/app.log

# Python service logs
tail -f logs/vnc_protection.log

# Database logs
# Check your PostgreSQL logs
```

## Performance Tuning

### Optimizing Monitoring

1. Adjust monitoring intervals in configs/.env
2. Limit monitored ports to only those in active use
3. Configure appropriate risk thresholds

### Scaling for Production

1. Use dedicated machines for VNC servers and monitoring
2. Implement load balancing for high-traffic environments
3. Configure database connection pooling for better performance

## Security Best Practices

### VNC Server Security

1. Use strong, unique passwords for all VNC servers
2. Enable encryption (TLS) for VNC connections
3. Restrict VNC access to VPN-only connections
4. Regularly update VNC server software

### Platform Security

1. Regularly review threat logs and audit trails
2. Configure appropriate alerting thresholds
3. Maintain whitelist of trusted IP addresses
4. Implement regular retraining of ML models

## Testing with Wireshark

To verify the platform's network monitoring capabilities:

1. Install Wireshark:
```bash
sudo apt install wireshark
```

2. Capture VNC traffic:
```bash
sudo wireshark -i any -f "tcp port 5900-5910"
```

3. Analyze traffic patterns during normal and attack scenarios

## Integration Testing Checklist

- [ ] TigerVNC servers running on configured ports
- [ ] RealVNC servers running on configured ports
- [ ] VNC Protection Platform running with proxy enabled
- [ ] Clients can connect through proxy ports
- [ ] Sessions appear in dashboard
- [ ] Normal activities show low risk scores
- [ ] Attack simulations trigger threat detection
- [ ] File integrity verification works
- [ ] Blockchain audit trails are created
- [ ] Preventive actions block suspicious activities
- [ ] IP blocking works for high-risk threats

By following this comprehensive setup guide, you can successfully integrate TigerVNC and RealVNC with the VNC Protection Platform for complete data exfiltration prevention.