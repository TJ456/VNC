import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Analytics() {
  // Mock data for demonstration
  const threatTypeData = {
    labels: ['File Exfiltration', 'Screenshot Spam', 'Clipboard Stealing', 'Large Transfer', 'Credential Harvesting'],
    datasets: [
      {
        label: 'Threat Count',
        data: [12, 8, 15, 6, 4],
        backgroundColor: [
          'rgba(244, 67, 54, 0.8)',
          'rgba(255, 152, 0, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(156, 39, 176, 0.8)',
          'rgba(63, 81, 181, 0.8)',
        ],
      },
    ],
  };

  const severityData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: [5, 15, 25, 10],
        backgroundColor: [
          '#f44336',
          '#ff5722',
          '#ff9800',
          '#4caf50',
        ],
      },
    ],
  };

  const timelineData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Threats Detected',
        data: [2, 1, 5, 8, 6, 3],
        borderColor: 'rgb(244, 67, 54)',
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Threats Blocked',
        data: [1, 1, 4, 7, 5, 2],
        borderColor: 'rgb(76, 175, 80)',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
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
    },
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        Security Analytics
      </Typography>

      <Grid container spacing={3}>
        {/* Threat Types */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Threats by Type
              </Typography>
              <Bar data={threatTypeData} options={chartOptions} />
            </CardContent>
          </Card>
        </Grid>

        {/* Severity Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Threat Severity Distribution
              </Typography>
              <Doughnut data={severityData} options={chartOptions} />
            </CardContent>
          </Card>
        </Grid>

        {/* Timeline */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Threat Detection Timeline (24h)
              </Typography>
              <Line data={timelineData} options={chartOptions} />
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics Summary */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error">
                Total Threats
              </Typography>
              <Typography variant="h3">
                155
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Last 7 days
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
                142
              </Typography>
              <Typography variant="body2" color="textSecondary">
                91.6% success rate
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
                8
              </Typography>
              <Typography variant="body2" color="textSecondary">
                5.2% of detections
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
                2.3s
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Average detection time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Analytics;