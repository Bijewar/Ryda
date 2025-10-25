// components/RideCompletion.tsx

import React from 'react';

// Assuming Driver type is imported from './types'
type Driver = any;
type PaymentMethod = 'online' | 'cash';

interface RideCompletionProps {
  driver: Driver;
  fare: number;
  onConfirmPayment: () => void; // Triggers Cash reset or opens Modal
  onOpenOnlinePayment?: () => void;
  onBackToDashboard: () => void; // New prop to reset page state
  isPaying: boolean;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  paymentError: string | null;
}

export const RideCompletion: React.FC<RideCompletionProps> = ({
  driver,
  fare,
  onConfirmPayment,
  onBackToDashboard,
  isPaying,
  paymentMethod,
  setPaymentMethod,
  paymentError,
}) => {
  // Determine button text
  let buttonText = 'Confirm Payment Method';
  if (isPaying) {
    buttonText = 'Processing Online Payment...';
  } else if (paymentMethod === 'cash') {
    buttonText = 'Confirm Cash Payment & Start New Ride';
  } else {
    buttonText = 'Continue to Online Payment';
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl space-y-6 border-t-8 border-green-500">
      <h2 className="text-3xl font-bold text-green-600 flex items-center">
        <i className="ri-check-circle-fill mr-2 text-4xl"></i> Ride Completed!
      </h2>

      {/* Final Fare */}
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <p className="text-lg font-medium text-gray-700">Final Fare Due:</p>
        <span className="text-5xl font-extrabold text-black">
          ${fare.toFixed(2)}
        </span>
      </div>

      {/* Driver Details */}
      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-700">Driver: {driver.name}</h3>
        <p className="text-sm text-gray-500">
          Vehicle: {driver.vehicleType} ({driver.vehicleNumber})
        </p>
      </div>

      {/* Payment Method Selector */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold">
          How would you like to settle the payment?
        </h3>
        <div className="flex space-x-4">
          <button
            onClick={() => setPaymentMethod('online')}
            disabled={isPaying}
            className={`flex-1 p-3 border-2 rounded-lg transition-all ${
              paymentMethod === 'online'
                ? 'bg-amber-100 border-amber-600'
                : 'border-gray-300 hover:border-amber-300'
            }`}
          >
            <i className="ri-bank-card-line mr-2"></i> Online (Card/UPI)
          </button>

          <button
            onClick={() => setPaymentMethod('cash')}
            disabled={isPaying}
            className={`flex-1 p-3 border-2 rounded-lg transition-all ${
              paymentMethod === 'cash'
                ? 'bg-amber-100 border-amber-600'
                : 'border-gray-300 hover:border-amber-300'
            }`}
          >
            <i className="ri-money-line mr-2"></i> Cash to Driver
          </button>
        </div>

        {paymentMethod === 'cash' && (
          <p className="text-sm text-blue-700 p-2 bg-blue-50 rounded-md border-l-4 border-blue-400">
            You confirm you will pay ${fare.toFixed(2)} directly to the driver.
          </p>
        )}
      </div>

      {/* Payment Error */}
      {paymentError && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex items-center">
          <i className="ri-error-warning-line mr-2"></i>
          Payment failed: {paymentError}
        </div>
      )}

      {/* Main Payment Button */}
      <button
        onClick={onConfirmPayment}
        disabled={isPaying}
        className="w-full bg-black text-white py-4 rounded-lg text-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {buttonText}
      </button>

      {/* Back to Dashboard / Start New Ride */}
      <button
        onClick={onBackToDashboard}
        disabled={isPaying}
        className="w-full mt-3 border-2 border-gray-400 text-gray-700 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
      >
        ← Back to Dashboard / Start New Ride
      </button>
    </div>
  );
};
