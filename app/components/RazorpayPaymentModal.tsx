// ./components/RazorpayPaymentModal.tsx
"use client";

import React, { useEffect, useCallback, useState, useRef } from 'react';

// Define the required props for the modal
interface RazorpayModalProps {
  fare: number;
  clientName: string;
  clientEmail: string | undefined | null;
  clientPhone: string | undefined;
  isPaying: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  // Handler to create the order and return data
  onCreateOrderAndPay: () => Promise<{ orderId: string, currency: string, amount: number } | null>;
}

// Global interface for Razorpay in the window object
declare global {
  interface Window {
    Razorpay: new (options: any) => any;
  }
}

// Function to load the Razorpay SDK script dynamically
const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.getElementById('razorpay-checkout-js');
    if (existingScript) {
      // Script exists, check if Razorpay is available
      if (window.Razorpay) {
        resolve(true);
      } else {
        // Script exists but not loaded yet, wait for it
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => reject(false));
      }
      return;
    }

    // Create new script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.id = 'razorpay-checkout-js';
    
    script.onload = () => {
      // Verify Razorpay is actually available
      if (window.Razorpay) {
        resolve(true);
      } else {
        reject(false);
      }
    };
    
    script.onerror = () => reject(false);
    
    document.body.appendChild(script);
  });
};


export const RazorpayPaymentModal: React.FC<RazorpayModalProps> = ({
  fare,
  clientName,
  clientEmail,
  clientPhone,
  isPaying,
  onClose,
  onPaymentSuccess,
  onPaymentError,
  onCreateOrderAndPay,
}) => {
  // NOTE: You must set this environment variable in your .env file
  const RZ_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasInitialized = useRef(false);

  const openRazorpayCheckout = useCallback(async () => {
    // Prevent multiple calls
    if (hasInitialized.current || isProcessing) {
      return;
    }
    
    hasInitialized.current = true;
    setIsProcessing(true);

    if (!RZ_KEY_ID) {
      const error = 'Razorpay Key ID is missing. Check NEXT_PUBLIC_RAZORPAY_KEY_ID in your .env file.';
      setLoadingError(error);
      onPaymentError(error);
      setIsProcessing(false);
      return;
    }
    
    if (!window.Razorpay) {
      const error = 'Razorpay SDK is not loaded.';
      setLoadingError(error);
      onPaymentError(error);
      setIsProcessing(false);
      return;
    }

    if (!onCreateOrderAndPay) {
      const error = 'Payment handler is not configured.';
      setLoadingError(error);
      onPaymentError(error);
      setIsProcessing(false);
      return;
    }
    
    // 1. Create the Order on the backend via the service
    const orderData = await onCreateOrderAndPay();
    if (!orderData) {
      setIsProcessing(false);
      hasInitialized.current = false;
      return; // Order creation failed, error handled by parent
    }

    // 2. Configure the options for the Razorpay Checkout form
    const options = {
      key: RZ_KEY_ID, 
      amount: orderData.amount, // Amount is in paise
      currency: orderData.currency,
      name: 'Ryda Cab Service',
      description: `Payment for Ride: ${orderData.orderId}`,
      order_id: orderData.orderId,
      handler: async (response: any) => {
        // This is called on successful payment from Razorpay's side
        try {
          console.log('[RAZORPAY SUCCESS] Payment ID:', response.razorpay_payment_id);
          
          // Verify payment on backend
          const verifyResponse = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyResponse.ok && verifyData.success) {
            onPaymentSuccess();
          } else {
            onPaymentError(verifyData.error || 'Payment verification failed.');
          }
        } catch (error: any) {
          console.error('Payment verification error:', error);
          onPaymentError('Payment verification failed on server.');
        } finally {
          setIsProcessing(false);
          hasInitialized.current = false;
        }
      },
      prefill: {
        name: clientName,
        email: clientEmail,
        contact: clientPhone,
      },
      modal: {
        ondismiss: () => {
          // Called when the user closes the modal
          setIsProcessing(false);
          hasInitialized.current = false;
          onClose();
        },
      },
      theme: {
        color: '#FCD34D', // Ryda's amber color
      },
    };

    try {
      // 3. Open the checkout form
      const rz = new window.Razorpay(options);
      rz.open();
    } catch (error) {
      console.error('Error opening Razorpay checkout:', error);
      setLoadingError('Failed to open payment checkout.');
      onPaymentError('Failed to open payment checkout.');
      setIsProcessing(false);
      hasInitialized.current = false;
    }
    
  }, [RZ_KEY_ID, clientName, clientEmail, clientPhone, onClose, onPaymentSuccess, onPaymentError, onCreateOrderAndPay, isProcessing]);


  useEffect(() => {
    let isMounted = true;

    // Load the script first
    loadRazorpayScript()
      .then(() => {
        if (isMounted) {
          console.log('✅ Razorpay SDK loaded successfully');
          setIsScriptLoaded(true);
        }
      })
      .catch(err => {
        if (isMounted) {
          const errorMsg = 'Failed to load Razorpay SDK.';
          setLoadingError(errorMsg);
          onPaymentError(errorMsg);
          console.error('Failed to load Razorpay SDK:', err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onPaymentError]);

  // Only open checkout after script is loaded
  useEffect(() => {
    if (isScriptLoaded && !hasInitialized.current) {
      openRazorpayCheckout();
    }
  }, [isScriptLoaded, openRazorpayCheckout]);

  // Basic modal structure
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm text-center">
        <h2 className="text-xl font-bold mb-4">Pay ₹{fare.toFixed(2)} Online</h2>
        
        {loadingError ? (
          <div className='text-red-600'>
            <i className="ri-error-warning-line text-3xl"></i>
            <p className='mt-2 text-sm'>Error: {loadingError}</p>
          </div>
        ) : !isScriptLoaded ? (
          <div className="text-blue-500 animate-pulse">
            <i className="ri-loader-4-line ri-spin text-3xl"></i>
            <p className="mt-2 text-sm">Loading payment gateway...</p>
          </div>
        ) : isPaying || isProcessing ? (
          <div className="text-blue-500 animate-pulse">
            <i className="ri-loader-4-line ri-spin text-3xl"></i>
            <p className="mt-2 text-sm">Initializing Razorpay checkout...</p>
          </div>
        ) : (
          <div className="text-green-500">
            <i className="ri-check-line text-3xl"></i>
            <p className="mt-2 text-sm">Order created. Checkout window should open automatically.</p>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="mt-6 text-sm text-gray-600 p-2 rounded hover:bg-gray-100"
        >
          Close
        </button>
      </div>
    </div>
  );
};