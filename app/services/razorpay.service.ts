// ./services/razorpay.service.ts

/**
 * Razorpay Service — Handles order creation and payment verification
 * for both local and production environments.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"; 
  // 👆 Make sure to set NEXT_PUBLIC_BACKEND_URL in Vercel as:
  // https://your-backend.onrender.com

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
  ): Promise<{ orderId: string; currency: string; amount: number }> {
    console.log(`[RAZORPAY SERVICE] Creating order for ₹${amount}...`);
    console.log("[RAZORPAY SERVICE] Request data:", {
      amount,
      clientName,
      clientId,
      clientEmail,
      clientPhone,
    });

    try {
      const response = await fetch(`${BASE_URL}/api/razorpay/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          clientName,
          clientId,
          clientEmail,
          clientPhone,
        }),
      });

      console.log("[RAZORPAY SERVICE] Response status:", response.status);

      // Handle backend errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API Error Response:", errorData);
        throw new Error(errorData.error || "Failed to create Razorpay order");
      }

      const data = await response.json();

      console.log("✅ Razorpay order created successfully:", data);

      return {
        orderId: data.orderId,
        currency: data.currency,
        amount: data.amount,
      };
    } catch (error: any) {
      console.error("❌ Order creation failed:", error.message);
      throw new Error(error.message || "Failed to create Razorpay order");
    }
  },

  /**
   * Verifies Razorpay Payment via your backend API
   */
  async verifyPayment(paymentDetails: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<boolean> {
    console.log("[RAZORPAY SERVICE] Verifying payment...");

    try {
      const response = await fetch(`${BASE_URL}/api/razorpay/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentDetails),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Verification Error:", errorData);
        throw new Error(errorData.error || "Payment verification failed");
      }

      const data = await response.json();
      console.log("✅ Payment verified successfully:", data);

      return !!data.success;
    } catch (error: any) {
      console.error("❌ Payment verification failed:", error.message);
      throw new Error(error.message || "Failed to verify payment");
    }
  },
};
