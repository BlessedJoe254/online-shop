const axios = require('axios');
const config = require('../config/mpesa.config');
const getAuthToken = require('./mpesa.auth');

const initiateSTKPush = async (phone, amount, orderId) => {
  const token = await getAuthToken();
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, -3);
  const password = Buffer.from(
    `${config.businessShortCode}${config.passkey}${timestamp}`
  ).toString('base64');

  const payload = {
    BusinessShortCode: config.businessShortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: config.transactionType,
    Amount: amount,
    PartyA: `254${phone.substring(phone.length - 9)}`,
    PartyB: config.businessShortCode,
    PhoneNumber: `254${phone.substring(phone.length - 9)}`,
    CallBackURL: config.callbackURL,
    AccountReference: `${config.accountReference}_${orderId}`,
    TransactionDesc: config.transactionDesc,
  };

  try {
    const response = await axios.post(
      'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );
    return {
      success: true,
      data: response.data,
      orderId
    };
  } catch (error) {
    console.error('STK Push Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || 'Payment initiation failed');
  }
};

module.exports = initiateSTKPush;