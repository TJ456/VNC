import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('7d');

  // Fetch analytics data from backend
  const fetchAnalyticsData = async (selectedPeriod = period) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/analytics/comprehensive?period=${selectedPeriod}`);
      setAnalyticsData(response.data);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Handle period change
  const handlePeriodChange = (event) => {
    const newPeriod = event.target.value;
    setPeriod(newPeriod);
    fetchAnalyticsData(newPeriod);
  };

  // Prepare chart data
  const getThreatTypeChartData = () => {
    if (!analyticsData?.threat_types) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Threat Count',
          data: [0],
          backgroundColor: ['rgba(200, 200, 200, 0.5)']
        }]
      };
    }

    const colors = [
      'rgba(244, 67, 54, 0.8)',   // Red
      'rgba(255, 152, 0, 0.8)',   // Orange  
      'rgba(255, 193, 7, 0.8)',   // Yellow
      'rgba(156, 39, 176, 0.8)',  // Purple
      'rgba(63, 81, 181, 0.8)',   // Indigo
      'rgba(76, 175, 80, 0.8)',   // Green
      'rgba(96, 125, 139, 0.8)'   // Blue Grey
    ];

    return {
      labels: analyticsData.threat_types.map(item => item.type.replace('_', ' ').toUpperCase()),
      datasets: [{
        label: 'Threat Count',
        data: analyticsData.threat_types.map(item => item.count),
        backgroundColor: colors.slice(0, analyticsData.threat_types.length),
      }]
    };
  };

  const getSeverityChartData = () => {
    if (!analyticsData?.severity_distribution) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [0],
          backgroundColor: ['rgba(200, 200, 200, 0.5)']
        }]
      };
    }

    const severityColors = {
      'critical': '#f44336',
      'high': '#ff5722',
      'medium': '#ff9800',
      'low': '#4caf50'
    };

    return {
      labels: analyticsData.severity_distribution.map(item => 
        item.severity.charAt(0).toUpperCase() + item.severity.slice(1)
      ),
      datasets: [{
        data: analyticsData.severity_distribution.map(item => item.count),
        backgroundColor: analyticsData.severity_distribution.map(item => 
          severityColors[item.severity.toLowerCase()] || '#9e9e9e'
        ),
      }]
    };
  };

  const getTimelineChartData = () => {
    if (!analyticsData?.timeline) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Threats Detected',
          data: [0],
          borderColor: 'rgb(244, 67, 54)',
          backgroundColor: 'rgba(244, 67, 54, 0.2)'
        }]
      };
    }

    const labels = analyticsData.timeline.map(point => {
      const date = new Date(point.timestamp);
      if (period === '24h' || period === '1h') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Threats Detected',
          data: analyticsData.timeline.map(point => point.threats_detected),
          borderColor: 'rgb(244, 67, 54)',
          backgroundColor: 'rgba(244, 67, 54, 0.2)',
          tension: 0.1,
        },
        {
          label: 'Threats Blocked',
          data: analyticsData.timeline.map(point => point.threats_blocked),
          borderColor: 'rgb(76, 175, 80)',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          tension: 0.1,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" ml={2}>Loading Analytics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Security Analytics
        </Typography>
        
        <FormControl variant="outlined" sx={{ minWidth: 120 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={period}
            onChange={handlePeriodChange}
            label="Time Period"
          >
            <MenuItem value="1h">Last Hour</MenuItem>
            <MenuItem value="24h">Last 24 Hours</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Key Statistics Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error">
                Total Threats
              </Typography>
              <Typography variant="h3">
                {analyticsData?.summary?.total_threats || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {period === '1h' ? 'Last hour' : 
                 period === '24h' ? 'Last 24 hours' :
                 period === '7d' ? 'Last 7 days' : 'Last 30 days'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                Threats Blocked
              </Typography>
              <Typography variant="h3">
                {analyticsData?.summary?.threats_blocked || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {analyticsData?.summary?.success_rate || 0}% success rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                False Positives
              </Typography>
              <Typography variant="h3">
                {analyticsData?.summary?.false_positives || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {analyticsData?.summary?.false_positive_rate || 0}% of detections
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                Response Time
              </Typography>
              <Typography variant="h3">
                {analyticsData?.summary?.average_response_time || 0}s
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Average detection time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Threats by Type
              </Typography>
              <Bar data={getThreatTypeChartData()} options={chartOptions} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Threat Severity Distribution
              </Typography>
              <Doughnut data={getSeverityChartData()} options={chartOptions} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Threat Detection Timeline ({period})
              </Typography>
              <Line data={getTimelineChartData()} options={chartOptions} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={2}>
        <Typography variant="caption" color="textSecondary">
          Last updated: {analyticsData?.last_updated ? new Date(analyticsData.last_updated).toLocaleString() : 'Never'}
        </Typography>
      </Box>
    </Box>
  );
}

export default Analytics;