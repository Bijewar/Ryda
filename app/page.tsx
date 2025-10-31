"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import debounce from "lodash/debounce";
import dynamic from "next/dynamic";

// Types
type PaymentMethod = "online" | "cash";
import {
  LocationSuggestion,
  RouteGeometry,
  Driver,
  RideStatus,
} from "./types";
import { HistoryRide } from "./components/RideHistory";

// Services
import { locationService } from "./services/location.service";
import { routeService } from "./services/route.service";
import { driverService } from "./services/driver.service";
import { razorpayService } from "./services/razorpay.service";

// Hooks
import { useGeolocation } from "./hooks/useGeolocation";
import { useStableWebSocket } from "./hooks/useStableWebSocket";

// Utils
import { normalizeCoordinates, calculateDistance } from "./utils/coordinates";
import { calculateFare } from "./utils/fare";
import { WS_CONFIG } from "./constants";

// Components
import { Header } from "./components/Header";
import { LocationInput } from "./components/LocationInput";
import { StatusIndicators } from "./components/StatusIndicators";
import { RideCompletion } from "./components/RideCompletion";
import { PriceDisplay } from "./components/PriceDisplay";
import { RazorpayPaymentModal } from "./components/RazorpayPaymentModal";
import { RideSummary } from "./components/RideSummary";
import { RideHistory } from "./components/RideHistory";

// Dynamic Map import
const MapView = dynamic(() => import("./components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin mb-2">
          <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p>Loading map...</p>
        </div>
      </div>
    </div>
  ),
});

