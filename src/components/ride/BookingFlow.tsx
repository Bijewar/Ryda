'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlacesAutocomplete } from '@/components/ride/PlacesAutocomplete';
import { RideSearchingState } from '@/components/ride/RideSearchingState';
import { rideCreateSchema, type RideCreateInput } from '@/lib/validation/ride';
import { formatCurrency, formatDistance, formatDuration, cn } from '@/lib/utils';
import type { Point, RideStatus } from '@/types/ride';
import type { ApiResponse } from '@/types/api';

export interface ActiveRideData {
  id: string;
  fareAmount: number;
  pickupAddress: string;
  dropoffAddress: string;
  paymentMethod: string;
  distanceMeters?: number;
  durationSeconds?: number;
  status?: RideStatus;
  driver?: {
    id?: string;
    name: string;
    phone?: string;
    vehicle: string;
    licensePlate: string;
    rating: number;
  } | null;
}

export interface BookingFlowProps {
  onPickupSelect?: (point: Point, address: string) => void;
  onDropoffSelect?: (point: Point, address: string) => void;
  defaultPickup?: { point: Point; address: string };
  defaultDropoff?: { point: Point; address: string };
  className?: string;
  onRideCreated?: (ride: { id: string; fareAmount: number }) => void;
  initialActiveRide?: ActiveRideData | null;
}

type FormValues = RideCreateInput;

const PAYMENT_METHODS: Array<{ value: FormValues['paymentMethod']; label: string; hint: string }> = [
  { value: 'UPI', label: 'UPI', hint: 'PhonePe / GPay / Paytm' },
  { value: 'CARD', label: 'Card', hint: 'Visa / Mastercard / RuPay' },
  { value: 'WALLET', label: 'Wallet', hint: 'Ryda wallet' },
  { value: 'CASH', label: 'Cash', hint: 'Pay driver directly' },
];

