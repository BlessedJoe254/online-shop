const axios = require('axios');
const config = require('../config/mpesa.config');

const getAuthToken = async () => {
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
  
  try {
    const response = await axios.get(
      'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('M-Pesa Auth Error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with M-Pesa API');
  }
};

module.exports = getAuthToken;