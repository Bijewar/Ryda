"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
    <div className="font-[gilroy] w-screen h-screen z-10 overflow-hidden bg-amber-300">
      <Header
        session={session}
        status={status}
        dropdownOpen={dropdownOpen}
        setDropdownOpen={setDropdownOpen}
        onViewRideHistory={() => setShowRideHistory(true)}
      />

      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Left Panel - FIXED SCROLLING */}
        <div className="w-full lg:w-1/2 h-full overflow-y-auto">
          <div className="p-6 lg:p-10 min-h-full">
            <h1 className="text-4xl lg:text-5xl font-bold mb-8 lg:mb-10">
              Go anywhere with <br /> Ryda
            </h1>

            <StatusIndicators
              connectionStatus={isFindingDriver ? connectionStatus : "disconnected"}
              isLoadingDriverDetails={isLoadingDriverDetails}
              apiError={apiError}
              onDismissError={dismissError}
            />

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
                  setShowRideSummary(false);
                  resetAllStates();
                }}
                onViewHistory={() => setShowRideHistory(true)}
              />
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <LocationInput
                    value={pickup}
                    onChange={handlePickupChange}
                    suggestions={pickupSuggestions}
                    onSelect={handleSelectPickup}
                    placeholder="Enter pickup location"
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
                    placeholder="Enter destination"
                    icon={<i className="ri-flag-fill text-lg" />}
                    showSuggestions={showDestinationSuggestions}
                    onFocus={() => setShowDestinationSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
                  />

                  <button
                    className="w-full bg-black text-white py-3 rounded-lg text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                    disabled={isRouting || !pickupCoords || !destinationCoords}
                    onClick={handleSeePrices}
                  >
                    {isRouting ? "Calculating route..." : "See Prices"}
                  </button>
                </div>

                {showPrice && fare !== null && routeGeometry && (
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
                )}

                {geoError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    <div className="flex items-center">
                      <i className="ri-error-warning-line mr-2"></i>
                      Location error: {geoError}
                    </div>
                  </div>
                )}

                <div className="mt-6 text-xs text-gray-600">
                  <a
                    href="https://www.openstreetmap.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-800 transition-colors"
                  >
                    © OpenStreetMap contributors
                  </a>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div
          className={`w-full lg:w-1/2 h-[50vh] lg:h-full ${
            isPaymentModalOpen ? "hidden lg:hidden" : ""
          }`}
        >
          <MapView
            pickupCoords={pickupCoords}
            destinationCoords={destinationCoords}
            routeGeometry={routeGeometry}
            currentCoords={currentCoords}
            driver={normalizeDriver(driver)}
          />
        </div>
      </div>

      {/* PAYMENT MODALS */}
      {isPaymentModalOpen && completedRide && session?.user && !showRideSummary && (
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
      )}

      {/* Ride History */}
      {showRideHistory && (
        <RideHistory
          rides={rideHistory}
          onBack={() => setShowRideHistory(false)}
          onClose={() => setShowRideHistory(false)}
        />
      )}
    </div>
  );
}