export function BookingFlow({
  onPickupSelect,
  onDropoffSelect,
  defaultPickup,
  defaultDropoff,
  className,
  onRideCreated,
  initialActiveRide = null,
}: BookingFlowProps): React.ReactElement {
  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(rideCreateSchema),
    defaultValues: {
      pickup: defaultPickup ?? { address: '', point: { lat: 0, lng: 0 } },
      dropoff: defaultDropoff ?? { address: '', point: { lat: 0, lng: 0 } },
      paymentMethod: 'UPI',
    },
  });

  const pickup = watch('pickup');
  const dropoff = watch('dropoff');
  const paymentMethod = watch('paymentMethod');

  const [estimate, setEstimate] = React.useState<{
    fare: number;
    distance: number;
    duration: number;
    surge?: number;
    loading: boolean;
  } | null>(null);

  const [activeRide, setActiveRide] = React.useState<ActiveRideData | null>(initialActiveRide);

  // Sync if initialActiveRide updates
  React.useEffect(() => {
    if (initialActiveRide) {
      setActiveRide(initialActiveRide);
    }
  }, [initialActiveRide]);

  // Live route & fare estimate using real OSRM routing endpoint
  React.useEffect(() => {
    if (!pickup?.address || !dropoff?.address) {
      setEstimate(null);
      return;
    }

    const hasPickupPoint = pickup.point && pickup.point.lat !== 0;
    const hasDropoffPoint = dropoff.point && dropoff.point.lat !== 0;

    if (!hasPickupPoint || !hasDropoffPoint) {
      // Default estimate based on baseline if points are still resolving
      const baseDistance = 4200;
      const baseDuration = 960;
      const baseFare = 11000;
      setEstimate({ fare: baseFare, distance: baseDistance, duration: baseDuration, loading: false });
      return;
    }

    let isMounted = true;
    setEstimate((prev) => (prev ? { ...prev, loading: true } : { fare: 11000, distance: 4000, duration: 900, loading: true }));

    const fetchRouteEstimate = async () => {
      try {
        const query = `pickupLat=${pickup.point.lat}&pickupLng=${pickup.point.lng}&dropoffLat=${dropoff.point.lat}&dropoffLng=${dropoff.point.lng}`;
        const res = await fetch(`/api/geo/route?${query}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && isMounted) {
            setEstimate({
              fare: json.data.fareAmount,
              distance: json.data.distanceMeters,
              duration: json.data.durationSeconds,
              surge: json.data.surgeMultiplier,
              loading: false,
            });
            return;
          }
        }
      } catch (_e) {
        // Fallback calculation on network issue
      }

      if (isMounted) {
        // Approximate calculation
        const dist = 5200;
        const dur = 1100;
        const fare = Math.round(5000 + (dist / 1000) * 1200 + (dur / 60) * 100);
        setEstimate({ fare, distance: dist, duration: dur, loading: false });
      }
    };

    const timer = setTimeout(fetchRouteEstimate, 350);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [pickup?.address, pickup?.point?.lat, pickup?.point?.lng, dropoff?.address, dropoff?.point?.lat, dropoff?.point?.lng]);

  const handlePickupChange = (address: string, point: Point) => {
    setValue('pickup.address', address, { shouldValidate: true });
    setValue('pickup.point', point, { shouldValidate: true });
    onPickupSelect?.(point, address);
  };

  const handleDropoffChange = (address: string, point: Point) => {
    setValue('dropoff.address', address, { shouldValidate: true });
    setValue('dropoff.point', point, { shouldValidate: true });
    onDropoffSelect?.(point, address);
  };

  const onSubmit = async (values: FormValues): Promise<void> => {
    // If coordinates are missing, fallback to Bhopal center points
    const payload: FormValues = {
      ...values,
      pickup: {
        address: values.pickup.address,
        point: values.pickup.point.lat !== 0 ? values.pickup.point : { lat: 23.2419, lng: 77.4321 },
      },
      dropoff: {
        address: values.dropoff.address,
        point: values.dropoff.point.lat !== 0 ? values.dropoff.point : { lat: 23.2347, lng: 77.4036 },
      },
    };

    try {
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as ApiResponse<{ id: string; fareAmount: number }>;

      if (!res.ok || json.error) {
        toast.error(json.error?.message ?? 'Failed to request ride');
        return;
      }

      toast.success('Ride requested!', {
        description: `Connecting with drivers near ${payload.pickup.address.split(',')[0]}…`,
      });

      setActiveRide({
        id: json.data.id,
        fareAmount: json.data.fareAmount || estimate?.fare || 11000,
        pickupAddress: payload.pickup.address,
        dropoffAddress: payload.dropoff.address,
        paymentMethod: payload.paymentMethod,
        distanceMeters: estimate?.distance,
        durationSeconds: estimate?.duration,
      });

      onRideCreated?.(json.data);
    } catch (err) {
      toast.error('Network error', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  if (activeRide) {
    return (
      <RideSearchingState
        rideId={activeRide.id}
        fareAmount={activeRide.fareAmount}
        pickupAddress={activeRide.pickupAddress}
        dropoffAddress={activeRide.dropoffAddress}
        paymentMethod={activeRide.paymentMethod}
        distanceMeters={activeRide.distanceMeters}
        durationSeconds={activeRide.durationSeconds}
        initialStatus={activeRide.status}
        initialDriver={activeRide.driver}
        onCancel={() => setActiveRide(null)}
      />
    );
  }

  return (
    <Card className={cn('w-full shadow-lg border-ryda-border/60 bg-ryda-elevated/95', className)} data-slot="booking-flow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Navigation className="h-5 w-5 text-ryda-accent" aria-hidden="true" />
          Book a ride in Bhopal
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {/* Pickup Autocomplete */}
          <PlacesAutocomplete
            id="pickup-address"
            label="Pickup Location"
            placeholder="Search pickup spot in Bhopal (e.g., MP Nagar)"
            iconColor="text-ryda-accent"
            value={pickup?.address ?? ''}
            point={pickup?.point}
            onChange={handlePickupChange}
            error={errors.pickup?.address?.message}
            showLocationButton
          />

          {/* Dropoff Autocomplete */}
          <PlacesAutocomplete
            id="dropoff-address"
            label="Destination"
            placeholder="Where are you going in Bhopal? (e.g., New Market)"
            iconColor="text-destructive"
            value={dropoff?.address ?? ''}
            point={dropoff?.point}
            onChange={handleDropoffChange}
            error={errors.dropoff?.address?.message}
          />

          {/* Payment method */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-medium text-ryda-text">Payment Method</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setValue('paymentMethod', m.value, { shouldValidate: true })}
                  aria-pressed={paymentMethod === m.value}
                  className={cn(
                    'flex flex-col items-start rounded-lg border p-2.5 text-left transition-all',
                    paymentMethod === m.value
                      ? 'border-ryda-accent bg-ryda-accent/15 ring-1 ring-ryda-accent'
                      : 'border-ryda-border bg-ryda-bg/50 hover:bg-ryda-elevated hover:border-ryda-accent/40',
                  )}
                >
                  <span className="text-xs font-semibold text-ryda-text">{m.label}</span>
                  <span className="text-[10px] text-ryda-muted">{m.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live estimated fare */}
          {estimate && (
            <div
              className="flex items-center justify-between rounded-lg border border-ryda-accent/30 bg-ryda-accent/10 p-3"
              aria-live="polite"
            >
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-wider text-ryda-muted">
                  Estimated Fare {estimate.surge && estimate.surge > 1 ? `(${estimate.surge}x Surge)` : ''}
                </p>
                <p className="text-xl font-bold text-ryda-accent">
                  {formatCurrency(estimate.fare)}
                </p>
              </div>
              <div className="text-right text-xs text-ryda-muted">
                <p className="font-medium text-ryda-text">{formatDistance(estimate.distance)}</p>
                <p>{formatDuration(estimate.duration)}</p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting || !pickup?.address || !dropoff?.address}
            className="w-full bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim py-5 text-sm font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Finding Drivers…
              </>
            ) : (
              'Request Ride Now'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
