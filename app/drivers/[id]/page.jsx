"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Car, User, Phone, Truck, MapPin, Clock, DollarSign,
  CheckCircle, AlertCircle, Navigation, Star, Calendar, TrendingUp,
  Wifi, WifiOff
} from 'lucide-react';

export default function DriverPage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params?.id;

  // State Management
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
    const [rideCompleted, setRideCompleted] = useState(false);

  const [activeRide, setActiveRide] = useState(null);
  const [status, setStatus] = useState('offline');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [completionMessage, setCompletionMessage] = useState('');

  // Refs
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Utility Functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (currentStatus) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      'in-ride': 'bg-blue-100 text-blue-800',
      offline: 'bg-gray-100 text-gray-800'
    };
    return colors[currentStatus] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (currentStatus) => {
    const texts = {
      available: 'Available',
      'in-ride': 'In Ride',
      offline: 'Offline'
    };
    return texts[currentStatus] || 'Unknown';
  };

  // API Functions
  const fetchDriverData = useCallback(async () => {
    if (!driverId) return;

    try {
      console.log("Fetching driver data for ID:", driverId);
      
      const response = await fetch(`/api/drivers/${driverId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch driver data`);
      }
      
      const data = await response.json();
      const driverData = data.driver || data;
      
      if (!driverData) {
        throw new Error('No driver data found in response');
      }
      
      setDriver(driverData);
      
      if (driverData.isActive && driverData.isApproved) {
        setStatus('available');
      } else {
        setStatus('offline');
      }
      
    } catch (err) {
      console.error("Error fetching driver data:", err);
      setError(err.message || 'Failed to load driver data');
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  // Geolocation Functions
  const initializeGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading || null,
          speed: position.coords.speed || null,
          timestamp: position.timestamp
        };
        
        setCurrentLocation(coords);
        
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'location_update',
            driverId,
            coords,
            timestamp: Date.now()
          }));
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        const errorMessages = {
          [error.PERMISSION_DENIED]: 'Location permission denied. Please enable location access.',
          [error.POSITION_UNAVAILABLE]: 'Location information unavailable',
          [error.TIMEOUT]: 'Location request timeout'
        };
        setError(errorMessages[error.code] || `Location error: ${error.message}`);
      },
      { 
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000
      }
    );
  }, [driverId]);

  // WebSocket Functions
  const connectWebSocket = useCallback(() => {
    if (!driver || !driverId) return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    setConnectionStatus('connecting');
    
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      const ws = new WebSocket(`${wsUrl}/?type=driver&id=${driverId}`);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        console.log('WebSocket connected as driver');
        
        if (driver.isApproved && driver.isActive) {
          ws.send(JSON.stringify({
            type: 'status_update',
            driverId,
            status: 'available'
          }));
          setStatus('available');
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          switch (data.type) {
            case 'ride_request':
              setRideRequests(prev => {
                const exists = prev.find(r => r.rideId === data.rideId);
                return exists ? prev : [...prev, data];
              });
              break;
              
            case 'ride_canceled':
              setRideRequests(prev => prev.filter(r => r.rideId !== data.rideId));
              if (activeRide?.rideId === data.rideId) {
                setActiveRide(null);
                setStatus('available');
              }
              break;
              
            case 'ride_completed':
              if (activeRide?.rideId === data.rideId) {
                setActiveRide(null);
                setStatus('available');
              }
              break;
              
            default:
              console.log('Unhandled message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, Math.min(3000 * reconnectAttemptsRef.current, 30000));
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('disconnected');
    }
  }, [driver, driverId]);

  // Event Handlers
  const handleAcceptRide = useCallback((ride) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setError('Cannot accept ride - not connected to server');
      return;
    }
    
    if (!currentLocation) {
      setError('Cannot accept ride - location not available');
      return;
    }

    socketRef.current.send(JSON.stringify({
      type: 'ride_response',
      rideId: ride.rideId,
      accepted: true,
      driverId,
      coords: currentLocation,
      timestamp: Date.now()
    }));
    
    setActiveRide(ride);
    setStatus('in-ride');
    setRideRequests([]);
  }, [currentLocation, driverId]);

  const handleRejectRide = useCallback((rideId) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot reject ride - WebSocket not connected');
      return;
    }

    socketRef.current.send(JSON.stringify({
      type: 'ride_response',
      rideId,
      accepted: false,
      driverId,
      timestamp: Date.now()
    }));
    
    setRideRequests(prev => prev.filter(r => r.rideId !== rideId));
  }, [driverId]);
