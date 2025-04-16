const initiateSTKPush = require('../services/mpesa.stkpush');
const Order = require('../models/Order');

exports.initiatePayment = async (req, res) => {
  try {
    const { phone, amount, items } = req.body;
    
    // Create order first
    const order = new Order({
      items,
      totalAmount: amount,
      paymentMethod: 'M-Pesa',
      status: 'pending'
    });
    await order.save();

    // Convert amount to KES if needed
    const amountKES = Math.round(amount * 100); // Assuming USD to KES conversion
    
    const result = await initiateSTKPush(phone, amountKES, order._id);
    
    // Update order with payment request details
    order.paymentRequestId = result.data.CheckoutRequestID;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment request sent to your phone',
      data: {
        orderId: order._id,
        checkoutRequestId: result.data.CheckoutRequestID
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.paymentCallback = async (req, res) => {
  try {
    const callbackData = req.body;
    
    if (callbackData.ResultCode === 0) {
      // Successful payment
      const order = await Order.findOneAndUpdate(
        { paymentRequestId: callbackData.CheckoutRequestID },
        {
          status: 'completed',
          paymentConfirmed: true,
          paymentDetails: {
            mpesaReceiptNumber: callbackData.MpesaReceiptNumber,
            transactionDate: callbackData.TransactionDate,
            phoneNumber: callbackData.PhoneNumber
          }
        },
        { new: true }
      );
      
      console.log(`Order ${order._id} paid successfully`);
      // Here you would typically:
      // 1. Send confirmation email/SMS
      // 2. Update inventory
      // 3. Trigger any post-payment processes
    } else {
      // Failed payment
      await Order.findOneAndUpdate(
        { paymentRequestId: callbackData.CheckoutRequestID },
        {
          status: 'failed',
          paymentDetails: {
            errorMessage: callbackData.ResultDesc
          }
        }
      );
      
      console.warn(`Payment failed: ${callbackData.ResultDesc}`);
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Callback processing error:', error);
    res.status(500).json({ success: false });
  }
};

exports.checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        status: order.status,
        paid: order.paymentConfirmed
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking payment status'
    });
  }
};