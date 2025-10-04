import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async getHealth() {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Dashboard data
  async getDashboardData() {
    const response = await this.client.get('/analytics/dashboard');
    return response.data;
  }

  // Sessions
  async getSessions() {
    const response = await this.client.get('/sessions');
    return response.data;
  }

  // Threats
  async getThreats(limit = 50) {
    const response = await this.client.get(`/threats?limit=${limit}`);
    return response.data;
  }

  // System metrics
  async getMetrics() {
    const response = await this.client.get('/metrics');
    return response.data;
  }

  // Attack simulation
  async simulateAttack(attackType, targetIp = '127.0.0.1') {
    const response = await this.client.post('http://localhost:8000/api/simulate-attack', {
      attack_type: attackType,
      target_ip: targetIp
    });
    return response.data;
  }

  // IP blocking
  async blockIp(ip) {
    const response = await this.client.post(`/firewall/block-ip?ip=${ip}`);
    return response.data;
  }

  async unblockIp(ip) {
    const response = await this.client.post('/firewall/unblock-ip', {
      ip: ip
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default ApiService;