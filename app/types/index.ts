// app/types/index.ts

export interface LocationSuggestion {
  display: string;
  coords: [number, number];
}

export interface RouteGeometry {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

export interface Driver {
  id: string;
  name: string;
  email?: string;
  phone: string;
  licenseNumber?: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleColor?: string;
  vehicleModel?: string;
  vehicleBrand?: string;
  vehicleYear?: number;
  rating: number;
  totalRides?: number;
  profileImage?: string;
  isAvailable?: boolean;
  coords: [number, number];
  status: 'searching' | 'accepted' | 'on-way' | 'arrived' | 'completed';
  estimatedArrival?: number;
  currentLocation?: {
    coordinates: [number, number];
    address?: string;
  };
}

export type RideStatus = 
  | 'idle' 
  | 'searching' 
  | 'driver-found' 
  | 'driver-coming' 
  | 'driver-arrived' 
  | 'in-progress' 
  | 'completed';

export type ConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'error';

export interface RideRequest {
  type: 'request_driver';
  rideId: string;
  pickup: [number, number];
  pickupAddress: string;
  destination: [number, number];
  destinationAddress: string;
  estimatedFare: number | null;
  clientId: string;
  timestamp: number;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}