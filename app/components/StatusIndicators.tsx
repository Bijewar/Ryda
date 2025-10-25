// app/components/StatusIndicators.tsx

import React from 'react';
import { ConnectionStatus } from '../types';

interface StatusIndicatorsProps {
  connectionStatus: ConnectionStatus;
  isLoadingDriverDetails: boolean;
  apiError: string | null;
  onDismissError: () => void;
}

export const StatusIndicators: React.FC<StatusIndicatorsProps> = ({ 
  connectionStatus, 
  isLoadingDriverDetails, 
  apiError, 
  onDismissError 
}) => (
  <div className="space-y-4 mb-4">
    {connectionStatus !== 'disconnected' && (
      <div className={`px-4 py-3 rounded-lg ${
        connectionStatus === 'connected' 
          ? 'bg-green-50 border border-green-200 text-green-700'
          : connectionStatus === 'connecting'
          ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
          : 'bg-red-50 border border-red-200 text-red-700'
      }`}>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
          }`}></div>
          {connectionStatus === 'connected' && 'Connected to server'}
          {connectionStatus === 'connecting' && 'Connecting to server...'}
          {connectionStatus === 'error' && 'Connection error - retrying...'}
        </div>
      </div>
    )}

    {isLoadingDriverDetails && (
      <div className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
          Loading driver details...
        </div>
      </div>
    )}
    
    {apiError && (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <div className="flex items-center justify-between">
          <span>{apiError}</span>
          <button 
            onClick={onDismissError}
            className="ml-2 text-red-600 hover:text-red-800 font-bold text-lg"
          >
            ×
          </button>
        </div>
      </div>
    )}
  </div>
);