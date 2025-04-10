import axios from 'axios';

/**
 * Tests the API connection by making a simple request
 * @returns {Promise<boolean>} True if the API is available, false otherwise
 */
export const testApiConnection = async () => {
  try {
    console.log('Testing API connection...');
    const response = await axios.get('/api/matches');
    console.log('API test response:', response.status, response.data);
    return true;
  } catch (error) {
    console.error('API test failed:', error);
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error setting up request:', error.message);
    }
    return false;
  }
}; 