// ./components/RideHistory.tsx
"use client";

import React, { useState } from 'react';

export interface HistoryRide {
  id: string;
  date: string;
  time: string;
  pickup: string;
  destination: string;
  distance: string;
  duration: string;
  fare: number;
  paymentMethod: 'card' | 'upi' | 'cash';
  driverName: string;
  driverRating: number;
  status: 'completed' | 'cancelled';
}

interface RideHistoryProps {
  rides: HistoryRide[];
  onBack: () => void;
  onClose?: () => void;
}

export const RideHistory: React.FC<RideHistoryProps> = ({
  rides,
  onBack,
  onClose,
}) => {
  const [selectedRide, setSelectedRide] = useState<HistoryRide | null>(null);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <i className="ri-bank-card-line text-blue-500 text-lg"></i>;
      case 'upi':
        return <i className="ri-smartphone-line text-green-500 text-lg"></i>;
      case 'cash':
        return <i className="ri-money-dollar-circle-line text-amber-500 text-lg"></i>;
      default:
        return <i className="ri-wallet-line text-gray-500 text-lg"></i>;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'card':
        return 'Card';
      case 'upi':
        return 'UPI';
      case 'cash':
        return 'Cash';
      default:
        return 'Payment';
    }
  };

  if (selectedRide) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <h2 className="text-xl font-bold">Ride Details</h2>
            <button
              onClick={() => setSelectedRide(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Date & Time */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">{selectedRide.date}</p>
            <p className="font-semibold text-gray-800">{selectedRide.time}</p>
          </div>

          {/* Route */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex gap-3 mb-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="w-0.5 h-8 bg-gray-300 my-1"></div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold text-gray-800">Pickup:</span><br />
                  {selectedRide.pickup}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">Drop:</span><br />
                  {selectedRide.destination}
                </p>
              </div>
            </div>
          </div>

          {/* Ride Stats */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <i className="ri-road-map-line text-gray-600 text-lg mb-1"></i>
              <p className="text-sm font-semibold text-gray-800">{selectedRide.distance}</p>
              <p className="text-xs text-gray-600">Distance</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <i className="ri-time-line text-gray-600 text-lg mb-1"></i>
              <p className="text-sm font-semibold text-gray-800">{selectedRide.duration}</p>
              <p className="text-xs text-gray-600">Duration</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <i className="ri-wallet-line text-green-600 text-lg mb-1"></i>
              <p className="text-sm font-semibold text-gray-800">₹{selectedRide.fare.toFixed(2)}</p>
              <p className="text-xs text-gray-600">Fare</p>
            </div>
          </div>

          {/* Driver Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{selectedRide.driverName}</p>
                <div className="flex items-center gap-1 mt-1">
                  <i className="ri-star-fill text-yellow-400 text-sm"></i>
                  <span className="text-sm text-gray-600">{selectedRide.driverRating}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Driver</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getPaymentIcon(selectedRide.paymentMethod)}
              <p className="font-semibold text-gray-800">
                Paid via {getPaymentLabel(selectedRide.paymentMethod)}
              </p>
            </div>
            <p className="font-bold text-gray-800">₹{selectedRide.fare.toFixed(2)}</p>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setSelectedRide(null)}
            className="w-full px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <h2 className="text-xl font-bold">Ride History</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          )}
        </div>

        {/* Rides List */}
        <div className="space-y-3 mb-4">
          {rides.length === 0 ? (
            <div className="text-center py-8">
              <i className="ri-taxi-line text-gray-300 text-4xl mb-2"></i>
              <p className="text-gray-600">No rides yet</p>
            </div>
          ) : (
            rides.map((ride) => (
              <button
                key={ride.id}
                onClick={() => setSelectedRide(ride)}
                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">{ride.pickup}</p>
                    <p className="text-xs text-gray-600">to {ride.destination}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">₹{ride.fare.toFixed(2)}</p>
                    <p className="text-xs text-gray-600">{ride.date}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <i className="ri-road-map-line text-gray-500 text-xs"></i>
                      <span className="text-xs text-gray-600">{ride.distance}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <i className="ri-time-line text-gray-500 text-xs"></i>
                      <span className="text-xs text-gray-600">{ride.duration}</span>
                    </div>
                  </div>
                  {getPaymentIcon(ride.paymentMethod)}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};