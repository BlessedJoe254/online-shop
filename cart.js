import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartCount,
    clearCart
  } = useCart();
  
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');

  const handleMpesaPayment = async () => {
    if (!phone.match(/^(\+?254|0)?[7]\d{8}$/)) {
      setPaymentMessage('Please enter a valid Kenyan phone number');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setPaymentMessage('Initiating payment...');

    try {
      const response = await fetch('/api/mpesa/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone.replace(/^0/, '254'), // Ensure 254 format
          amount: cartTotal,
          items: cart
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment initiation failed');
      }

      setPaymentStatus('pending');
      setPaymentMessage('Check your phone to complete payment');

      // Poll for payment status
      const pollPaymentStatus = async (orderId) => {
        try {
          const statusResponse = await fetch(`/api/mpesa/status/${orderId}`);
          const statusData = await statusResponse.json();

          if (statusData.paid) {
            setPaymentStatus('success');
            setPaymentMessage('Payment confirmed! Thank you for your order.');
            clearCart();
            router.push('/success');
          } else if (statusResponse.status === 200 && !statusData.paid) {
            // Continue polling
            setTimeout(() => pollPaymentStatus(orderId), 3000);
          } else {
            setPaymentStatus('failed');
            setPaymentMessage('Payment verification failed. Please contact support.');
          }
        } catch (error) {
          setPaymentStatus('failed');
          setPaymentMessage('Error verifying payment. Please check your M-Pesa messages.');
        }
      };

      pollPaymentStatus(data.orderId);
    } catch (error) {
      setPaymentStatus('failed');
      setPaymentMessage(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartCount === 0 && paymentStatus !== 'success') {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Checkout | Rehoboth Collections</title>
      </Head>

      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Your Shopping Cart</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cart.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded" src={item.image} alt={item.name} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        KES {item.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                          className="w-16 border rounded py-1 px-2"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        KES {(item.price * item.quantity).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal ({cartCount} items)</span>
                  <span>KES {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>KES 0.00</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span>KES {cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <h3 className="font-bold mb-3">Payment Method</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="payment"
                      value="mpesa"
                      checked={paymentMethod === 'mpesa'}
                      onChange={() => setPaymentMethod('mpesa')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span>M-Pesa</span>
                  </label>
                </div>
              </div>

              {/* M-Pesa Payment Form */}
              {paymentMethod === 'mpesa' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
                  <h4 className="font-bold mb-2">Pay via M-Pesa</h4>
                  <p className="text-sm mb-3">
                    Complete payment to <strong>Till Number 4261592</strong> (Janet Wanjiru)
                  </p>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">M-Pesa Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. 254712345678 or 0712345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border rounded py-2 px-3"
                      disabled={isProcessing}
                    />
                  </div>
                  
                  <button
                    onClick={handleMpesaPayment}
                    disabled={isProcessing || !phone}
                    className={`w-full py-2 px-4 rounded ${
                      isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isProcessing ? 'Processing...' : 'Pay with M-Pesa'}
                  </button>
                </div>
              )}

              {/* Payment Status Messages */}
              {paymentMessage && (
                <div className={`p-3 rounded ${
                  paymentStatus === 'success' ? 'bg-green-100 text-green-800' :
                  paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {paymentMessage}
                  {paymentStatus === 'pending' && (
                    <div className="mt-2 flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying payment...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}