// app/components/FindingDriver.tsx

import React, { useState, useEffect } from 'react';
import { RIDE_CONFIG } from '../constants';

interface FindingDriverProps {
  onCancel: () => void;
}

export const FindingDriver: React.FC<FindingDriverProps> = ({ onCancel }) => {
  const [dots, setDots] = useState('');
  const [searchingMessage, setSearchingMessage] = useState('Looking for nearby drivers');

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    const messages = [
      'Looking for nearby drivers',
      'Finding the best match',
      'Connecting with drivers',
      'Almost found your ride'
    ];

    const messageInterval = setInterval(() => {
      setSearchingMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 3000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 text-center border border-gray-200">
      <div className="mb-6">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-amber-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 bg-amber-100 rounded-full flex items-center justify-center">
            <i className="ri-car-line text-2xl text-amber-600"></i>
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2">Finding your Ryda{dots}</h3>
        <p className="text-gray-600">{searchingMessage}</p>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <i className="ri-time-line"></i>
          <span>Estimated wait: {RIDE_CONFIG.ESTIMATED_WAIT_MIN}-{RIDE_CONFIG.ESTIMATED_WAIT_MAX} minutes</span>
        </div>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <i className="ri-map-pin-line"></i>
          <span>Searching within {RIDE_CONFIG.SEARCH_RADIUS_KM}km radius</span>
        </div>
      </div>

      <button 
        onClick={onCancel}
        className="w-full py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
      >
        Cancel Request
      </button>
    </div>
  );
};