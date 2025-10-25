// app/components/PriceDisplay.tsx

import React from 'react';
import { Driver, RouteGeometry, RideStatus } from '../types';
import { FARE_CONFIG } from '../constants';
import { FindingDriver } from './FindingDriver';
import { DriverCard } from './DriverCard';

interface PriceDisplayProps {
  fare: number;
  routeGeometry: RouteGeometry;
  isFindingDriver: boolean;
  driver: Driver | null;
  rideStatus: RideStatus;
  pickupCoords: [number, number] | null;
  handleCancelRequest: () => void;
  handleRequestRide: () => void;
  session: any;
  isLoadingDriverDetails: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  fare, 
  routeGeometry, 
  isFindingDriver, 
  driver, 
  rideStatus, 
  pickupCoords,
  handleCancelRequest,
  handleRequestRide,
  session,
  isLoadingDriverDetails
}) => (
  <div className="mt-4 p-4 bg-white rounded-lg shadow-md border border-gray-200">
    <h3 className="font-bold text-lg mb-3">Estimated Fare</h3>
    <div className="flex justify-between items-center mb-4">
      <div className="space-y-1">
        <p className="text-gray-600 text-sm">
          Distance: {(routeGeometry.distance / 1000).toFixed(1)} km
        </p>
        <p className="text-gray-600 text-sm">
          Duration: {Math.round(routeGeometry.duration / 60)} min
        </p>
        <p className="text-gray-600 text-sm">
          Rate: ₹{FARE_CONFIG.RATE_PER_KM} per km
        </p>
      </div>
      <div className="text-3xl font-bold text-green-600">₹{fare}</div>
    </div>
    
    {isFindingDriver ? (
      <FindingDriver onCancel={handleCancelRequest} />
    ) : driver ? (
      <>
        <DriverCard driver={driver} pickupCoords={pickupCoords} />
        {rideStatus === 'in-progress' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
            <div className="flex items-center">
              <i className="ri-car-line text-xl mr-2"></i>
              <span className="font-medium">Ride in progress</span>
            </div>
          </div>
        )}
      </>
    ) : (
      <button 
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-black py-3 rounded-lg text-lg font-semibold transition-colors"
        onClick={handleRequestRide}
        disabled={!session || isLoadingDriverDetails}
      >
        {!session ? 'Please login to request ride' : 
         isLoadingDriverDetails ? 'Loading driver details...' : 'Request Ryda'}
      </button>
    )}
  </div>
);