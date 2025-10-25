// ./components/RideSummary.tsx
"use client";

import React from 'react';
import { Driver } from '../types';

interface RideSummaryProps {
  driver: Driver;
  fare: number;
  paymentMethod: 'card' | 'upi' | 'cash';
  pickupAddress: string;
  destinationAddress: string;
  duration?: string;
  distance?: string;
  onNewRide: () => void;
  onViewHistory: () => void;
}

export const RideSummary: React.FC<RideSummaryProps> = ({
  driver,
  fare,
  paymentMethod,
  pickupAddress,
  destinationAddress,
  duration = '25 mins',
  distance = '5.2 km',
  onNewRide,
  onViewHistory,
}) => {
  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <i className="ri-bank-card-line text-blue-500"></i>;
      case 'upi':
        return <i className="ri-smartphone-line text-green-500"></i>;
      case 'cash':
        return <i className="ri-money-dollar-circle-line text-amber-500"></i>;
      default:
        return <i className="ri-wallet-line text-gray-500"></i>;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'card':
        return 'Paid via Card';
      case 'upi':
        return 'Paid via UPI';
      case 'cash':
        return 'Paid via Cash';
      default:
        return 'Payment Completed';
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg">
      {/* Success Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-3">
          <i className="ri-check-line text-white text-3xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Ride Completed!</h2>
        <p className="text-gray-600 mt-1">Thank you for choosing Ryda</p>
      </div>

      {/* Driver Info */}
      <div className="bg-white p-4 rounded-lg mb-4">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
            <i className="ri-user-line text-gray-600 text-lg"></i>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">{driver.name}</p>
            <p className="text-sm text-gray-600">{driver.vehicleType}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <i className="ri-star-fill text-yellow-400 text-sm"></i>
              <span className="font-semibold text-gray-800">{driver.rating}</span>
            </div>
            <p className="text-xs text-gray-500">{driver.vehicleNumber}</p>
          </div>
        </div>

        {/* Route Info */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="w-0.5 h-8 bg-gray-300 my-1"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-semibold text-gray-800">Pickup:</span> {pickupAddress}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">Drop:</span> {destinationAddress}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ride Details */}
      <div className="bg-white p-4 rounded-lg mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-800">{distance}</p>
            <p className="text-xs text-gray-600 mt-1">Distance</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{duration}</p>
            <p className="text-xs text-gray-600 mt-1">Duration</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">₹{fare.toFixed(2)}</p>
            <p className="text-xs text-gray-600 mt-1">Amount</p>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-white p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getPaymentIcon(paymentMethod)}
            <div>
              <p className="font-semibold text-gray-800">Payment</p>
              <p className="text-sm text-gray-600">{getPaymentLabel(paymentMethod)}</p>
            </div>
          </div>
          <p className="text-lg font-bold text-gray-800">₹{fare.toFixed(2)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onViewHistory}
          className="flex-1 px-4 py-3 border-2 border-gray-800 text-gray-800 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          <i className="ri-history-line mr-2"></i>
          View History
        </button>
        <button
          onClick={onNewRide}
          className="flex-1 px-4 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
        >
          <i className="ri-taxi-line mr-2"></i>
          New Ride
        </button>
      </div>
    </div>
  );
};