const handleCompleteRide = useCallback(() => {
  if (!socketRef.current || !activeRide) return;

  const completionData = {
    type: 'ride_completed',
    rideId: activeRide.rideId,
    driverId,
    driverName: driver?.firstName && driver?.lastName 
      ? `${driver.firstName} ${driver.lastName}` 
      : driver?.fullName || driver?.name || 'Driver',
    vehicleNumber: driver?.licensePlate || driver?.vehicle?.licensePlate || driver?.vehicleNumber || 'N/A',
    estimatedFare: activeRide.estimatedFare,
    completedAt: new Date().toISOString(),
    timestamp: Date.now(),
    // Add client ID to ensure proper routing
    clientId: activeRide.clientId
  };

  console.log("Sending ride completion data:", completionData);
  
  socketRef.current.send(JSON.stringify(completionData));

  // Update local UI state
  setRideCompleted(true);
  setActiveRide(null);
  setStatus('available');
  
  // Show completion message to driver
  setCompletionMessage('Ride completed successfully!');
  
  // Clear message after 3 seconds
  setTimeout(() => {
    setCompletionMessage('');
  }, 3000);

}, [activeRide, driverId, driver]);


  const toggleOnlineStatus = useCallback(async () => {
    if (!driver?.isApproved || !driver?.isActive) {
      setError('Cannot go online - account not approved or inactive');
      return;
    }

    const newStatus = status === 'available' ? 'offline' : 'available';
    
    try {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'status_update',
          driverId,
          status: newStatus,
          timestamp: Date.now()
        }));
      }

      const action = newStatus === 'available' ? 'activate' : 'deactivate';
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status in database');
      }

      setStatus(newStatus);
      
    } catch (error) {
      console.error('Error updating driver status:', error);
      setError('Failed to update online status');
    }
  }, [driver, status, driverId]);

  const handleLogout = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close(1000, 'User logged out');
    }
    
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    
    router.push('/');
  }, [router]);

  // Effects
  useEffect(() => {
    fetchDriverData();
  }, [fetchDriverData]);

  useEffect(() => {
    if (driver && driver.isApproved && driver.isActive) {
      initializeGeolocation();
      connectWebSocket();
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounted');
        socketRef.current = null;
      }
    };
  }, [driver, connectWebSocket, initializeGeolocation]);

  // JSX Components
  const LoadingScreen = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Loading driver dashboard...</p>
      </div>
    </div>
  );

  const ErrorScreen = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Driver Data</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-x-2">
            <button 
              onClick={() => {
                setError('');
                setLoading(true);
                fetchDriverData();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Retry
            </button>
            <button 
              onClick={() => router.push('/')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const NotFoundScreen = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-red-800 mb-2">Driver Not Found</h2>
        <p className="text-red-600 mb-4">No driver data found for ID: {driverId}</p>
        <button 
          onClick={() => router.push('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Go Home
        </button>
      </div>
    </div>
  );

  const Header = () => (
    <header className="bg-black text-white p-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Back</span>
        </button>
        
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6 text-yellow-400" />
          <span className="font-bold text-xl">Ryda Driver</span>
        </div>
        
        <button 
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );

  const AlertBanner = ({ type, message, onDismiss }) => {
    const styles = {
      success: 'bg-green-50 text-green-800 border-green-200',
      error: 'bg-red-50 text-red-800 border-red-200',
      warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
    };

    const icons = {
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertCircle
    };

    const Icon = icons[type];

    return (
      <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${styles[type]}`}>
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="hover:opacity-75">
            ×
          </button>
        )}
      </div>
    );
  };

  const ConnectionStatus = () => {
    const statusConfig = {
      connected: {
        style: 'bg-green-50 text-green-800 border-green-200',
        icon: Wifi,
        text: 'Connected - Ready for rides'
      },
      connecting: {
        style: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        icon: 'spinner',
        text: 'Connecting to server...'
      },
      disconnected: {
        style: 'bg-red-50 text-red-800 border-red-200',
        icon: WifiOff,
        text: 'Disconnected - Unable to receive rides'
      }
    };

    const config = statusConfig[connectionStatus];
    const Icon = config.icon;

    return (
      <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${config.style}`}>
        {Icon === 'spinner' ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-500 border-t-transparent"></div>
        ) : (
          <Icon className="h-5 w-5" />
        )}
        <div className="flex-1">
          <p className="font-medium">{config.text}</p>
          {reconnectAttemptsRef.current > 0 && connectionStatus !== 'connected' && (
            <p className="text-sm opacity-75">
              Reconnect attempts: {reconnectAttemptsRef.current}/{maxReconnectAttempts}
            </p>
          )}
        </div>
      </div>
    );
  };

  const DriverInfoCard = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
        <div className="flex items-start gap-4">
          {driver?.profileImage ? (
            <img 
              src={driver.profileImage} 
              alt="Driver Profile" 
              className="w-16 h-16 rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center ${driver?.profileImage ? 'hidden' : ''}`}>
            <User className="h-8 w-8 text-gray-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Welcome, {driver?.firstName || driver?.fullName?.split(' ')[0] || 'Driver'}
              {(driver?.lastName || driver?.fullName?.split(' ')[1]) && (
                <span> {driver.lastName || driver.fullName.split(' ')[1]}</span>
              )}
            </h1>
            <p className="text-gray-600 text-sm break-all">Driver ID: {driver?._id}</p>
            {driver?.rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{driver.rating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">rating</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                driver?.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {driver?.isApproved ? 'Approved' : 'Pending Approval'}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                driver?.isActive ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
              }`}>
                {driver?.isActive ? 'Active Account' : 'Inactive Account'}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
            {getStatusText(status)}
          </div>
        </div>
      </div>

      {/* Driver Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800">
            {driver?.totalRides || driver?.completedRides || 0}
          </p>
          <p className="text-sm text-gray-500">Total Rides</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            ₹{driver?.totalEarnings || driver?.earnings || 0}
          </p>
          <p className="text-sm text-gray-500">Total Earnings</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {driver?.rating ? driver.rating.toFixed(1) : 'N/A'}
          </p>
          <p className="text-sm text-gray-500">Rating</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-800">
            {formatDate(driver?.createdAt || driver?.registrationDate)}
          </p>
          <p className="text-sm text-gray-500">Join Date</p>
        </div>
      </div>

      {/* Driver Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium break-all">{driver?.email || 'Not provided'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{driver?.phone || driver?.phoneNumber || 'Not provided'}</p>
            </div>
          </div>

          {(driver?.licenseNumber || driver?.drivingLicense?.number) && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-500">License Number</p>
                <p className="font-medium break-all">{driver.licenseNumber || driver.drivingLicense?.number}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-gray-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Vehicle</p>
              <p className="font-medium">
                {[
                  driver?.vehicle?.make,
                  driver?.vehicle?.model,
                  driver?.vehicle?.year || driver?.vehicleModel
                ].filter(Boolean).join(' ') || 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">License Plate</p>
              <p className="font-medium">{driver?.vehicle?.licensePlate || driver?.licensePlate || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium">{formatDate(driver?.createdAt || driver?.registrationDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Online/Offline Toggle */}
      {driver?.isApproved && driver?.isActive ? (
        <button
          onClick={toggleOnlineStatus}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            status === 'available' 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          disabled={connectionStatus !== 'connected' && status === 'offline'}
        >
          {status === 'available' ? 'Go Offline' : 'Go Online'}
        </button>
      ) : (
        <div className="w-full py-3 px-4 rounded-lg bg-gray-100 text-gray-500 text-center">
          {!driver?.isApproved && 'Account pending approval'}
          {driver?.isApproved && !driver?.isActive && 'Account is inactive'}
        </div>
      )}
    </div>
  );

  const ActiveRideCard = () => activeRide && (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-blue-800 mb-4">Active Ride</h2>
      <div className="space-y-2 mb-4">
        <p><span className="font-medium">From:</span> {activeRide.pickupAddress}</p>
        <p><span className="font-medium">To:</span> {activeRide.destinationAddress}</p>
        <p><span className="font-medium">Fare:</span> ₹{activeRide.estimatedFare}</p>
        <p><span className="font-medium">Passenger:</span> {activeRide.passengerName}</p>
      </div>
      <button
        onClick={handleCompleteRide}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
      >
        Complete Ride
      </button>
    </div>
  );

  const RideRequestsCard = () => rideRequests.length > 0 && (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Pending Ride Requests ({rideRequests.length})
      </h2>
      <div className="space-y-4">
        {rideRequests.map((ride) => (
          <div key={ride.rideId} className="border rounded-lg p-4">
            <div className="space-y-2 mb-4">
              <p><span className="font-medium">From:</span> {ride.pickupAddress}</p>
              <p><span className="font-medium">To:</span> {ride.destinationAddress}</p>
              <p><span className="font-medium">Fare:</span> ₹{ride.estimatedFare}</p>
              {ride.distance && <p><span className="font-medium">Distance:</span> {ride.distance}</p>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAcceptRide(ride)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
                disabled={connectionStatus !== 'connected' || !currentLocation}
              >
                Accept
              </button>
              <button
                onClick={() => handleRejectRide(ride.rideId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors"
                disabled={connectionStatus !== 'connected'}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const LocationCard = () => currentLocation && (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Navigation className="h-5 w-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-800">Current Location</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Latitude</p>
          <p className="font-mono">{currentLocation.lat.toFixed(6)}</p>
        </div>
        <div>
          <p className="text-gray-500">Longitude</p>
          <p className="font-mono">{currentLocation.lng.toFixed(6)}</p>
        </div>
        {currentLocation.accuracy && (
          <div>
            <p className="text-gray-500">Accuracy</p>
            <p className="font-mono">{currentLocation.accuracy.toFixed(0)}m</p>
          </div>
        )}
        {currentLocation.speed !== null && currentLocation.speed > 0 && (
          <div>
            <p className="text-gray-500">Speed</p>
            <p className="font-mono">{(currentLocation.speed * 3.6).toFixed(1)} km/h</p>
          </div>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Last updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );

  const WaitingStateCard = () => status === 'available' && rideRequests.length === 0 && !activeRide && (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center py-8 text-gray-500">
        <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium">You're online and ready!</p>
        <p className="text-sm">Waiting for ride requests...</p>
        {connectionStatus !== 'connected' && (
          <p className="text-sm text-red-500 mt-2">
            Connection issues may prevent receiving requests
          </p>
        )}
      </div>
    </div>
  );

  const OfflineStateCard = () => status === 'offline' && (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center py-8 text-gray-500">
        <Car className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium">You're currently offline</p>
        <p className="text-sm">Toggle "Go Online" to start receiving ride requests</p>
      </div>
    </div>
  );

  const AccountStatusWarning = () => (!driver?.isApproved || !driver?.isActive) && (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-3">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        <h3 className="text-lg font-semibold text-yellow-800">Account Status</h3>
      </div>
      <div className="space-y-2 text-yellow-700">
        {!driver?.isApproved && (
          <p>• Your account is pending approval. You cannot receive rides until approved.</p>
        )}
        {!driver?.isActive && (
          <p>• Your account is currently inactive. Contact support to reactivate.</p>
        )}
        <p className="text-sm">Contact our support team if you have any questions.</p>
      </div>
    </div>
  );

  // Early returns for different states
  if (loading) return <LoadingScreen />;
  if (error && !driver) return <ErrorScreen />;
  if (!driver) return <NotFoundScreen />;

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto p-4 max-w-4xl">
        {/* Success Message */}
        {completionMessage && (
          <AlertBanner 
            type="success" 
            message={completionMessage} 
            onDismiss={() => setCompletionMessage('')} 
          />
        )}

        {/* Error Banner */}
        {error && driver && (
          <AlertBanner 
            type="error" 
            message={error} 
            onDismiss={() => setError('')} 
          />
        )}

        {/* Connection Status */}
        <ConnectionStatus />

        {/* Driver Info Card */}
        <DriverInfoCard />

        {/* Active Ride */}
        <ActiveRideCard />

        {/* Ride Requests */}
        <RideRequestsCard />

        {/* Current Location */}
        <LocationCard />

        {/* Waiting State */}
        <WaitingStateCard />

        {/* Offline State */}
        <OfflineStateCard />

        {/* Account Status Warning */}
        <AccountStatusWarning />
      </main>
    </div>
  );
}