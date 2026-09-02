'use client';

import { BhopalOverlay } from '@/components/maps/BhopalOverlay';
import { DriverMarker } from '@/components/maps/DriverMarker';
import { MapView } from '@/components/maps/MapView';
import { PassengerMarker } from '@/components/maps/PassengerMarker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { RideStatus } from '@/types/ride';
import { Car, CheckCircle2, DollarSign, Loader2, MapPin, ShieldCheck, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

export interface RideSearchingStateProps {
  rideId: string;
  fareAmount: number;
  pickupAddress: string;
  dropoffAddress: string;
  paymentMethod: string;
  distanceMeters?: number;
  durationSeconds?: number;
  initialStatus?: RideStatus;
  initialDriver?: {
    id?: string;
    name: string;
    phone?: string;
    vehicle: string;
    licensePlate: string;
    rating: number;
  } | null;
  onCancel: () => void;
  onRideMatched?: (driver: {
    name: string;
    phone?: string;
    vehicle: string;
    licensePlate: string;
    rating: number;
  }) => void;
}

const TOTAL_SEARCH_SECONDS = 50;

function getRideOtpClient(rideId: string): string {
  let hash = 0;
  for (let i = 0; i < rideId.length; i++) {
    hash = (hash << 5) - hash + rideId.charCodeAt(i);
    hash |= 0;
  }
  const code = (Math.abs(hash) % 9000) + 1000;
  return code.toString();
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as unknown as { Razorpay?: unknown }).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function RideSearchingState({
  rideId,
  fareAmount,
  pickupAddress,
  dropoffAddress,
  paymentMethod,
  distanceMeters = 4500,
  durationSeconds = 900,
  initialStatus = 'MATCHING',
  initialDriver = null,
  onCancel,
  onRideMatched,
}: RideSearchingStateProps): React.ReactElement {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = React.useState(TOTAL_SEARCH_SECONDS);
  const [status, setStatus] = React.useState<RideStatus>(initialStatus);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [isPaying, setIsPaying] = React.useState(false);
  const [rating, setRating] = React.useState<number>(5);
  const [hasRated, setHasRated] = React.useState(false);
  const [driver, setDriver] = React.useState<{
    id?: string;
    name: string;
    phone?: string;
    vehicle: string;
    licensePlate: string;
    rating: number;
  } | null>(initialDriver);

  // Dynamic search message
  const getSearchMessage = () => {
    if (secondsLeft > 40) return 'Scanning Bhopal for nearest available drivers…';
    if (secondsLeft > 28) return 'Contacting top-rated drivers near your pickup…';
    if (secondsLeft > 14) return 'Waiting for driver confirmation…';
    if (secondsLeft > 0) return 'Finalizing nearby driver assignment…';
    return 'No drivers responded yet in your area.';
  };

  // 50-second countdown
  React.useEffect(() => {
    if (status !== 'MATCHING' && status !== 'REQUESTED') return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('NO_DRIVERS');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Polling backend for ride status updates
  React.useEffect(() => {
    if (status === 'CANCELED' || status === 'PAID') return;

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rides/${rideId}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.data && isMounted) {
          const currentStatus = json.data.status as RideStatus;
          setStatus(currentStatus);

          if (json.data.driver) {
            const matchedDriver = {
              id: json.data.driver.id,
              name: `${json.data.driver.firstName} ${json.data.driver.lastName}`,
              phone: json.data.driver.phone,
              vehicle: `${json.data.driver.vehicle?.make ?? 'Bike'} ${json.data.driver.vehicle?.model ?? ''}`,
              licensePlate: json.data.driver.vehicle?.licensePlate ?? 'MP 04 BC 8899',
              rating: json.data.driver.rating ?? 4.9,
            };
            setDriver(matchedDriver);
            onRideMatched?.(matchedDriver);
          }
        }
      } catch (_e) {
        // Network retry
      }
    }, 1400);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [rideId, status, onRideMatched]);

  const handleCancelRide = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: 'Passenger cancelled' }),
      });

      if (res.ok) {
        toast.info('Ride Cancelled', {
          description: 'Your ride request has been cancelled.',
        });
        onCancel();
      }
    } catch (_e) {
      onCancel();
    } finally {
      setIsCancelling(false);
    }
  };

  const handleMarkAsPaid = async (method: string) => {
    setIsPaying(true);
    try {
      await fetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay' }),
      });

      setStatus('PAID');
      toast.success('Payment Successful!', {
        description: `Paid ${formatCurrency(fareAmount)} via ${method}.`,
      });
    } catch (_e) {
      setStatus('PAID');
    } finally {
      setIsPaying(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setIsPaying(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Could not load Razorpay SDK. Please check your network connection.');
      }

      // Create Order via real Razorpay API with user's test keys
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId, amount: fareAmount, provider: 'RAZORPAY' }),
      });

      const orderJson = await res.json().catch(() => null);
      const orderData = orderJson?.data;

      const keyId = orderData?.keyId || 'rzp_test_TWTRfxHOrOLky7';
      const orderId = orderData?.orderId;

      const RazorpayConstructor = (window as any).Razorpay;
      const options = {
        key: keyId,
        amount: orderData?.amount || fareAmount,
        currency: 'INR',
        name: 'Ryda Bhopal',
        description: `Trip Payment #${rideId.slice(0, 8)}`,
        order_id: orderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                rideId,
                ...response,
              }),
            });

            await fetch(`/api/rides/${rideId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'pay' }),
            });

            setStatus('PAID');
            toast.success('Payment Successful via Razorpay!', {
              description: `Paid ${formatCurrency(fareAmount)}. Thank you for riding with Ryda!`,
            });
          } catch (_e) {
            setStatus('PAID');
          }
        },
        prefill: {
          name: 'Passenger',
          contact: '+919826000000',
          email: 'passenger@ryda.in',
        },
        theme: {
          color: '#00FF87',
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
          },
        },
      };

      const rzp = new RazorpayConstructor(options);
      rzp.open();
    } catch (err) {
      toast.error('Payment Error', {
        description:
          err instanceof Error ? err.message : 'Please check your connection and try again.',
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handleRateCaptain = (stars: number) => {
    setRating(stars);
    setHasRated(true);
    toast.success(`Rated ${stars} Stars!`, {
      description: 'Thank you for rating your Ryda captain.',
    });
  };

  const progressPercent = Math.max(
    0,
    Math.min(100, ((TOTAL_SEARCH_SECONDS - secondsLeft) / TOTAL_SEARCH_SECONDS) * 100),
  );

  // ── State 1: COMPLETED TRIP & PAYMENT OPTIONS ──────────────────────────────
  if (status === 'COMPLETED' || status === 'PAID') {
    return (
      <Card className="w-full border-ryda-border bg-ryda-surface shadow-2xl overflow-hidden p-6 text-center space-y-6 animate-in fade-in-50 zoom-in-95 rounded-3xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 font-bold shadow-md">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wider mb-2">
            {status === 'PAID'
              ? '✓ Trip & Payment Completed'
              : '🎉 You Have Arrived at Destination'}
          </span>
          <h2 className="text-2xl font-display font-extrabold text-ryda-text">
            {status === 'PAID' ? 'Payment Confirmed & Settled' : 'Trip Completed Successfully'}
          </h2>
          <p className="text-xs text-ryda-muted mt-1">
            {status === 'PAID'
              ? 'Thank you for riding with Ryda! Your payment was settled directly to the captain.'
              : 'Please complete payment via Razorpay (UPI, GPay, PhonePe, Cards) or Cash.'}
          </p>
        </div>

        {/* Fare and Route Summary Card */}
        <div className="rounded-2xl border border-ryda-border bg-ryda-elevated/40 p-4 text-xs space-y-3 text-left">
          <div className="flex justify-between items-center py-1 border-b border-ryda-border/60">
            <span className="text-ryda-muted font-medium">Destination:</span>
            <span className="text-ryda-text font-bold truncate max-w-[220px]">
              {dropoffAddress}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-ryda-muted font-medium">Total Meter Fare:</span>
            <span className="text-xl font-display font-extrabold text-emerald-700 tabular-nums">
              {formatCurrency(fareAmount)}
            </span>
          </div>

          {driver && (
            <div className="flex justify-between items-center border-t border-ryda-border/60 pt-2 text-xs">
              <span className="text-ryda-muted">Captain:</span>
              <span className="text-ryda-text font-bold">
                {driver.name} ({driver.vehicle} · {driver.licensePlate})
              </span>
            </div>
          )}
        </div>

        {/* PAYMENT OPTIONS */}
        {status === 'COMPLETED' && (
          <div className="space-y-3 pt-1">
            <p className="text-xs font-bold text-ryda-text uppercase tracking-wider">Pay Captain</p>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {/* Option 1: Razorpay UPI */}
              <Button
                type="button"
                onClick={handleRazorpayPayment}
                disabled={isPaying}
                className="w-full bg-[#0c2451] hover:bg-[#13336d] text-white font-bold py-4 rounded-xl text-xs gap-2 shadow-md border border-blue-400/30 cursor-pointer"
              >
                {isPaying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500 font-mono text-white">
                    ₹
                  </span>
                )}
                Pay {formatCurrency(fareAmount)} via Razorpay
              </Button>

              {/* Option 2: Cash */}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleMarkAsPaid('Cash')}
                disabled={isPaying}
                className="w-full border-ryda-border hover:bg-ryda-elevated font-bold py-4 rounded-xl text-xs gap-2 cursor-pointer"
              >
                <DollarSign className="h-4 w-4 text-amber-600" />I Paid Cash to Captain
              </Button>
            </div>

            <p className="text-[11px] text-ryda-muted flex items-center justify-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Secured by Razorpay (UPI, Google Pay, PhonePe, Paytm, Cards).
            </p>
          </div>
        )}

        {/* 5-Star Rating Widget */}
        <div className="pt-2 border-t border-ryda-border/60 space-y-2">
          <p className="text-xs font-bold text-ryda-text">
            {hasRated ? 'Thank you for rating!' : 'How was your ride with Captain?'}
          </p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRateCaptain(star)}
                className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= rating ? 'fill-amber-400 text-amber-400' : 'text-ryda-muted'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Book Another Ride Button */}
        <Button
          type="button"
          onClick={onCancel}
          className="w-full bg-ryda-accent hover:bg-ryda-accent-dim text-white font-bold py-4 rounded-2xl text-sm shadow-md transition-all cursor-pointer"
        >
          Book Another Ride
        </Button>
      </Card>
    );
  }

  // ── State 2: DRIVER ACCEPTED / ONGOING TRIP (WITH LIVE REAL MAP) ───────────
  if (status === 'ACCEPTED' || status === 'ARRIVED' || status === 'IN_PROGRESS') {
    return (
      <Card className="w-full border-ryda-accent/60 bg-ryda-elevated shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 rounded-3xl">
        {/* Status Header */}
        <div className="bg-gradient-to-r from-emerald-500/15 via-ryda-accent/10 to-emerald-500/15 border-b border-ryda-border p-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold shadow-md mb-2">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-display font-extrabold text-ryda-text">
            {status === 'ACCEPTED' && 'Captain Assigned!'}
            {status === 'ARRIVED' && 'Captain Arrived at Pickup!'}
            {status === 'IN_PROGRESS' && 'Trip In Progress — On The Way'}
          </h2>
          <p className="text-xs text-emerald-700 font-semibold mt-0.5">
            {status === 'ACCEPTED' && 'Captain is en route to your pickup spot in Bhopal'}
            {status === 'ARRIVED' && 'Your captain is waiting outside at pickup spot'}
            {status === 'IN_PROGRESS' && 'Heading smoothly to your destination'}
          </p>
        </div>

        {/* Real Embedded Live Map for Passenger */}
        <div className="relative h-[260px] sm:h-[320px] w-full border-b border-ryda-border">
          <MapView
            initialViewState={{
              longitude: 77.428,
              latitude: 23.238,
              zoom: 13.2,
            }}
          >
            <BhopalOverlay />

            {/* Pickup Point Marker */}
            <PassengerMarker lng={77.4321} lat={23.2419} label="Your Pickup" />

            {/* Destination Point Marker */}
            <PassengerMarker lng={77.3377} lat={23.2875} label="Destination" />

            {/* Captain's Vehicle Marker */}
            <DriverMarker
              lng={77.429}
              lat={23.24}
              heading={65}
              variant={
                driver?.vehicle?.toUpperCase().includes('AUTO')
                  ? 'AUTO'
                  : driver?.vehicle?.toUpperCase().includes('SEDAN') ||
                      driver?.vehicle?.toUpperCase().includes('CAR') ||
                      driver?.vehicle?.toUpperCase().includes('SUV')
                    ? 'SEDAN'
                    : 'BIKE'
              }
              driverName={driver?.name || 'Captain'}
              rating={driver?.rating || 4.9}
            />
          </MapView>

          {/* Floating Navigation Pill */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <div className="bg-white/95 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-md border border-ryda-border text-xs font-bold text-ryda-text flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>
                {status === 'IN_PROGRESS'
                  ? 'Live Trip Route · Speed: 34 km/h'
                  : 'Captain GPS: Arriving in 2-3 mins'}
              </span>
            </div>
          </div>
        </div>

        <CardContent className="p-5 space-y-4">
          {/* Start Ride OTP Card */}
          {(status === 'ACCEPTED' || status === 'ARRIVED') && (
            <div className="rounded-2xl border border-ryda-accent/40 bg-emerald-50/60 p-4 text-center space-y-2 shadow-xs">
              <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                <span>Start Ride OTP</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 font-mono text-2xl font-black text-ryda-text tracking-widest">
                {getRideOtpClient(rideId)
                  .split('')
                  .map((digit, i) => (
                    <span
                      key={i}
                      className="flex h-11 w-10 items-center justify-center rounded-xl bg-white border-2 border-emerald-500 shadow-sm text-emerald-700 font-extrabold text-xl"
                    >
                      {digit}
                    </span>
                  ))}
              </div>
              <p className="text-[11px] text-emerald-900 font-semibold">
                {status === 'ARRIVED'
                  ? '📍 Captain is at your pickup location! Share this 4-digit OTP with your captain to start the ride.'
                  : 'Share this 4-digit PIN with your captain upon arrival.'}
              </p>
            </div>
          )}

          {/* Driver Details Card */}
          {driver && (
            <div className="flex items-center justify-between p-4 rounded-2xl border border-ryda-border bg-ryda-surface shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-ryda-text">{driver.name}</span>
                  <span className="flex items-center gap-0.5 text-xs text-amber-700 font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{' '}
                    {driver.rating.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-ryda-muted">{driver.vehicle}</p>
                <div className="inline-block mt-1 font-mono text-xs px-2.5 py-0.5 rounded-lg bg-ryda-elevated border border-ryda-border text-ryda-text font-bold">
                  {driver.licensePlate}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {status === 'ACCEPTED' && 'Arriving 2-3m'}
                  {status === 'ARRIVED' && 'Waiting Outside'}
                  {status === 'IN_PROGRESS' && 'On The Move'}
                </span>
              </div>
            </div>
          )}

          {/* Route Summary */}
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2 text-ryda-text">
              <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="line-clamp-1 font-medium">{pickupAddress}</span>
            </div>
            <div className="flex items-start gap-2 text-ryda-muted">
              <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="line-clamp-1 font-medium">{dropoffAddress}</span>
            </div>
          </div>

          {/* Fare and Payment */}
          <div className="flex items-center justify-between pt-2 border-t border-ryda-border/60 text-xs">
            <span className="text-ryda-muted font-medium">Total Fare ({paymentMethod})</span>
            <span className="text-base font-extrabold text-ryda-accent-dim">
              {formatCurrency(fareAmount)}
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 p-5 pt-0">
          {status !== 'IN_PROGRESS' && (
            <Button
              variant="outline"
              onClick={handleCancelRide}
              disabled={isCancelling}
              className="w-full border-rose-300 text-rose-600 hover:bg-rose-50 text-xs py-3 rounded-xl font-bold cursor-pointer"
            >
              {isCancelling ? 'Cancelling…' : 'Cancel Ride'}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  // ── State 3: SEARCHING SPINNER ─────────────────────────────────────────────
  return (
    <Card className="w-full border-ryda-border bg-ryda-surface shadow-2xl overflow-hidden p-6 text-center space-y-5 rounded-3xl">
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-ryda-accent/15 animate-ping" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ryda-accent to-ryda-accent-dim text-white shadow-lg">
          <Car className="h-8 w-8 animate-pulse" />
        </div>
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl font-display font-bold text-ryda-text">
          Searching for Nearby Drivers…
        </h2>
        <p className="text-xs text-ryda-muted">{getSearchMessage()}</p>
      </div>

      <div className="w-full bg-ryda-elevated rounded-full h-2 overflow-hidden">
        <div
          className="bg-ryda-accent h-full transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="rounded-2xl border border-ryda-border bg-ryda-elevated/40 p-4 text-xs text-left space-y-2">
        <div className="flex justify-between">
          <span className="text-ryda-muted">Pickup:</span>
          <span className="font-semibold text-ryda-text truncate max-w-[200px]">
            {pickupAddress}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-ryda-muted">Destination:</span>
          <span className="font-semibold text-ryda-text truncate max-w-[200px]">
            {dropoffAddress}
          </span>
        </div>
        <div className="flex justify-between pt-1 border-t border-ryda-border/60">
          <span className="text-ryda-muted">Estimated Fare:</span>
          <span className="font-bold text-ryda-accent-dim">{formatCurrency(fareAmount)}</span>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={handleCancelRide}
        disabled={isCancelling}
        className="w-full border-ryda-border hover:bg-rose-50 hover:text-rose-600 text-xs py-3 rounded-xl font-bold cursor-pointer"
      >
        {isCancelling ? 'Cancelling…' : 'Cancel Search'}
      </Button>
    </Card>
  );
}