export default function RideShareHome() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // UI State
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Location State
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [showPrice, setShowPrice] = useState(false);

  // Route State
  const [routeGeometry, setRouteGeometry] = useState<RouteGeometry | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [fare, setFare] = useState<number | null>(null);

  // Ride State
  const [rideStatus, setRideStatus] = useState<RideStatus>("idle");
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isFindingDriver, setIsFindingDriver] = useState(false);
  const [isLoadingDriverDetails, setIsLoadingDriverDetails] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [completedRide, setCompletedRide] = useState<{ driver: Driver; fare: number } | null>(null);

  // Payment State
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [lastPaymentMethod, setLastPaymentMethod] = useState<'card' | 'upi' | 'cash'>('card');

  // Ride History
  const [rideHistory, setRideHistory] = useState<HistoryRide[]>([]);
  const [showRideHistory, setShowRideHistory] = useState(false);
  const [showRideSummary, setShowRideSummary] = useState(false);

  // Geolocation
  const { coords: currentCoords, error: geoError } = useGeolocation();

  // WebSocket Client ID
  const clientId = useMemo(
    () => session?.user?.email || `client-${Date.now()}`,
    [session?.user?.email]
  );

  // Redirect drivers to their dashboard
  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.accountType === "driver") {
      router.push(`/drivers/${session.user.id}`);
    }
  }, [status, session, router]);

  // Restore ride and history from localStorage on mount
  useEffect(() => {
    const savedRide = localStorage.getItem("ongoingRide");
    const savedHistory = localStorage.getItem("rideHistory");

    if (savedRide) {
      const ride = JSON.parse(savedRide);
      setPickup(ride.pickup);
      setDestination(ride.destination);
      setPickupCoords(ride.pickupCoords);
      setDestinationCoords(ride.destinationCoords);
      setRouteGeometry(ride.routeGeometry);
      setFare(ride.fare);
      setRideStatus(ride.rideStatus);
      setDriver(ride.driver);
      setIsFindingDriver(ride.isFindingDriver);
      setActiveRideId(ride.activeRideId);
      setCompletedRide(ride.completedRide);
      setShowRideSummary(ride.showRideSummary || false);
    }

    if (savedHistory) {
      setRideHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Persist ongoing ride whenever relevant state changes
  useEffect(() => {
    const rideState = {
      pickup,
      destination,
      pickupCoords,
      destinationCoords,
      routeGeometry,
      fare,
      rideStatus,
      driver,
      isFindingDriver,
      activeRideId,
      completedRide,
      showRideSummary,
    };
    if (rideStatus !== "idle") {
      localStorage.setItem("ongoingRide", JSON.stringify(rideState));
    } else {
      localStorage.removeItem("ongoingRide");
    }
  }, [pickup, destination, pickupCoords, destinationCoords, routeGeometry, fare, rideStatus, driver, isFindingDriver, activeRideId, completedRide, showRideSummary]);

  // Persist ride history
  useEffect(() => {
    localStorage.setItem("rideHistory", JSON.stringify(rideHistory));
  }, [rideHistory]);

  // Multi-tab ride sync
  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === "ongoingRide" && event.newValue) {
        const ride = JSON.parse(event.newValue);
        setPickup(ride.pickup);
        setDestination(ride.destination);
        setPickupCoords(ride.pickupCoords);
        setDestinationCoords(ride.destinationCoords);
        setRouteGeometry(ride.routeGeometry);
        setFare(ride.fare);
        setRideStatus(ride.rideStatus);
        setDriver(ride.driver);
        setIsFindingDriver(ride.isFindingDriver);
        setActiveRideId(ride.activeRideId);
        setCompletedRide(ride.completedRide);
        setShowRideSummary(ride.showRideSummary || false);
      } else if (event.key === "ongoingRide" && !event.newValue) {
        resetAllStates();
      } else if (event.key === "rideHistory" && event.newValue) {
        setRideHistory(JSON.parse(event.newValue));
      }
    };
    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, []);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback(
    async (data: any) => {
      console.log("📨 Received:", data.type, data);
      switch (data.type) {
        case "connected":
          console.log("✅ Server connected:", data.message);
          break;
        case "driver_response":
        case "driver_accepted":
          if (data.accepted && data.driverId) {
            setIsLoadingDriverDetails(true);
            setIsFindingDriver(false);
            try {
              const realDriverData = await driverService.fetchDetails(data.driverId);
              if (realDriverData) {
                const completeDriverData: Driver = {
                  ...realDriverData,
                  coords: data.coords || data.driverCoords || realDriverData.coords,
                  status: "accepted",
                  estimatedArrival: data.estimatedArrival,
                };
                setDriver(completeDriverData);
                setRideStatus("driver-found");
                setTimeout(() => setRideStatus("driver-coming"), 2000);
              } else {
                setApiError("Failed to load driver details.");
                setIsFindingDriver(true);
              }
            } catch (err) {
              console.error(err);
              setApiError("Failed to load driver details.");
              setIsFindingDriver(true);
            } finally {
              setIsLoadingDriverDetails(false);
            }
          } else {
            setApiError("Driver declined. Searching for another driver...");
          }
          break;

        case "driver_location_update":
        case "location_update":
        case "driver_location":
          if (data.coords) {
            const coords = normalizeCoordinates(data.coords);
            setDriver((prev) => {
              if (!prev) return null;
              setPickupCoords((currentPickup) => {
                if (coords && currentPickup) {
                  const distance = calculateDistance(coords, currentPickup);
                  const newStatus =
                    distance < WS_CONFIG.ARRIVAL_THRESHOLD ? "arrived" : "on-way";
                  if (newStatus === "arrived" && prev.status !== "arrived") {
                    setRideStatus("driver-arrived");
                  }
                }
                return currentPickup;
              });
              return { ...prev, ...(coords ? { coords } : {}), status: data.status || prev.status };
            });
          }
          break;

        case "ride_started":
          setRideStatus("in-progress");
          setApiError(null);
          break;

        case "ride_completed":
          setDriver((currentDriver) => {
            setFare((currentFare) => {
              const completedDriver =
                currentDriver || {
                  id: data.driverId || "unknown",
                  name: data.driverName || "Driver",
                  vehicleNumber: data.vehicleNumber || "N/A",
                  coords: [0, 0] as [number, number],
                  status: "completed" as const,
                  phone: "",
                  vehicleType: "Car",
                  rating: 4.5,
                };
              const finalFare = data.estimatedFare || data.fare || currentFare || 0;
              setCompletedRide({ driver: completedDriver, fare: finalFare });
              setRideStatus("completed");
              setIsFindingDriver(false);
              setIsLoadingDriverDetails(false);
              setApiError(null);
              return currentFare;
            });
            return null;
          });
          break;

        case "ride_status":
          if (data.status) setRideStatus(data.status);
          setDriver((prev) =>
            prev
              ? {
                  ...prev,
                  id: data.driverId || prev.id,
                  coords: data.driverCoords || prev.coords,
                  status: data.status || prev.status,
                }
              : null
          );
          break;

        case "no_drivers_available":
          setApiError(data.message || "No drivers available.");
          setIsFindingDriver(false);
          break;

        case "error":
          setApiError(data.message || "An error occurred.");
          break;
      }
    },
    [pickupCoords]
  );

  const shouldConnect =
    isFindingDriver ||
    rideStatus === "driver-found" ||
    rideStatus === "driver-coming" ||
    rideStatus === "driver-arrived" ||
    rideStatus === "in-progress" ||
    rideStatus === "completed";

  const { connectionStatus, sendMessage, disconnect } = useStableWebSocket(
    clientId,
    handleWebSocketMessage,
    shouldConnect
  );

  // Reset all ride states
  const resetAllStates = useCallback(() => {
    setRideStatus("idle");
    setDriver(null);
    setShowPrice(false);
    setIsFindingDriver(false);
    setApiError(null);
    setCompletedRide(null);
    setPickup("");
    setDestination("");
    setPickupCoords(null);
    setDestinationCoords(null);
    setRouteGeometry(null);
    setFare(null);
    setActiveRideId(null);
    setIsLoadingDriverDetails(false);
    setIsPaying(false);
    setPaymentMethod("online");
    setPaymentError(null);
    setIsPaymentModalOpen(false);
    setShowRideSummary(false);
    disconnect();
  }, [disconnect]);

  // ===================== PAYMENT HANDLERS =====================
  const handleCreateOrderAndOpenRazorpay = useCallback(async () => {
    if (!completedRide || !session?.user?.name || !session.user.email) return null;
    setIsPaying(true);
    setPaymentError(null);
    try {
      const orderData = await razorpayService.createRazorpayOrder(
        completedRide.fare,
        session.user.name,
        clientId,
        session.user.email,
        (session.user as any).phone || "9999999999"
      );
      return orderData;
    } catch (error: any) {
      setPaymentError(error.message || "Unknown payment error.");
      setIsPaying(false);
      setIsPaymentModalOpen(false);
      return null;
    }
  }, [completedRide, clientId, session]);

  const handleCloseOnlinePayment = useCallback(() => {
    setIsPaymentModalOpen(false);
    setIsPaying(false);
    setPaymentError(null);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    if (completedRide && pickup && destination) {
      const newRide: HistoryRide = {
        id: `ride_${Date.now()}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        pickup,
        destination,
        distance: routeGeometry ? `${(routeGeometry.distance / 1000).toFixed(1)} km` : "5.2 km",
        duration: routeGeometry ? `${Math.round(routeGeometry.duration / 60)} mins` : "25 mins",
        fare: completedRide.fare,
        paymentMethod: lastPaymentMethod,
        driverName: completedRide.driver.name,
        driverRating: completedRide.driver.rating,
        status: "completed",
      };
      setRideHistory((prev) => [newRide, ...prev]);
    }
    setIsPaymentModalOpen(false);
    setShowRideSummary(true);
  }, [completedRide, pickup, destination, lastPaymentMethod, routeGeometry]);

  const handleCashPayment = useCallback(() => {
    setPaymentError(null);
    if (completedRide && pickup && destination) {
      const newRide: HistoryRide = {
        id: `ride_${Date.now()}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        pickup,
        destination,
        distance: routeGeometry ? `${(routeGeometry.distance / 1000).toFixed(1)} km` : "5.2 km",
        duration: routeGeometry ? `${Math.round(routeGeometry.duration / 60)} mins` : "25 mins",
        fare: completedRide.fare,
        paymentMethod: "cash",
        driverName: completedRide.driver.name,
        driverRating: completedRide.driver.rating,
        status: "completed",
      };
      setRideHistory((prev) => [newRide, ...prev]);
    }
    setIsPaymentModalOpen(false);
    setShowRideSummary(true);
  }, [completedRide, pickup, destination, routeGeometry]);

  const handleConfirmPayment = useCallback(() => {
    if (paymentMethod === "cash") {
      handleCashPayment();
    } else {
      setLastPaymentMethod("card");
      setIsPaying(true);
      setIsPaymentModalOpen(true);
    }
  }, [paymentMethod, handleCashPayment]);

  // ===================== LOCATION & SEARCH HANDLERS =====================
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setApiError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPickupCoords(coords);
        try {
          const address = await locationService.reverseGeocode(coords);
          if (address) setPickup(address);
        } catch (error) {
          console.error(error);
        }
      },
      (err) => setApiError("Could not get your current location"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  const debouncedPickupSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length >= 3) {
          try {
            const results = await locationService.search(query);
            setPickupSuggestions(results);
          } catch {
            setPickupSuggestions([]);
          }
        } else setPickupSuggestions([]);
      }, 300),
    []
  );

  const debouncedDestinationSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length >= 3) {
          try {
            const results = await locationService.search(query);
            setDestinationSuggestions(results);
          } catch {
            setDestinationSuggestions([]);
          }
        } else setDestinationSuggestions([]);
      }, 300),
    []
  );

  const handlePickupChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setPickup(value);
      debouncedPickupSearch(value);
    },
    [debouncedPickupSearch]
  );

  const handleDestinationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setDestination(value);
      debouncedDestinationSearch(value);
    },
    [debouncedDestinationSearch]
  );

  const handleSelectPickup = useCallback((loc: LocationSuggestion) => {
    setPickup(loc.display);
    setPickupCoords(loc.coords);
    setPickupSuggestions([]);
    setShowPickupSuggestions(false);
  }, []);

  const handleSelectDestination = useCallback((loc: LocationSuggestion) => {
    setDestination(loc.display);
    setDestinationCoords(loc.coords);
    setDestinationSuggestions([]);
    setShowDestinationSuggestions(false);
  }, []);

  const handleSeePrices = useCallback(() => {
    if (routeGeometry) {
      const distanceInKm = routeGeometry.distance / 1000;
      const calculatedFare = calculateFare(distanceInKm);
      setFare(calculatedFare);
      setShowPrice(true);
    }
  }, [routeGeometry]);

  const handleRequestRide = useCallback(() => {
    if (pickupCoords && destinationCoords && session) {
      const rideId = `ride-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      setActiveRideId(rideId);
      setIsFindingDriver(true);
      setRideStatus("searching");
      setApiError(null);

      sendMessage({
        type: "request_driver",
        rideId,
        pickup: pickupCoords,
        pickupAddress: pickup,
        destination: destinationCoords,
        destinationAddress: destination,
        estimatedFare: fare,
        clientId,
        timestamp: Date.now(),
      });
    }
  }, [pickupCoords, destinationCoords, session, pickup, destination, fare, clientId, sendMessage]);

  const handleCancelRequest = useCallback(() => {
    sendMessage({ type: "cancel_ride", rideId: activeRideId });
    resetAllStates();
  }, [activeRideId, sendMessage, resetAllStates]);

  const dismissError = useCallback(() => setApiError(null), []);

  // Route effect
  useEffect(() => {
    if (pickupCoords && destinationCoords) {
      setIsRouting(true);
      routeService.getRoute(pickupCoords, destinationCoords)
        .then((geometry) => {
          setRouteGeometry(geometry);
          setIsRouting(false);
        })
        .catch((err) => {
          console.error(err);
          setIsRouting(false);
          setApiError("Could not calculate route");
        });
    } else setRouteGeometry(null);
  }, [pickupCoords, destinationCoords]);

  // Before unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (
        isFindingDriver ||
        rideStatus === "in-progress" ||
        rideStatus === "driver-coming" ||
        rideStatus === "driver-arrived"
      ) {
        event.preventDefault();
        event.returnValue = "You have an active ride. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFindingDriver, rideStatus]);

  const normalizeDriver = (driver: Driver | null) => {
    if (!driver) return null;
    const statusMap: Record<string, 'available' | 'on-way' | 'arrived'> = {
      'searching': 'available',
      'accepted': 'on-way',
      'on-way': 'on-way',
      'arrived': 'arrived',
      'completed': 'available'
    };
    return {
      id: driver.id,
      status: statusMap[driver.status] || 'available',
      coords: normalizeCoordinates(driver.coords) || [0, 0]
    };
  };

  // ===================== JSX =====================
  return (
 <div className="font-sans w-screen h-screen overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      {/* Header */}
      <Header
        session={session}
        status={status}
        dropdownOpen={dropdownOpen}
        setDropdownOpen={setDropdownOpen}
        onViewRideHistory={() => setShowRideHistory(true)}
      />

      {/* Main Content Container */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] w-full">
        {/* Left Panel - Booking Interface */}
        <div className="w-full lg:w-2/5 h-auto lg:h-full flex flex-col overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-850">
          <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full">
            {/* Premium Header Section */}
            <div className="mb-4 sm:mb-6 md:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2 tracking-tight text-balance leading-snug">
                Go anywhere with <span className="text-blue-600 dark:text-blue-400">Ryda</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 font-medium">
                Your reliable ride in seconds
              </p>
            </div>

            {/* Status Indicators */}
            <StatusIndicators
              connectionStatus={isFindingDriver ? connectionStatus : "disconnected"}
              isLoadingDriverDetails={isLoadingDriverDetails}
              apiError={apiError}
              onDismissError={dismissError}
            />

            {/* Ride Completion / Summary Views */}
            {rideStatus === "completed" && completedRide && !showRideSummary ? (
              <RideCompletion
                driver={completedRide.driver}
                fare={completedRide.fare}
                onConfirmPayment={handleConfirmPayment}
                isPaying={isPaying}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                paymentError={paymentError}
                onBackToDashboard={resetAllStates}
              />
            ) : showRideSummary && completedRide ? (
              <RideSummary
                driver={completedRide.driver}
                fare={completedRide.fare}
                paymentMethod={lastPaymentMethod}
                pickupAddress={pickup}
                destinationAddress={destination}
                onNewRide={() => {
                  setShowRideSummary(false)
                  resetAllStates()
                }}
                onViewHistory={() => setShowRideHistory(true)}
              />
            ) : (
              <>
                {/* Location Inputs Section */}
                <div className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-4 sm:mb-5 md:mb-6">
                  <LocationInput
                    value={pickup}
                    onChange={handlePickupChange}
                    suggestions={pickupSuggestions}
                    onSelect={handleSelectPickup}
                    placeholder="Where are you?"
                    icon={<i className="ri-map-pin-2-fill text-lg" />}
                    showSuggestions={showPickupSuggestions}
                    onFocus={() => setShowPickupSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                    currentLocationHandler={getCurrentLocation}
                  />

                  <LocationInput
                    value={destination}
                    onChange={handleDestinationChange}
                    suggestions={destinationSuggestions}
                    onSelect={handleSelectDestination}
                    placeholder="Where to?"
                    icon={<i className="ri-flag-fill text-lg" />}
                    showSuggestions={showDestinationSuggestions}
                    onFocus={() => setShowDestinationSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
                  />

                  {/* See Prices Button */}
                  <button
                    className="w-full px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs sm:text-sm md:text-base font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isRouting || !pickupCoords || !destinationCoords}
                    onClick={handleSeePrices}
                  >
                    {isRouting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Calculating...</span>
                      </span>
                    ) : (
                      "See Prices"
                    )}
                  </button>
                </div>

                {/* Price Display Section */}
                {showPrice && fare !== null && routeGeometry && (
                  <div className="mt-3 sm:mt-4 md:mt-5 p-3 sm:p-4 md:p-5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm w-full">
                    <PriceDisplay
                      fare={fare}
                      routeGeometry={routeGeometry}
                      isFindingDriver={isFindingDriver}
                      driver={driver}
                      rideStatus={rideStatus}
                      pickupCoords={pickupCoords}
                      handleCancelRequest={handleCancelRequest}
                      handleRequestRide={handleRequestRide}
                      session={session}
                      isLoadingDriverDetails={isLoadingDriverDetails}
                    />
                  </div>
                )}

                {/* Error Messages */}
                {geoError && (
                  <div className="mt-2 sm:mt-3 md:mt-4 p-2.5 sm:p-3 md:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 sm:gap-3">
                    <svg
                      className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs sm:text-sm text-red-700 dark:text-red-300">
                      Location error: {geoError}
                    </span>
                  </div>
                )}

                {/* OpenStreetMap Attribution */}
                <div className="mt-auto pt-4 sm:pt-5 md:pt-6 text-xs text-slate-500 dark:text-slate-400">
                  <a
                    href="https://www.openstreetmap.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200 underline"
                  >
                    © OpenStreetMap contributors
                  </a>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="w-full lg:w-3/5 h-0 lg:h-full hidden lg:flex">
          <MapView
            pickupCoords={pickupCoords}
            destinationCoords={destinationCoords}
            routeGeometry={routeGeometry}
            currentCoords={currentCoords}
            driver={normalizeDriver(driver)}
          />
        </div>

        {/* Mobile Map - Full width below booking on small screens */}
        <div className="w-full h-1/2 lg:hidden">
          <MapView
            pickupCoords={pickupCoords}
            destinationCoords={destinationCoords}
            routeGeometry={routeGeometry}
            currentCoords={currentCoords}
            driver={normalizeDriver(driver)}
          />
        </div>
      </div>

      {/* Payment Modal Overlay */}
      {isPaymentModalOpen && completedRide && session?.user && !showRideSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-3 sm:p-4">
          <RazorpayPaymentModal
            fare={completedRide.fare}
            clientName={session.user.name || "Ryda User"}
            clientEmail={session.user.email || ""}
            clientPhone={(session.user as any).phone || "9999999999"}
            isPaying={isPaying}
            onCreateOrderAndPay={handleCreateOrderAndOpenRazorpay}
            onClose={handleCloseOnlinePayment}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={setPaymentError}
          />
        </div>
      )}

      {/* Ride History Modal */}
      {showRideHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-3 sm:p-4">
          <RideHistory
            rides={rideHistory}
            onBack={() => setShowRideHistory(false)}
            onClose={() => setShowRideHistory(false)}
          />
        </div>
      )}
    </div>
  
  )
  
}