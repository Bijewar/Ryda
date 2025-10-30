// ./services/razorpay.service.ts
export const razorpayService = {
  /**
   * Creates a Razorpay Order via your backend API
   */
  async createRazorpayOrder(
    amount: number, 
    clientName: string, 
    clientId: string,
    clientEmail: string,
    clientPhone: string
  ): Promise<{ orderId: string, currency: string, amount: number }> {
    console.log(`[RAZORPAY SERVICE] Creating order for ₹${amount}...`);
    console.log('[RAZORPAY SERVICE] Request data:', { 
      amount, 
      clientName, 
      clientId, 
      clientEmail, 
      clientPhone 
    });
    
    try {
      const response = await fetch('https://ryda.onrender.com/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          clientName,
          clientId,
          clientEmail,
          clientPhone,
        }),
      });

      console.log('[RAZORPAY SERVICE] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error Response:', errorData);
        console.error('❌ Response Status:', response.status);
        throw new Error(errorData.error || 'Failed to create order');
      }

      const data = await response.json();
      console.log('✅ Order created successfully:', data.orderId);
      
      return {
        orderId: data.orderId,
        currency: data.currency,
        amount: data.amount,
      };
    } catch (error: any) {
      console.error('❌ Order creation failed:', error.message);
      console.error('❌ Full error:', error);
      throw new Error(error.message || 'Failed to create Razorpay order');
    }
  },

  /**
   * Verifies the payment on your backend
   */
  async verifyPayment(paymentDetails: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<boolean> {
    console.log('[RAZORPAY SERVICE] Verifying payment...');
    
    try {
      const response = await fetch('https://ryda.onrender.com/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentDetails),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment verification failed');
      }

      const data = await response.json();
      console.log('✅ Payment verified successfully');
      return data.success;
    } catch (error: any) {
      console.error('❌ Payment verification failed:', error.message);
      throw new Error(error.message || 'Failed to verify payment');
    }
  },
};