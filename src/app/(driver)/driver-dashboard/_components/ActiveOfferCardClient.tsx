'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Check, 
  CheckCircle2, 
  Clock, 
  Flag, 
  KeyRound,
  Loader2, 
  MapPin, 
  Navigation, 
  Phone, 
  Radio, 
  ShieldCheck, 
  Sparkles, 
  User, 
  Wifi, 
  ExternalLink,
  X 
} from 'lucide-react';
import { RideRequestCard } from '@/components/driver/RideRequestCard';
import type { RideOfferPayload } from '@/lib/realtime/events';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DriverCancelReasonModal } from '@/components/driver/DriverCancelReasonModal';
import { DriverDemandCard } from '@/components/driver/DriverDemandCard';
import type { CancellationReasonCategory } from '@/types/reliability';
import { formatCurrency, formatDistance, formatDuration } from '@/lib/utils';
import { toast } from 'sonner';

export interface ActiveTripPayload {
  rideId: string;
  passengerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceMeters: number;
  durationSeconds: number;
  fareAmount: number;
  surgeMultiplier: number;
  status: 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS';
  paymentMethod: string;
}

export interface ActiveOfferCardProps {
  driverId: string;
  isOnline: boolean;
  initialOffer?: RideOfferPayload | null;
  initialActiveTrip?: ActiveTripPayload | null;
  monthlyCancellationsUsed?: number;
  cancellationAllowance?: number;
}

// Synthesize a pleasant alert chime
function playRideChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (_e) {
    // Audio synthesis fallback
  }
}

