// pages/api/razorpay/verify-payment.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

type VerifyResponse = {
  success: boolean;
  message: string;
  paymentId?: string;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponse | ErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        error: 'Missing required payment details' 
      });
    }

    // Check if key secret is configured
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ RAZORPAY_KEY_SECRET is not configured');
      return res.status(500).json({ 
        error: 'Payment verification not configured' 
      });
    }

    // Generate signature for verification
    const body_data = razorpay_order_id + '|' + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body_data)
      .digest('hex');

    // Verify signature
    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      console.log('✅ Payment Verified Successfully:', razorpay_payment_id);
      
      // TODO: Update your database here to mark the ride as paid
      // Example:
      // await prisma.ride.update({
      //   where: { orderId: razorpay_order_id },
      //   data: { 
      //     paymentStatus: 'paid',
      //     paymentId: razorpay_payment_id,
      //     paidAt: new Date()
      //   }
      // });

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
      });
    } else {
      console.error('❌ Payment Verification Failed: Invalid signature');
      return res.status(400).json({ 
        error: 'Invalid payment signature' 
      });
    }
  } catch (error: any) {
    console.error('❌ Payment Verification Error:', error);
    return res.status(500).json({
      error: error.message || 'Payment verification failed',
    });
  }
}