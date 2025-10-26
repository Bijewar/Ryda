// pages/api/razorpay/create-order.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!, // NEVER expose this on client side
});

type OrderResponse = {
  orderId: string;
  currency: string;
  amount: number;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrderResponse | ErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, clientName, clientId, clientEmail, clientPhone } = req.body;

    console.log('📥 Received order request:', { amount, clientName, clientId, clientEmail, clientPhone });

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      console.error('❌ NEXT_PUBLIC_RAZORPAY_KEY_ID is not set');
      return res.status(500).json({ error: 'Razorpay Key ID not configured' });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ RAZORPAY_KEY_SECRET is not set');
      return res.status(500).json({ error: 'Razorpay Key Secret not configured' });
    }

    // Validate input
    if (!amount || amount <= 0) {
      console.error('❌ Invalid amount:', amount);
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!clientName || !clientId) {
      console.error('❌ Missing client information');
      return res.status(400).json({ error: 'Missing required client information' });
    }

    // Convert amount to paise (Razorpay expects smallest currency unit)
    const amountInPaise = Math.round(amount * 100);
    console.log('💰 Amount in paise:', amountInPaise);

    // Create a short receipt (max 40 characters)
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const shortClientId = clientId.substring(0, 15); // First 15 chars of clientId
    const receipt = `rcpt_${shortClientId}_${timestamp}`.substring(0, 40); // Ensure max 40 chars

    console.log('📋 Receipt:', receipt, 'Length:', receipt.length);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt,
      notes: {
        clientName,
        clientEmail: clientEmail || '',
        clientPhone: clientPhone || '',
        clientId,
      },
    });

    console.log('✅ Razorpay Order Created:', order.id);

    return res.status(200).json({
      orderId: order.id,
      currency: order.currency,
      amount: Number(order.amount),
    });
  } catch (error: any) {
    console.error('❌ Razorpay Order Creation Error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      description: error.error?.description,
      code: error.error?.code,
      statusCode: error.statusCode
    });
    return res.status(500).json({
      error: error.error?.description || error.message || 'Failed to create order',
    });
  }
}