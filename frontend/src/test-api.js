import axios from 'axios';

// Test the API connection
async function testApiConnection() {
  try {
    console.log('Testing API connection...');
    
    // Test direct backend connection
    const backendResponse = await axios.get('http://localhost:5000/api/analytics/dashboard');
    console.log('Direct backend connection successful:', backendResponse.data);
    
    // Test proxied connection
    const proxyResponse = await axios.get('/api/analytics/dashboard');
    console.log('Proxied connection successful:', proxyResponse.data);
    
    return { backend: backendResponse.data, proxy: proxyResponse.data };
  } catch (error) {
    console.error('API connection test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return { error: error.message };
  }
}

export default testApiConnection;