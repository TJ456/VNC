# Analytics Testing Guide

## Testing the New Functional Analytics Dashboard

The analytics dashboard has been updated to fetch real data from the backend instead of using hardcoded values.

### What Was Changed

#### Backend Changes (\`/backend-express/routes/analytics.js\`)
1. **Added Comprehensive Analytics Endpoint**: `/api/analytics/comprehensive`
2. **Dynamic Period Support**: 1h, 24h, 7d, 30d time periods
3. **Real Data Calculations**:
   - Total threats from database
   - Threats blocked (based on actionTaken field)
   - False positives (threats with confidence < 0.3)
   - Success rate calculation
   - Average response time calculation
   - Timeline data generation

#### Frontend Changes (\`/frontend/src/pages/Analytics.js\`)
1. **Real API Integration**: Fetches data from `/api/analytics/comprehensive`
2. **Dynamic Time Period Selection**: Dropdown to select different time ranges
3. **Loading States**: Shows loading spinner while fetching data
4. **Error Handling**: Displays error messages if API calls fail
5. **Dynamic Chart Data**: All charts now use real backend data
6. **Real-time Updates**: Data updates when time period changes

### Testing Instructions

#### 1. Start the Backend Server
```bash
cd backend-express
npm run dev
```

#### 2. Start the Frontend Server
```bash
cd frontend
npm run dev
```

#### 3. Navigate to Analytics Page
- Open browser to `http://localhost:3000`
- Click on "Analytics" in the navigation menu

#### 4. Test Different Time Periods
- Use the dropdown in top-right to select different periods:
  - Last Hour
  - Last 24 Hours  
  - Last 7 Days
  - Last 30 Days
- Watch the data update dynamically

#### 5. Verify Real Data Display
Check that the following cards show real values from database:

**Total Threats Card:**
- Shows actual count of threats in database for selected period
- Updates when period changes

**Threats Blocked Card:**
- Shows count of threats where actionTaken contains "block", "deny", or "drop"
- Displays calculated success rate percentage

**False Positives Card:**
- Shows count of threats with confidence score < 0.3
- Displays false positive rate percentage

**Response Time Card:**
- Shows calculated average response time in seconds
- Based on time between session start and first threat detection

#### 6. Test Charts
**Threats by Type Chart:**
- Shows real threat types from database
- Bar heights correspond to actual threat counts

**Severity Distribution Chart:**
- Shows real severity distribution (critical, high, medium, low)
- Pie chart sizes match actual data

**Timeline Chart:**
- Shows threats detected and blocked over time
- Time intervals adjust based on selected period (hourly for 1h/24h, daily for 7d/30d)

### API Endpoints Available

#### Get Comprehensive Analytics
```bash
GET /api/analytics/comprehensive?period=7d
```

**Parameters:**
- `period` (optional): `1h`, `24h`, `7d`, `30d` (default: `7d`)

**Response Example:**
```json
{
  "period": "7d",
  "start_date": "2024-01-08T10:30:00.000Z",
  "end_date": "2024-01-15T10:30:00.000Z",
  "summary": {
    "total_threats": 25,
    "threats_blocked": 18,
    "success_rate": 72.0,
    "false_positives": 2,
    "false_positive_rate": 8.0,
    "average_response_time": 3.5
  },
  "threat_types": [
    { "type": "file_exfiltration", "count": 8 },
    { "type": "screenshot_spam", "count": 6 },
    { "type": "clipboard_stealing", "count": 5 }
  ],
  "severity_distribution": [
    { "severity": "critical", "count": 3 },
    { "severity": "high", "count": 8 },
    { "severity": "medium", "count": 10 },
    { "severity": "low", "count": 4 }
  ],
  "timeline": [
    {
      "timestamp": "2024-01-08T10:00:00.000Z",
      "threats_detected": 2,
      "threats_blocked": 1
    }
  ]
}
```

### Database Requirements

The analytics require the following database tables with data:
- `vnc_sessions` - VNC session records
- `threat_logs` - Threat detection records
- `firewall_rules` - Firewall blocking rules

### Troubleshooting

#### No Data Showing
1. Check if backend server is running on port 5000
2. Verify database connection and data exists
3. Check browser console for API errors

#### Charts Not Updating
1. Verify frontend can reach backend API
2. Check network tab for failed requests
3. Ensure time period parameter is being sent correctly

#### Performance Issues
1. Large datasets may cause slow loading - consider pagination
2. Timeline generation is intensive - may need optimization for large periods

### Sample Data

To test with sample data, you can create test records:

```javascript
// Create test VNC session
const session = await prisma.vNCSession.create({
  data: {
    clientIp: '192.168.1.100',
    serverIp: '10.0.0.50',
    status: 'active',
    dataTransferred: 45.5,
    riskScore: 75.0
  }
});

// Create test threat
const threat = await prisma.threatLog.create({
  data: {
    threatType: 'file_exfiltration',
    severity: 'high',
    confidence: 0.85,
    sourceIp: '192.168.1.100',
    description: 'Test threat for analytics',
    detectionMethod: 'test',
    actionTaken: 'blocked',
    sessionId: session.id
  }
});
```

### Success Criteria

✅ **Analytics page loads without hardcoded values**
✅ **Time period dropdown changes data dynamically** 
✅ **All four metric cards show real database values**
✅ **Charts display actual threat data from database**
✅ **Loading states work during API calls**
✅ **Error handling displays when backend is unavailable**
✅ **Response times are calculated from real session data**
✅ **Success rates and percentages are mathematically correct**

The analytics dashboard is now fully functional with real backend data integration!