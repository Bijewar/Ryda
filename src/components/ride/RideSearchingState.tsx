'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Car, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Navigation, 
  Phone, 
  RotateCw, 
  ShieldCheck, 
  Star, 
  X, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDistance, formatDuration } from '@/lib/utils';
import type { RideStatus } from '@/types/ride';

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
  const [compensationNotice, setCompensationNotice] = React.useState<string | null>(null);
  const [driver, setDriver] = React.useState<{
    id?: string;
    name: string;
    phone?: string;
    vehicle: string;
    licensePlate: string;
    rating: number;
  } | null>(initialDriver);

  // Dynamic phase text based on elapsed time
  const getSearchMessage = () => {
    if (compensationNotice) return 'Driver cancelled · Finding another driver for you…';
    if (secondsLeft > 40) return 'Scanning Bhopal for nearest available drivers…';
    if (secondsLeft > 28) return 'Contacting top-rated drivers near your pickup…';
    if (secondsLeft > 14) return 'Waiting for driver confirmation…';
    if (secondsLeft > 0) return 'Finalizing nearby driver assignment…';
    return 'No drivers responded yet in your area.';
  };

  // 50-second countdown interval
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

  // Polling backend for ride status updates & driver match
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
              vehicle: `${json.data.driver.vehicle?.make ?? 'Sedan'} ${json.data.driver.vehicle?.model ?? 'Car'}`,
              licensePlate: json.data.driver.vehicle?.licensePlate ?? 'MP 04 AB 1234',
              rating: json.data.driver.rating ?? 4.9,
            };
            setDriver(matchedDriver);
            onRideMatched?.(matchedDriver);
          }
        }
      } catch (_e) {
        // network retry
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [rideId, status, onRideMatched]);

  const handleCancelRide = async () => {
    setIsCancelling(true);
    try {
      await fetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: 'Passenger canceled request' }),
      });
      toast.info('Ride request canceled', {
        description: 'You can modify your pickup or request a new ride anytime.',
      });
      onCancel();
    } catch {
      toast.error('Could not cancel request. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRetrySearch = () => {
    setSecondsLeft(TOTAL_SEARCH_SECONDS);
    setStatus('MATCHING');
    toast.info('Rescanning for drivers…', {
      description: 'Looking for nearby active drivers in Bhopal.',
    });
  };

  // Launch Razorpay test payment modal
  const handleRazorpayPayment = async () => {
    setIsPaying(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay payment gateway. Please check your internet connection.');
      }

      // 1. Create order on backend
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId,
          provider: 'RAZORPAY',
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(err?.error?.message ?? 'Could not initialize Razorpay order');
      }

      const json = await res.json();
      const orderData = json.data;

      // 2. Open Razorpay Checkout Modal
      const RazorpayConstructor = (window as unknown as {
        Razorpay: new (opts: unknown) => { open: () => void; on: (event: string, handler: (resp: unknown) => void) => void };
      }).Razorpay;

      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TWTRfxHOrOLky7';

      const options = {
        key: rzpKey,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Ryda Ride Bhopal',
        description: `Ride Payment (${pickupAddress.split(',')[0]} → ${dropoffAddress.split(',')[0]})`,
        order_id: orderData.providerOrderId,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // 3. Verify payment signature on backend
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                rideId,
                provider: 'RAZORPAY',
                providerOrderId: response.razorpay_order_id,
                providerPaymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              throw new Error('Payment signature verification failed');
            }

            setStatus('PAID');
            toast.success('Payment Verified! 💳', {
              description: `₹${(fareAmount / 100).toFixed(0)} paid successfully via Razorpay.`,
            });
          } catch (err) {
            toast.error('Payment Verification Failed', {
              description: err instanceof Error ? err.message : 'Please contact support.',
            });
          }
        },
        prefill: {
          name: 'Passenger',
          email: 'passenger@ryda.app',
          contact: '9876543210',
        },
        theme: {
          color: '#00FF87',
        },
        modal: {
          ondismiss: function () {
            setIsPaying(false);
          },
        },
      };

      const rzp = new RazorpayConstructor(options);
      rzp.open();
    } catch (err) {
      toast.error('Payment Error', {
        description: err instanceof Error ? err.message : 'Could not launch Razorpay checkout.',
      });
    } finally {
      setIsPaying(false);
    }
  };

  const progressPercent = Math.max(0, Math.min(100, ((TOTAL_SEARCH_SECONDS - secondsLeft) / TOTAL_SEARCH_SECONDS) * 100));

  // ── State 1: COMPLETED TRIP (Payment Pending or Paid) ───────────────────────
  if (status === 'COMPLETED' || status === 'PAID') {
    return (
      <Card className="w-full border-ryda-accent bg-ryda-elevated shadow-2xl overflow-hidden p-6 text-center space-y-5 animate-in fade-in-50 zoom-in-95">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ryda-accent text-ryda-bg font-bold shadow-lg">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-ryda-text">
            {status === 'PAID' ? 'Payment Completed!' : 'Trip Completed!'}
          </h2>
          <p className="text-xs text-ryda-muted mt-1">
            {status === 'PAID'
              ? 'Thank you for riding with Ryda in Bhopal.'
              : 'Please complete payment to finalize your ride.'}
          </p>
        </div>

        <div className="rounded-xl border border-ryda-border bg-ryda-surface p-3.5 text-xs space-y-2.5 text-left">
          <div className="flex justify-between">
            <span className="text-ryda-muted">Destination:</span>
            <span className="text-ryda-text font-medium truncate max-w-[200px]">{dropoffAddress}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-ryda-muted">Fare Amount ({paymentMethod}):</span>
            <span className="text-base font-bold text-ryda-accent">{formatCurrency(fareAmount)}</span>
          </div>
          {driver && (
            <div className="flex justify-between border-t border-ryda-border/60 pt-2 text-xs">
              <span className="text-ryda-muted">Driver:</span>
              <span className="text-ryda-text font-medium">{driver.name} ({driver.vehicle})</span>
            </div>
          )}
        </div>

        {/* Razorpay Test Mode Payment Button */}
        {status === 'COMPLETED' && paymentMethod !== 'CASH' && (
          <div className="space-y-2">
            <Button
              onClick={handleRazorpayPayment}
              disabled={isPaying}
              className="w-full bg-[#0c2451] hover:bg-[#13336d] text-white font-bold py-5 text-sm gap-2 border border-blue-400/30 shadow-[0_0_20px_rgba(12,36,81,0.5)]"
            >
              {isPaying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500 font-mono">₹</span>
              )}
              Pay {formatCurrency(fareAmount)} with Razorpay
            </Button>
            <p className="text-[10px] text-ryda-muted flex items-center justify-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-ryda-accent" /> Secured by Razorpay (UPI / Cards / NetBanking)
            </p>
          </div>
        )}

        {/* Cash payment confirmation */}
        {status === 'COMPLETED' && paymentMethod === 'CASH' && (
          <div className="p-3 rounded-lg bg-ryda-surface border border-ryda-border text-xs text-ryda-muted">
            💵 Cash Trip — Please hand over <span className="text-ryda-accent font-bold">{formatCurrency(fareAmount)}</span> to your driver.
          </div>
        )}

        {/* Book next ride button */}
        {(status === 'PAID' || paymentMethod === 'CASH') && (
          <Button
            onClick={onCancel}
            className="w-full bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim font-bold py-5 text-sm"
          >
            Book Another Ride
          </Button>
        )}
      </Card>
    );
  }

  // ── State 2: DRIVER ACCEPTED / ONGOING TRIP ────────────────────────────────
  if (status === 'ACCEPTED' || status === 'ARRIVED' || status === 'IN_PROGRESS') {
    return (
      <Card className="w-full border-ryda-accent/60 bg-ryda-elevated shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
        <div className="bg-gradient-to-r from-ryda-accent/20 to-ryda-accent/10 border-b border-ryda-accent/30 p-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ryda-accent text-ryda-bg font-bold shadow-lg mb-2">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-display font-bold text-ryda-text">
            {status === 'ACCEPTED' && 'Driver Assigned!'}
            {status === 'ARRIVED' && 'Driver Arrived!'}
            {status === 'IN_PROGRESS' && 'Trip In Progress'}
          </h2>
          <p className="text-xs text-ryda-accent font-medium">
            {status === 'ACCEPTED' && 'Driver is en route to your pickup spot'}
            {status === 'ARRIVED' && 'Your driver is waiting at pickup location'}
            {status === 'IN_PROGRESS' && 'Heading to your destination'}
          </p>
        </div>

        <CardContent className="p-5 space-y-4">
          {/* Ola / Uber Style Start OTP Card */}
          {(status === 'ACCEPTED' || status === 'ARRIVED') && (
            <div className="rounded-xl border border-ryda-accent/40 bg-gradient-to-r from-ryda-accent/15 via-emerald-500/10 to-ryda-accent/15 p-3.5 text-center space-y-2 shadow-md">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-ryda-accent uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                <span>Start Ride OTP</span>
              </div>
              <div className="flex items-center justify-center gap-2.5 font-mono text-2xl font-black text-ryda-text tracking-widest">
                {getRideOtpClient(rideId).split('').map((digit, i) => (
                  <span key={i} className="flex h-10 w-9 items-center justify-center rounded-lg bg-ryda-bg border border-ryda-accent/50 shadow-inner text-ryda-accent">
                    {digit}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-ryda-muted font-medium">
                {status === 'ARRIVED'
                  ? '📍 Driver is at your pickup location! Share this 4-digit OTP with your driver to start the ride.'
                  : 'Share this 4-digit PIN with your driver upon arrival.'}
              </p>
            </div>
          )}

          {/* Driver Details Card */}
          {driver && (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-ryda-border bg-ryda-surface/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base text-ryda-text">{driver.name}</span>
                  <span className="flex items-center gap-0.5 text-xs text-yellow-400 font-medium">
                    <Star className="h-3.5 w-3.5 fill-yellow-400" /> {driver.rating.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-ryda-muted">{driver.vehicle}</p>
                <div className="inline-block mt-1 font-mono text-xs px-2 py-0.5 rounded bg-ryda-bg border border-ryda-border text-ryda-accent font-bold">
                  {driver.licensePlate}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-ryda-accent/20 text-ryda-accent border border-ryda-accent/30">
                  {status === 'ACCEPTED' && 'Arriving in 3-5m'}
                  {status === 'ARRIVED' && 'Waiting Outside'}
                  {status === 'IN_PROGRESS' && 'On the Move'}
                </span>
              </div>
            </div>
          )}

          {/* Route Summary */}
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2 text-ryda-text">
              <MapPin className="h-4 w-4 text-ryda-accent shrink-0 mt-0.5" />
              <span className="line-clamp-1">{pickupAddress}</span>
            </div>
            <div className="flex items-start gap-2 text-ryda-muted">
              <MapPin className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <span className="line-clamp-1">{dropoffAddress}</span>
            </div>
          </div>

          {/* Fare and Payment */}
          <div className="flex items-center justify-between pt-2 border-t border-ryda-border/60 text-xs">
            <span className="text-ryda-muted">Total Fare ({paymentMethod})</span>
            <span className="text-base font-bold text-ryda-accent">{formatCurrency(fareAmount)}</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 p-4 pt-0">
          {status !== 'IN_PROGRESS' && (
            <Button
              variant="outline"
              onClick={handleCancelRide}
              disabled={isCancelling}
              className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs py-3"
            >
              {isCancelling ? 'Canceling…' : 'Cancel Ride'}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  // ── State 2: TIMEOUT / NO DRIVERS ──────────────────────────────────────────
  if (status === 'NO_DRIVERS' || secondsLeft === 0) {
    return (
      <Card className="w-full border-ryda-border bg-ryda-elevated shadow-xl p-5 space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-ryda-text">No Drivers Accepted Yet</h3>
          <p className="text-xs text-ryda-muted max-w-xs mx-auto">
            All drivers nearby are currently busy on active trips in Bhopal.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-ryda-surface border border-ryda-border text-left text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-ryda-muted">Pickup:</span>
            <span className="text-ryda-text font-medium truncate max-w-[200px]">{pickupAddress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ryda-muted">Fare:</span>
            <span className="text-ryda-accent font-bold">{formatCurrency(fareAmount)}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-ryda-border text-ryda-muted hover:text-ryda-text"
          >
            Change Location
          </Button>
          <Button
            onClick={handleRetrySearch}
            className="flex-1 bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim font-semibold gap-1.5"
          >
            <RotateCw className="h-4 w-4" />
            Try Again (50s)
          </Button>
        </div>
      </Card>
    );
  }

  // ── State 3: ACTIVE 50-SECOND RADAR SEARCHING STATE (Ola/Uber Style) ────────
  return (
    <Card className="w-full border-ryda-accent/40 bg-ryda-elevated shadow-2xl overflow-hidden">
      <CardHeader className="pb-2 text-center">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="border-ryda-accent/40 text-ryda-accent bg-ryda-accent/10 px-2.5 py-0.5 text-xs font-mono">
            Searching Drivers
          </Badge>
          <span className="text-xs font-mono font-bold text-ryda-accent bg-ryda-surface px-2 py-1 rounded-lg border border-ryda-border">
            ⏱ {secondsLeft}s
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6 text-center">
        {/* Animated Radar Pulse Screen */}
        <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
          {/* Concentric Pulse Rings */}
          <div className="absolute h-full w-full rounded-full border border-ryda-accent/30 animate-ping opacity-40 duration-1000" />
          <div className="absolute h-28 w-28 rounded-full border border-ryda-accent/40 animate-pulse bg-ryda-accent/5" />
          <div className="absolute h-20 w-20 rounded-full border border-ryda-accent/60 bg-ryda-accent/15" />
          
          {/* Rotating Radar Beam */}
          <div className="absolute h-36 w-36 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-tr from-transparent via-ryda-accent/20 to-transparent animate-spin origin-center duration-700" />
          </div>

          {/* Central Car Icon */}
          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-ryda-accent text-ryda-bg shadow-[0_0_25px_rgba(0,255,135,0.6)]">
            <Car className="h-7 w-7 animate-bounce" />
          </div>
        </div>

        {/* Dynamic Status Text */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-ryda-text">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ryda-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-ryda-accent" />
            </span>
            <span>{getSearchMessage()}</span>
          </div>
          <p className="text-xs text-ryda-muted">
            Requesting rides within 5 km of Bhopal service area
          </p>
        </div>

        {/* Customer Compensation Alert Banner */}
        {compensationNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs space-y-0.5 animate-in fade-in-50">
            <p className="font-bold flex items-center justify-center gap-1.5">
              <span>🎁 Inconvenience Compensation Added</span>
            </p>
            <p className="text-[11px] text-emerald-200/90">{compensationNotice}</p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-ryda-surface rounded-full h-1.5 overflow-hidden border border-ryda-border/60">
          <div
            className="bg-gradient-to-r from-ryda-accent to-emerald-400 h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Trip Summary Card */}
        <div className="rounded-xl border border-ryda-border bg-ryda-surface/70 p-3.5 text-left text-xs space-y-2">
          <div className="flex items-start gap-2 text-ryda-text">
            <MapPin className="h-3.5 w-3.5 text-ryda-accent shrink-0 mt-0.5" />
            <span className="truncate font-medium">{pickupAddress}</span>
          </div>
          <div className="flex items-start gap-2 text-ryda-muted">
            <MapPin className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
            <span className="truncate font-medium">{dropoffAddress}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-ryda-border/50 font-medium">
            <span className="text-ryda-muted">Fare ({paymentMethod}):</span>
            <span className="text-sm font-bold text-ryda-accent">{formatCurrency(fareAmount)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          variant="outline"
          onClick={handleCancelRide}
          disabled={isCancelling}
          className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 py-4 text-xs font-semibold gap-1.5"
        >
          {isCancelling ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Canceling Request…
            </>
          ) : (
            <>
              <X className="h-3.5 w-3.5" />
              Cancel Request
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