export default function ActiveOfferCard({
  driverId,
  isOnline,
  initialOffer = null,
  initialActiveTrip = null,
  monthlyCancellationsUsed = 0,
  cancellationAllowance = 15,
}: ActiveOfferCardProps): React.ReactElement {
  const router = useRouter();
  const [offer, setOffer] = React.useState<RideOfferPayload | null>(initialOffer);
  const [activeTrip, setActiveTrip] = React.useState<ActiveTripPayload | null>(initialActiveTrip);
  const [otpInput, setOtpInput] = React.useState('');
  const [isUpdatingTrip, setIsUpdatingTrip] = React.useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
  const seenRideIdsRef = React.useRef<Set<string>>(new Set());

  // Real-time polling for incoming offers & active ongoing trips
  React.useEffect(() => {
    if (!isOnline) {
      setOffer(null);
      setActiveTrip(null);
      return;
    }

    let isMounted = true;

    const pollOffersAndTrips = async () => {
      try {
        const res = await fetch(`/api/drivers/${driverId}/offers`);
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && json.data) {
          if (json.data.activeTrip) {
            setActiveTrip(json.data.activeTrip as ActiveTripPayload);
            setOffer(null);
          } else if (json.data.offer) {
            const incoming = json.data.offer as RideOfferPayload;
            setActiveTrip(null);
            if (!seenRideIdsRef.current.has(incoming.rideId)) {
              seenRideIdsRef.current.add(incoming.rideId);
              playRideChime();
              toast.info('New Ride Request!', {
                description: `Pickup: ${incoming.pickupAddress}`,
              });
            }
            setOffer(incoming);
          } else {
            setOffer(null);
            setActiveTrip(null);
          }
        }
      } catch (_e) {
        // Network retry
      }
    };

    void pollOffersAndTrips();
    const interval = setInterval(pollOffersAndTrips, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [driverId, isOnline]);

  const handleAccept = async (rideId: string): Promise<void> => {
    try {
      const res = await fetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', driverId }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(err?.error?.message ?? 'Could not accept ride');
      }

      toast.success('Ride Accepted!', {
        description: 'Navigating to passenger pickup spot in Bhopal.',
      });

      // Optimistically transition to active trip view
      if (offer) {
        setActiveTrip({
          rideId: offer.rideId,
          passengerName: offer.passengerName,
          pickupAddress: offer.pickupAddress,
          dropoffAddress: offer.dropoffAddress,
          distanceMeters: offer.distanceMeters,
          durationSeconds: offer.durationSeconds,
          fareAmount: offer.fareAmount,
          surgeMultiplier: offer.surgeMultiplier,
          status: 'ACCEPTED',
          paymentMethod: 'UPI / Cash',
        });
      }
      setOffer(null);
      setOtpInput('');
      router.refresh();
    } catch (err) {
      toast.error('Accept Failed', {
        description: err instanceof Error ? err.message : 'Ride is no longer available.',
      });
      setOffer(null);
    }
  };

  const handleReject = async (rideId: string, _reason: 'REJECTED' | 'TIMEOUT'): Promise<void> => {
    setOffer(null);
    try {
      await fetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', driverId }),
      });
    } catch {
      // ignore
    }
  };

  // Progress trip lifecycle (ACCEPTED -> ARRIVED -> IN_PROGRESS -> COMPLETED)
  const handleTripAction = async (action: 'arrived' | 'start' | 'complete' | 'cancel', otp?: string) => {
    if (!activeTrip) return;
    setIsUpdatingTrip(true);

    try {
      const res = await fetch(`/api/rides/${activeTrip.rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, driverId, otp }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(err?.error?.message ?? 'Trip status update failed');
      }

      if (action === 'arrived') {
        setActiveTrip((prev) => (prev ? { ...prev, status: 'ARRIVED' } : null));
        setOtpInput('');
        toast.success('Arrived at Pickup', {
          description: 'Passenger has been notified. Ask passenger for their 4-digit OTP.',
        });
      } else if (action === 'start') {
        setActiveTrip((prev) => (prev ? { ...prev, status: 'IN_PROGRESS' } : null));
        setOtpInput('');
        toast.success('OTP Verified · Trip Started! 🚀', {
          description: `Heading to ${activeTrip.dropoffAddress}`,
        });
      } else if (action === 'complete') {
        toast.success('Trip Completed! 🎉', {
          description: `Collected ${formatCurrency(activeTrip.fareAmount)}. Returning to radar standby.`,
        });
        setActiveTrip(null);
        setOtpInput('');
        router.refresh();
      }
    } catch (err) {
      toast.error('Action Failed', {
        description: err instanceof Error ? err.message : 'Please check connection.',
      });
    } finally {
      setIsUpdatingTrip(false);
    }
  };

  // Confirm categorized cancellation
  const handleConfirmCancel = async (category: CancellationReasonCategory, reasonText: string) => {
    if (!activeTrip) return;
    setIsUpdatingTrip(true);
    try {
      const res = await fetch(`/api/rides/${activeTrip.rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          driverId,
          category,
          reason: reasonText,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? 'Cancellation failed');

      if (json.data?.penalized) {
        toast.warning('Trip Cancelled (Fee Applied)', {
          description: `A cancellation fee of ${formatCurrency(json.data.penaltyAmount)} was applied.`,
        });
      } else {
        toast.info('Trip Cancelled', {
          description: 'Trip cancelled without penalty.',
        });
      }

      setActiveTrip(null);
      setOtpInput('');
      router.refresh();
    } catch (err) {
      toast.error('Cancel Failed', {
        description: err instanceof Error ? err.message : 'Please check connection.',
      });
    } finally {
      setIsUpdatingTrip(false);
    }
  };

  // ── State 1: ACTIVE ONGOING TRIP (Accepted by driver) ─────────────────────
  if (activeTrip) {
    return (
      <>
        <DriverCancelReasonModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={handleConfirmCancel}
          monthlyCancellationsUsed={monthlyCancellationsUsed}
          cancellationAllowance={cancellationAllowance}
        />
        <Card className="w-full border-ryda-accent/60 bg-ryda-elevated shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
          <CardHeader className="bg-ryda-accent/10 border-b border-ryda-accent/20 pb-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-ryda-accent text-ryda-bg font-bold text-xs px-2.5 py-0.5">
                {activeTrip.status === 'ACCEPTED' && '🚗 Driver En Route'}
                {activeTrip.status === 'ARRIVED' && '📍 Arrived at Pickup'}
                {activeTrip.status === 'IN_PROGRESS' && '🛣️ Trip In Progress'}
              </Badge>
              <span className="font-mono text-sm font-bold text-ryda-accent">
                {formatCurrency(activeTrip.fareAmount)}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* Passenger Info */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-ryda-surface border border-ryda-border">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ryda-accent/15 text-ryda-accent font-bold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ryda-text">{activeTrip.passengerName}</p>
                  <p className="text-xs text-ryda-muted">{activeTrip.paymentMethod}</p>
                </div>
              </div>
              <div className="text-right text-xs text-ryda-accent font-medium">
                Verified Rider
              </div>
            </div>

            {/* Route Steps */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-ryda-accent shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-ryda-muted block">Pickup</span>
                  <span className="text-ryda-text font-medium">{activeTrip.pickupAddress}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-ryda-muted block">Destination</span>
                  <span className="text-ryda-text font-medium">{activeTrip.dropoffAddress}</span>
                </div>
              </div>
            </div>

            {/* Google Maps Live Navigation Button */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                activeTrip.status === 'IN_PROGRESS' ? activeTrip.dropoffAddress : activeTrip.pickupAddress,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border border-ryda-accent/40 bg-ryda-surface hover:bg-ryda-surface/90 text-xs font-semibold text-ryda-accent transition-all shadow-sm group"
            >
              <Navigation className="h-3.5 w-3.5 group-hover:rotate-45 transition-transform" />
              <span>
                {activeTrip.status === 'IN_PROGRESS'
                  ? 'Get Directions to Dropoff (Google Maps)'
                  : 'Get Directions to Pickup (Google Maps)'}
              </span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 p-4 pt-0">
            {activeTrip.status === 'ACCEPTED' && (
              <Button
                onClick={() => handleTripAction('arrived')}
                disabled={isUpdatingTrip}
                className="w-full bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim font-bold py-5 text-sm gap-2"
              >
                {isUpdatingTrip ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                I Have Arrived at Pickup
              </Button>
            )}

            {activeTrip.status === 'ARRIVED' && (
              <div className="w-full space-y-3 p-3.5 rounded-xl border border-ryda-accent/40 bg-ryda-surface/90">
                <div className="flex items-center justify-between text-xs font-semibold text-ryda-accent">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="h-4 w-4" /> Enter Passenger Start OTP
                  </span>
                  <span className="text-[10px] text-ryda-muted font-normal">4-Digit PIN</span>
                </div>
                <div className="flex items-center justify-center">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="• • • •"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="text-center font-mono text-2xl font-bold tracking-[0.4em] h-12 w-48 bg-ryda-bg border-ryda-accent/60 focus-visible:ring-ryda-accent"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-center text-ryda-muted">
                  Ask passenger for the 4-digit OTP shown on their screen.
                </p>

                <Button
                  onClick={() => handleTripAction('start', otpInput)}
                  disabled={isUpdatingTrip || otpInput.trim().length !== 4}
                  className="w-full bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim font-bold py-5 text-sm gap-2"
                >
                  {isUpdatingTrip ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Verify OTP & Start Ride
                </Button>
              </div>
            )}

            {activeTrip.status === 'IN_PROGRESS' && (
              <Button
                onClick={() => handleTripAction('complete')}
                disabled={isUpdatingTrip}
                className="w-full bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim font-bold py-5 text-sm gap-2 shadow-[0_0_20px_rgba(0,255,135,0.4)]"
              >
                {isUpdatingTrip ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                Complete Trip & Collect {formatCurrency(activeTrip.fareAmount)}
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={() => setIsCancelModalOpen(true)}
              disabled={isUpdatingTrip}
              className="w-full text-xs text-destructive hover:bg-destructive/10 h-8"
            >
              Cancel Trip
            </Button>
          </CardFooter>
        </Card>
      </>
    );
  }

  // ── State 2: INCOMING ACTIVE OFFER (Request Popup) ────────────────────────
  if (offer) {
    return (
      <div className="animate-in fade-in-50 zoom-in-95">
        <RideRequestCard
          offer={offer}
          durationSeconds={15}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      </div>
    );
  }

  // ── State 3: STANDBY (Online Radar Listening + AI Demand) ──────────────────
  if (isOnline) {
    return (
      <div className="space-y-4">
        {/* AI Repositioning Opportunity Widget */}
        <DriverDemandCard driverId={driverId} isOnline={isOnline} />

        <Card className="w-full border-ryda-accent/30 bg-ryda-elevated shadow-lg overflow-hidden">
          <CardContent className="p-6 text-center space-y-4">
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <span className="absolute h-full w-full rounded-full border border-ryda-accent/30 animate-ping opacity-60" />
              <span className="absolute h-16 w-16 rounded-full border border-ryda-accent/50 bg-ryda-accent/10 animate-pulse" />
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-ryda-accent text-ryda-bg shadow-[0_0_15px_rgba(0,255,135,0.5)]">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-base text-ryda-text flex items-center justify-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-ryda-accent animate-ping" />
                Radar Active · Waiting for Rides
              </h3>
              <p className="text-xs text-ryda-muted max-w-xs mx-auto">
                You will receive instant alerts with pickup details and fares as soon as passengers in Bhopal book.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-ryda-accent border-t border-ryda-border/60">
              <span className="flex items-center gap-1">
                <Wifi className="h-3.5 w-3.5" /> High Priority Dispatch
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> 0% Platform Commission
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── State 4: OFFLINE ──────────────────────────────────────────────────────
  return (
    <Card className="w-full border-ryda-border bg-ryda-elevated shadow-md">
      <CardContent className="p-6 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ryda-surface text-ryda-muted border border-ryda-border">
          <Radio className="h-6 w-6 opacity-40" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-ryda-text">You are currently Offline</h3>
          <p className="text-xs text-ryda-muted">
            Toggle your status to <span className="text-ryda-accent font-medium">Online</span> at the top of the page to start receiving ride requests in Bhopal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
