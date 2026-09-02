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
import { MapView } from '@/components/maps/MapView';
import { BhopalOverlay } from '@/components/maps/BhopalOverlay';
import { PassengerMarker } from '@/components/maps/PassengerMarker';
import { DriverMarker } from '@/components/maps/DriverMarker';
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

// Synthesize alert chime
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
  const [currentOnline, setCurrentOnline] = React.useState(isOnline);
  const [offer, setOffer] = React.useState<RideOfferPayload | null>(initialOffer);
  const [activeTrip, setActiveTrip] = React.useState<ActiveTripPayload | null>(initialActiveTrip);
  const [otpInput, setOtpInput] = React.useState('');
  const [isUpdatingTrip, setIsUpdatingTrip] = React.useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
  const seenRideIdsRef = React.useRef<Set<string>>(new Set());

  // Listen to live toggle events
  React.useEffect(() => {
    setCurrentOnline(isOnline);
  }, [isOnline]);

  React.useEffect(() => {
    const handleToggle = (e: Event) => {
      const custom = e as CustomEvent<{ isOnline: boolean }>;
      if (custom.detail && typeof custom.detail.isOnline === 'boolean') {
        setCurrentOnline(custom.detail.isOnline);
      }
    };
    window.addEventListener('driver-online-toggle', handleToggle);
    return () => window.removeEventListener('driver-online-toggle', handleToggle);
  }, []);

  // Real-time polling for incoming offers & active ongoing trips
  React.useEffect(() => {
    if (!currentOnline) {
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
              setOffer(incoming);
            }
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
    const interval = setInterval(pollOffersAndTrips, 1800);

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
    } catch (err) {
      toast.error('Accept Failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleReject = async (rideId: string): Promise<void> => {
    seenRideIdsRef.current.add(rideId);
    setOffer(null);
    try {
      await fetch(`/api/drivers/${driverId}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss', rideId }),
      });
    } catch (_e) {}
    toast.info('Offer Declined', {
      description: 'You will continue to receive other nearby ride requests.',
    });
  };

  const handleTripAction = async (action: 'arrived' | 'start' | 'complete', otp?: string) => {
    if (!activeTrip) return;
    setIsUpdatingTrip(true);
    try {
      const res = await fetch(`/api/rides/${activeTrip.rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, driverId, otp }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || json?.error) {
        throw new Error(json?.error?.message ?? 'Action failed');
      }

      if (action === 'arrived') {
        setActiveTrip({ ...activeTrip, status: 'ARRIVED' });
        toast.success('Status updated: Arrived at pickup');
      } else if (action === 'start') {
        setActiveTrip({ ...activeTrip, status: 'IN_PROGRESS' });
        toast.success('OTP Verified! Ride Started — Navigate to destination');
      } else if (action === 'complete') {
        setActiveTrip(null);
        toast.success('Trip Completed & Settled!', {
          description: `Fare ${formatCurrency(activeTrip.fareAmount)} recorded to today's earnings.`,
        });
        setTimeout(() => {
          router.refresh();
        }, 400);
      }
    } catch (err) {
      toast.error('Update Failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsUpdatingTrip(false);
    }
  };

  const handleCancelConfirm = async (reason: CancellationReasonCategory, details?: string) => {
    if (!activeTrip) return;
    setIsUpdatingTrip(true);
    try {
      const res = await fetch(`/api/rides/${activeTrip.rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          driverId,
          category: reason,
          reason: details,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to cancel ride');
      }

      toast.info('Trip Cancelled');
      setActiveTrip(null);
      setIsCancelModalOpen(false);
      router.refresh();
    } catch (err) {
      toast.error('Cancel Failed');
    } finally {
      setIsUpdatingTrip(false);
    }
  };

  // ── State 1: ACTIVE ONGOING TRIP (WITH EMBEDDED REAL MAP) ─────────────────
  if (activeTrip) {
    return (
      <>
        <DriverCancelReasonModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={handleCancelConfirm}
          monthlyCancellationsUsed={monthlyCancellationsUsed}
          cancellationAllowance={cancellationAllowance}
        />

        <Card className="rounded-3xl border-2 border-ryda-accent bg-ryda-surface shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
          <CardHeader className="bg-gradient-to-r from-emerald-500/15 via-ryda-accent/10 to-emerald-500/15 border-b border-ryda-border p-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1">
                {activeTrip.status === 'ACCEPTED' && '🚗 Driver En Route to Pickup'}
                {activeTrip.status === 'ARRIVED' && '📍 Waiting at Pickup Location'}
                {activeTrip.status === 'IN_PROGRESS' && '🛣️ Trip In Progress'}
              </Badge>
              <span className="font-display font-extrabold text-lg text-ryda-accent-dim">
                {formatCurrency(activeTrip.fareAmount)}
              </span>
            </div>
          </CardHeader>

          {/* Embedded Real Bhopal Map for Driver Navigation */}
          <div className="relative h-[240px] sm:h-[280px] w-full border-b border-ryda-border">
            <MapView
              initialViewState={{
                longitude: 77.4280,
                latitude: 23.2380,
                zoom: 13.0,
              }}
            >
              <BhopalOverlay />

              {/* Pickup Landmark Marker */}
              <PassengerMarker lng={77.4321} lat={23.2419} label="Pickup Spot" />

              {/* Destination Landmark Marker */}
              <PassengerMarker lng={77.3377} lat={23.2875} label="Dropoff Spot" />

              {/* Captain Current Vehicle Location */}
              <DriverMarker
                lng={77.4290}
                lat={23.2400}
                heading={45}
                variant="BIKE"
                driverName="Your Location"
                rating={5.0}
              />
            </MapView>

            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-md border border-ryda-border text-xs font-bold text-ryda-text">
              {activeTrip.status === 'IN_PROGRESS'
                ? '📍 Live Navigation: On Route to Destination'
                : '📍 Heading to Pickup Point'}
            </div>
          </div>

          <CardContent className="p-5 space-y-4">
            {/* Passenger Info */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-ryda-elevated/40 border border-ryda-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-sm">
                  {activeTrip.passengerName[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-ryda-text">{activeTrip.passengerName}</p>
                  <p className="text-xs text-ryda-muted">{activeTrip.paymentMethod} Payment</p>
                </div>
              </div>
              <div className="text-right text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                Verified Rider
              </div>
            </div>

            {/* Route Steps */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-ryda-muted block">Pickup</span>
                  <span className="text-ryda-text font-medium">{activeTrip.pickupAddress}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-ryda-muted block">Destination</span>
                  <span className="text-ryda-text font-medium">{activeTrip.dropoffAddress}</span>
                </div>
              </div>
            </div>

            {/* Google Maps External Navigation Shortcut */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                activeTrip.status === 'IN_PROGRESS' ? activeTrip.dropoffAddress : activeTrip.pickupAddress,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border border-ryda-border bg-ryda-surface hover:bg-ryda-elevated text-xs font-bold text-ryda-text transition-all shadow-xs group"
            >
              <Navigation className="h-3.5 w-3.5 text-ryda-accent group-hover:rotate-45 transition-transform" />
              <span>
                {activeTrip.status === 'IN_PROGRESS'
                  ? 'Open Dropoff in Google Maps'
                  : 'Open Pickup in Google Maps'}
              </span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 p-5 pt-0">
            {activeTrip.status === 'ACCEPTED' && (
              <Button
                type="button"
                onClick={() => handleTripAction('arrived')}
                disabled={isUpdatingTrip}
                className="w-full bg-ryda-accent text-white hover:bg-ryda-accent-dim font-bold py-4 rounded-2xl text-sm gap-2 shadow-md cursor-pointer"
              >
                {isUpdatingTrip ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                I Have Arrived at Pickup
              </Button>
            )}

            {activeTrip.status === 'ARRIVED' && (
              <div className="w-full space-y-3 p-4 rounded-2xl border border-ryda-accent/40 bg-emerald-50/40">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
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
                    className="text-center font-mono text-2xl font-bold tracking-[0.4em] h-12 w-48 bg-white border-2 border-emerald-500 rounded-xl focus-visible:ring-emerald-500"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-center text-ryda-muted">
                  Ask passenger for the 4-digit OTP shown on their screen.
                </p>

                <Button
                  type="button"
                  onClick={() => handleTripAction('start', otpInput)}
                  disabled={isUpdatingTrip || otpInput.trim().length !== 4}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 font-bold py-4 rounded-2xl text-sm gap-2 shadow-md cursor-pointer"
                >
                  {isUpdatingTrip ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Verify OTP &amp; Start Ride
                </Button>
              </div>
            )}

            {activeTrip.status === 'IN_PROGRESS' && (
              <Button
                type="button"
                onClick={() => handleTripAction('complete')}
                disabled={isUpdatingTrip}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 font-bold py-4 rounded-2xl text-sm gap-2 shadow-lg cursor-pointer"
              >
                {isUpdatingTrip ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                Complete Trip &amp; Collect {formatCurrency(activeTrip.fareAmount)}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCancelModalOpen(true)}
              disabled={isUpdatingTrip}
              className="w-full text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8"
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

  // ── State 3: RADAR SCANNING (No active trip or offer) ─────────────────────
  return (
    <div className="space-y-4">
      {/* Radar scanning banner */}
      <div className="rounded-3xl border border-ryda-border bg-ryda-surface p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <Radio className="h-5 w-5 text-emerald-700 relative" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-ryda-text">Live Dispatch Radar</p>
            <p className="text-xs text-ryda-muted">
              {currentOnline ? '🟢 Connected · Waiting for nearby ride requests' : '⚪ Offline — Toggle above to go Online'}
            </p>
          </div>
        </div>
      </div>

      {/* Demand Hotspots & Insights */}
      <DriverDemandCard driverId={driverId} isOnline={currentOnline} />
    </div>
  );
}
