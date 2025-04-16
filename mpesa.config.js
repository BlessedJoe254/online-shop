module.exports = {
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    businessShortCode: process.env.MPESA_BUSINESS_SHORTCODE,
    passkey: process.env.MPESA_PASSKEY,
    callbackURL: process.env.MPESA_CALLBACK_URL,
    transactionType: 'CustomerPayBillOnline',
    accountReference: 'REHOBOTH_COLLECTIONS',
    transactionDesc: 'Payment for goods'
  };