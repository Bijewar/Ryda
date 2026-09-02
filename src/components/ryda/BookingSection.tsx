'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Navigation,
  Clock,
  Users,
  Search,
  Star,
  ArrowRight,
  Check,
  Sparkles,
  Loader2,
  Compass,
  LocateFixed,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { MapRef } from 'react-map-gl/maplibre';
import { VehicleIllustration, type VehicleType } from './VehicleIllustration';
import { MapView } from '@/components/maps/MapView';
import { BhopalOverlay } from '@/components/maps/BhopalOverlay';
import { DriverMarker } from '@/components/maps/DriverMarker';
import { PassengerMarker } from '@/components/maps/PassengerMarker';
import { RideSearchingState } from '@/components/ride/RideSearchingState';
import { BHOPAL_POIS } from '@/lib/geo/pois';
import { formatCurrency, cn } from '@/lib/utils';
import type { ActiveDriverMarker } from '@/app/api/drivers/active/route';

type VehicleClass = 'bike' | 'auto' | 'cab' | 'premium' | 'suv';

interface VehicleOption {
  id: VehicleClass;
  type: VehicleType;
  name: string;
  desc: string;
  eta: string;
  baseMultiplier: number;
  capacity: number;
  color: string;
  accent: string;
  features: string[];
  badge?: string;
}

const VEHICLES: VehicleOption[] = [
  {
    id: 'bike',
    type: 'bike',
    name: 'Bike',
    desc: 'Beat the traffic',
    eta: '2 min',
    baseMultiplier: 0.45,
    capacity: 1,
    color: '#10B981',
    accent: '#F5C542',
    features: ['Fastest in traffic', 'Helmet provided', 'Live GPS track'],
    badge: 'Popular',
  },
  {
    id: 'auto',
    type: 'auto',
    name: 'Auto',
    desc: 'Everyday rides',
    eta: '4 min',
    baseMultiplier: 0.7,
    capacity: 3,
    color: '#F59E0B',
    accent: '#1F2937',
    features: ['Meter fare guarantee', 'Up to 3 passengers', 'Zero surge'],
  },
  {
    id: 'cab',
    type: 'cab',
    name: 'Cab Economy',
    desc: 'Comfort daily',
    eta: '5 min',
    baseMultiplier: 1.0,
    capacity: 4,
    color: '#3B82F6',
    accent: '#F5C542',
    features: ['AC cabin', '4 comfortable seats', 'Spacious trunk'],
  },
  {
    id: 'premium',
    type: 'premium',
    name: 'Premium Sedan',
    desc: 'Refined rides',
    eta: '3 min',
    baseMultiplier: 1.5,
    capacity: 4,
    color: '#0F172A',
    accent: '#F5C542',
    features: ['Top-rated 4.9+ drivers', 'Complimentary bottled water', 'Luxury sedans'],
    badge: 'Premium',
  },
  {
    id: 'suv',
    type: 'suv',
    name: 'SUV XL',
    desc: 'For groups',
    eta: '7 min',
    baseMultiplier: 1.9,
    capacity: 6,
    color: '#7C3AED',
    accent: '#F5C542',
    features: ['6 full seats', 'Extra luggage space', 'Dual AC'],
  },
];

interface SuggestionItem {
  address: string;
  landmark?: string;
  point: { lat: number; lng: number };
}

export function BookingSection() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<VehicleClass>('bike');
  const [pickup, setPickup] = React.useState('MP Nagar Zone 1, Bhopal');
  const [drop, setDrop] = React.useState('Raja Bhoj Airport (BHO), Bhopal');
  const [passengerPoint, setPassengerPoint] = React.useState<{ lat: number; lng: number }>({
    lat: 23.2419,
    lng: 77.4321,
  });
  const [dropPoint, setDropPoint] = React.useState<{ lat: number; lng: number }>({
    lat: 23.2875,
    lng: 77.3377,
  });

  const [dropSuggestions, setDropSuggestions] = React.useState<SuggestionItem[]>([]);
  const [showDropDropdown, setShowDropDropdown] = React.useState(false);
  const [isDropSearching, setIsDropSearching] = React.useState(false);

  const [pickupSuggestions, setPickupSuggestions] = React.useState<SuggestionItem[]>([]);
  const [showPickupDropdown, setShowPickupDropdown] = React.useState(false);
  const [isPickupSearching, setIsPickupSearching] = React.useState(false);

  const [isLocating, setIsLocating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const mapRef = React.useRef<MapRef>(null);

  const [activeRide, setActiveRide] = React.useState<{
    id: string;
    fareAmount: number;
    pickupAddress: string;
    dropoffAddress: string;
    paymentMethod: string;
  } | null>(null);

  // Live Real-Time Keyword Search for Destination
  const fetchDropSuggestions = React.useCallback(async (keyword: string) => {
    if (!keyword || keyword.trim().length === 0) {
      setDropSuggestions(
        BHOPAL_POIS.slice(0, 6).map((p) => ({
          address: `${p.name}, Bhopal`,
          landmark: p.landmark,
          point: { lat: p.lat, lng: p.lng },
        }))
      );
      return;
    }

    setIsDropSearching(true);
    try {
      const res = await fetch(`/api/geo/autocomplete?q=${encodeURIComponent(keyword.trim())}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setDropSuggestions(json.data);
          return;
        }
      }
    } catch (_e) {
      // Fallback to local keyword filter
    } finally {
      setIsDropSearching(false);
    }

    // Fallback local match
    const lower = keyword.toLowerCase();
    const matches = BHOPAL_POIS.filter(
      (p) => p.name.toLowerCase().includes(lower) || (p.landmark && p.landmark.toLowerCase().includes(lower))
    ).map((p) => ({
      address: `${p.name}, Bhopal`,
      landmark: p.landmark,
      point: { lat: p.lat, lng: p.lng },
    }));
    setDropSuggestions(matches.slice(0, 6));
  }, []);

  const handleDropInputChange = (val: string) => {
    setDrop(val);
    setShowDropDropdown(true);
  };

  // Debounced effect for destination typing
  React.useEffect(() => {
    if (!showDropDropdown) return;
    const timer = setTimeout(() => {
      fetchDropSuggestions(drop);
    }, 220);
    return () => clearTimeout(timer);
  }, [drop, showDropDropdown, fetchDropSuggestions]);

  const handleSelectDrop = (item: SuggestionItem) => {
    setDrop(item.address);
    setDropPoint(item.point);
    setShowDropDropdown(false);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [item.point.lng, item.point.lat],
        zoom: 13.5,
        duration: 1200,
      });
    }
  };

  // Live Real-Time Keyword Search for Pickup
  const fetchPickupSuggestions = React.useCallback(async (keyword: string) => {
    if (!keyword || keyword.trim().length === 0) {
      setPickupSuggestions(
        BHOPAL_POIS.slice(0, 6).map((p) => ({
          address: `${p.name}, Bhopal`,
          landmark: p.landmark,
          point: { lat: p.lat, lng: p.lng },
        }))
      );
      return;
    }

    setIsPickupSearching(true);
    try {
      const res = await fetch(`/api/geo/autocomplete?q=${encodeURIComponent(keyword.trim())}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setPickupSuggestions(json.data);
          return;
        }
      }
    } catch (_e) {
      // Fallback
    } finally {
      setIsPickupSearching(false);
    }

    const lower = keyword.toLowerCase();
    const matches = BHOPAL_POIS.filter(
      (p) => p.name.toLowerCase().includes(lower) || (p.landmark && p.landmark.toLowerCase().includes(lower))
    ).map((p) => ({
      address: `${p.name}, Bhopal`,
      landmark: p.landmark,
      point: { lat: p.lat, lng: p.lng },
    }));
    setPickupSuggestions(matches.slice(0, 6));
  }, []);

  const handlePickupInputChange = (val: string) => {
    setPickup(val);
    setShowPickupDropdown(true);
  };

  // Debounced effect for pickup typing
  React.useEffect(() => {
    if (!showPickupDropdown) return;
    const timer = setTimeout(() => {
      fetchPickupSuggestions(pickup);
    }, 220);
    return () => clearTimeout(timer);
  }, [pickup, showPickupDropdown, fetchPickupSuggestions]);

  const handleSelectPickup = (item: SuggestionItem) => {
    setPickup(item.address);
    setPassengerPoint(item.point);
    setShowPickupDropdown(false);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [item.point.lng, item.point.lat],
        zoom: 14.5,
        duration: 1200,
      });
    }
  };

  // Auto-detect current GPS location on mount
  const hasAutoLocatedRef = React.useRef(false);

  React.useEffect(() => {
    if (hasAutoLocatedRef.current || typeof window === 'undefined' || !navigator.geolocation) return;
    hasAutoLocatedRef.current = true;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        const userPt = { lat: userLat, lng: userLng };

        setPassengerPoint(userPt);

        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [userLng, userLat],
            zoom: 14.5,
            duration: 1200,
          });
        }

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&zoom=18`
          );
          if (res.ok) {
            const data = await res.json();
            const displayName = data.display_name
              ? data.display_name.split(',').slice(0, 3).join(',')
              : `Current Location (${userLat}, ${userLng})`;
            setPickup(displayName);
          } else {
            setPickup(`Current Location (${userLat}, ${userLng})`);
          }
        } catch (_e) {
          setPickup(`Current Location (${userLat}, ${userLng})`);
        }
      },
      (_err) => {
        // Fallback gracefully to default
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
    );
  }, []);

  // Handle GPS Current Location Fetch & Map Centering (Manual Tap)
  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        const userPt = { lat: userLat, lng: userLng };

        setPassengerPoint(userPt);

        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [userLng, userLat],
            zoom: 14.8,
            duration: 1500,
          });
        }

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&zoom=18`
          );
          if (res.ok) {
            const data = await res.json();
            const displayName = data.display_name
              ? data.display_name.split(',').slice(0, 3).join(',')
              : `Current Location (${userLat}, ${userLng})`;
            setPickup(displayName);
          } else {
            setPickup(`Live GPS (${userLat}, ${userLng})`);
          }
        } catch (_e) {
          setPickup(`Live GPS Location (${userLat}, ${userLng})`);
        } finally {
          setIsLocating(false);
          toast.success('Location updated', {
            description: `Centered map on your real coordinates.`,
          });
        }
      },
      (_err) => {
        setIsLocating(false);
        toast.info('Location permission denied', {
          description: 'Showing default central Bhopal marker.',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Approximate distance calculation
  const distanceKm = React.useMemo(() => {
    const lat1 = passengerPoint.lat;
    const lon1 = passengerPoint.lng;
    const lat2 = dropPoint.lat;
    const lon2 = dropPoint.lng;
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.max(2.5, Math.round(R * c * 10) / 10);
  }, [passengerPoint, dropPoint]);

  const selectedVehicle = VEHICLES.find((v) => v.id === selected) ?? VEHICLES[0]!;
  const baseRate = Math.round(35 + distanceKm * 14);
  const calculatedFare = Math.round(baseRate * selectedVehicle.baseMultiplier * 100);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: { address: pickup, point: passengerPoint },
          dropoff: { address: drop, point: dropPoint },
          paymentMethod: 'UPI',
        }),
      });

      const json = await res.json().catch(() => null);
      const rideId = json?.data?.id ?? `ride-${Date.now()}`;
      const fareAmount = json?.data?.fareAmount || calculatedFare;

      toast.success('Ride requested!', {
        description: `Connecting with ${selectedVehicle.name} drivers near your location…`,
      });

      setActiveRide({
        id: rideId,
        fareAmount,
        pickupAddress: pickup,
        dropoffAddress: drop,
        paymentMethod: 'UPI',
      });
    } catch (_err) {
      const fallbackId = `ride-${Date.now()}`;
      setActiveRide({
        id: fallbackId,
        fareAmount: calculatedFare,
        pickupAddress: pickup,
        dropoffAddress: drop,
        paymentMethod: 'UPI',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="booking" className="relative py-20 lg:py-28 scroll-mt-24">
      <span id="rides" className="absolute -top-24" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-ryda-bg via-ryda-surface to-ryda-bg" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Book in seconds"
          title={
            <>
              Pick your ride, <span className="ryda-text-gradient">tap to go.</span>
            </>
          }
          subtitle="Real fares, real ETAs, no surprises. Search any keyword or landmark and ride across Bhopal."
        />

        {activeRide ? (
          <div className="mt-12 max-w-2xl mx-auto">
            <RideSearchingState
              rideId={activeRide.id}
              fareAmount={activeRide.fareAmount}
              pickupAddress={activeRide.pickupAddress}
              dropoffAddress={activeRide.dropoffAddress}
              paymentMethod={activeRide.paymentMethod}
              onCancel={() => setActiveRide(null)}
            />
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-6 mt-12">
            {/* Left — location inputs with live suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7"
            >
              <div className="ryda-glass rounded-3xl p-6 lg:p-8 shadow-xl">
                {/* Location inputs with Autocomplete Dropdowns */}
                <div className="relative bg-ryda-surface rounded-2xl border border-ryda-border p-5 mb-6 space-y-4">
                  {/* Pickup Row */}
                  <div className="relative">
                    <div className="flex items-center gap-3 pb-3 border-b border-ryda-border">
                      <span className="w-3 h-3 rounded-full bg-ryda-accent ring-4 ring-ryda-accent/15 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] font-bold text-ryda-muted uppercase tracking-wider block">
                          Pickup Location
                        </label>
                        <input
                          value={pickup}
                          onFocus={() => {
                            setShowPickupDropdown(true);
                            setShowDropDropdown(false);
                            fetchPickupSuggestions(pickup);
                          }}
                          onChange={(e) => handlePickupInputChange(e.target.value)}
                          className="w-full bg-transparent outline-none text-sm font-semibold text-ryda-text placeholder:text-ryda-muted mt-0.5"
                          placeholder="Search any place in Bhopal (e.g. MP Nagar, Shahpura…)"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="inline-flex items-center gap-1 text-xs font-bold text-ryda-accent hover:text-ryda-accent-dim transition-colors bg-ryda-accent/10 px-2.5 py-1.5 rounded-xl flex-shrink-0"
                      >
                        {isLocating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <LocateFixed className="w-3.5 h-3.5" />
                        )}
                        <span>USE CURRENT</span>
                      </button>
                    </div>

                    {/* Pickup Suggestions Dropdown */}
                    <AnimatePresence>
                      {showPickupDropdown && pickupSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute left-0 right-0 top-full mt-2 z-50 bg-ryda-surface rounded-2xl border border-ryda-border shadow-2xl overflow-hidden divide-y divide-ryda-border/60 max-h-64 overflow-y-auto"
                        >
                          <div className="px-3 py-1.5 bg-ryda-elevated/50 text-[10px] font-bold text-ryda-muted uppercase flex items-center justify-between">
                            <span>Suggestions for &ldquo;{pickup || 'Popular Spots'}&rdquo;</span>
                            {isPickupSearching && <Loader2 className="w-3 h-3 animate-spin text-ryda-accent" />}
                          </div>
                          {pickupSuggestions.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectPickup(item)}
                              className="w-full text-left px-3.5 py-2.5 hover:bg-ryda-elevated transition-colors flex items-start gap-2.5 cursor-pointer"
                            >
                              <MapPin className="w-4 h-4 text-ryda-accent mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-ryda-text truncate">{item.address}</p>
                                {item.landmark && (
                                  <p className="text-[10px] text-ryda-muted truncate">{item.landmark}</p>
                                )}
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Destination Row */}
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-500/15 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] font-bold text-ryda-muted uppercase tracking-wider block">
                          Destination (Where To?)
                        </label>
                        <input
                          value={drop}
                          onFocus={() => {
                            setShowDropDropdown(true);
                            setShowPickupDropdown(false);
                            fetchDropSuggestions(drop);
                          }}
                          onChange={(e) => handleDropInputChange(e.target.value)}
                          className="w-full bg-transparent outline-none text-sm font-semibold text-ryda-text placeholder:text-ryda-muted mt-0.5"
                          placeholder="Type any keyword (e.g. hotel, station, mall, hospital, college…)"
                        />
                      </div>
                      {isDropSearching && <Loader2 className="w-4 h-4 animate-spin text-ryda-accent flex-shrink-0" />}
                    </div>

                    {/* Destination Suggestions Dropdown */}
                    <AnimatePresence>
                      {showDropDropdown && dropSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute left-0 right-0 top-full mt-2 z-50 bg-ryda-surface rounded-2xl border border-ryda-border shadow-2xl overflow-hidden divide-y divide-ryda-border/60 max-h-64 overflow-y-auto"
                        >
                          <div className="px-3 py-1.5 bg-ryda-elevated/50 text-[10px] font-bold text-ryda-muted uppercase flex items-center justify-between">
                            <span>Keyword Results for &ldquo;{drop || 'Bhopal'}&rdquo;</span>
                            {isDropSearching && <Loader2 className="w-3 h-3 animate-spin text-ryda-accent" />}
                          </div>
                          {dropSuggestions.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectDrop(item)}
                              className="w-full text-left px-3.5 py-2.5 hover:bg-ryda-elevated transition-colors flex items-start gap-2.5 cursor-pointer group"
                            >
                              <Building2 className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-ryda-text truncate">{item.address}</p>
                                {item.landmark && (
                                  <p className="text-[10px] text-ryda-muted truncate">{item.landmark}</p>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-ryda-accent-dim bg-ryda-accent/10 px-2 py-0.5 rounded-full flex-shrink-0">
                                Select
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Vehicle options */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase tracking-wider font-bold text-ryda-text">
                      Select Vehicle Tier
                    </p>
                    <span className="text-xs font-semibold text-ryda-accent-dim">
                      {distanceKm} km Est. Distance
                    </span>
                  </div>

                  {VEHICLES.map((v) => {
                    const isSelected = selected === v.id;
                    const tierFare = Math.round(baseRate * v.baseMultiplier);

                    return (
                      <motion.button
                        key={v.id}
                        type="button"
                        whileHover={{ scale: 1.008 }}
                        whileTap={{ scale: 0.992 }}
                        onClick={() => setSelected(v.id)}
                        className={cn(
                          'w-full text-left rounded-2xl p-4 transition-all duration-300 border relative group cursor-pointer',
                          isSelected
                            ? 'bg-ryda-surface border-ryda-accent shadow-md ring-1 ring-ryda-accent'
                            : 'bg-ryda-surface/60 border-ryda-border hover:bg-ryda-surface hover:border-ryda-accent/40'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          {/* Vehicle SVG */}
                          <div className="w-16 h-10 flex-shrink-0 relative flex items-center justify-center">
                            <VehicleIllustration type={v.type} className="w-full h-full" color={v.color} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-display font-bold text-sm text-ryda-text truncate">
                                {v.name}
                              </p>
                              {v.badge && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ryda-accent/15 text-ryda-accent-dim">
                                  {v.badge}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-ryda-muted mt-0.5">
                              <span>{v.desc}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-ryda-accent" />
                                {v.eta} away
                              </span>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right flex-shrink-0">
                            <p
                              className={cn(
                                'font-display font-bold text-base transition-colors',
                                isSelected ? 'text-ryda-accent-dim' : 'text-ryda-text'
                              )}
                            >
                              ₹ {tierFare}
                            </p>
                          </div>

                          {/* Selected check */}
                          <div
                            className={cn(
                              'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                              isSelected
                                ? 'bg-ryda-accent border-ryda-accent'
                                : 'border-ryda-border bg-transparent'
                            )}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </div>

                        {/* Expand: features */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-ryda-border/60 flex flex-wrap gap-2">
                                {v.features.map((f) => (
                                  <span
                                    key={f}
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-ryda-text bg-ryda-elevated px-2.5 py-1 rounded-full"
                                  >
                                    <Check className="w-3 h-3 text-ryda-accent" />
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </div>

                {/* CTA */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="mt-5 w-full bg-ryda-accent hover:bg-ryda-accent-dim text-white py-4 rounded-2xl font-bold text-base ryda-accent-glow transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting Drivers…
                    </>
                  ) : (
                    <>
                      Confirm {selectedVehicle.name} · {formatCurrency(calculatedFare)}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
                <p className="mt-3 text-center text-xs text-ryda-muted font-medium">
                  Real-time GPS dispatch with nearest captain in Bhopal
                </p>
              </div>
            </motion.div>

            {/* Right — Real Live Map Preview */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5"
            >
              <LiveRealMapPreview
                mapRef={mapRef}
                passengerPoint={passengerPoint}
                dropPoint={dropPoint}
                selected={selected}
                onLocateClick={handleUseCurrentLocation}
                isLocating={isLocating}
                distanceKm={distanceKm}
              />
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}

function LiveRealMapPreview({
  mapRef,
  passengerPoint,
  dropPoint,
  selected,
  onLocateClick,
  isLocating,
  distanceKm,
}: {
  mapRef: React.RefObject<MapRef | null>;
  passengerPoint: { lat: number; lng: number };
  dropPoint: { lat: number; lng: number };
  selected: VehicleClass;
  onLocateClick: () => void;
  isLocating: boolean;
  distanceKm: number;
}) {
  const [drivers, setDrivers] = React.useState<ActiveDriverMarker[]>([]);

  React.useEffect(() => {
    fetch('/api/drivers/active')
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) setDrivers(json.data);
      })
      .catch(() => null);
  }, []);

  const bikeCount = drivers.filter((d) => d.vehicleType === 'BIKE').length || 3;
  const autoCount = drivers.filter((d) => d.vehicleType === 'AUTO').length || 2;
  const cabCount = drivers.filter((d) => d.vehicleType !== 'BIKE' && d.vehicleType !== 'AUTO').length || 4;

  return (
    <div className="relative h-full min-h-[480px] lg:min-h-[620px] rounded-3xl overflow-hidden ryda-glass shadow-xl border border-ryda-border">
      {/* Real MapLibre View with RydaMap.geojson */}
      <MapView
        mapRef={mapRef as any}
        initialViewState={{
          longitude: passengerPoint.lng,
          latitude: passengerPoint.lat,
          zoom: 12.6,
        }}
      >
        <BhopalOverlay />

        {/* Real-time Passenger Pickup Beacon */}
        <PassengerMarker
          lng={passengerPoint.lng}
          lat={passengerPoint.lat}
          label="Pickup Point"
        />

        {/* Dynamic Destination Pin */}
        <PassengerMarker
          lng={dropPoint.lng}
          lat={dropPoint.lat}
          label="Destination"
        />

        {/* Live Drivers on Real Streets */}
        {drivers.map((d) => (
          <DriverMarker
            key={d.id}
            lng={d.lng}
            lat={d.lat}
            heading={d.heading}
            variant={d.vehicleType}
            driverName={d.firstName}
            rating={d.rating}
          />
        ))}
      </MapView>

      {/* Top Floating Live Stats Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="ryda-glass-strong rounded-xl px-3 py-2 flex items-center gap-2 shadow-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ryda-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-ryda-accent" />
          </span>
          <span className="text-xs font-bold text-ryda-text">
            {bikeCount} Bikes · {autoCount} Autos · {cabCount} Cabs
          </span>
        </div>

        {/* Locate Me Map Button */}
        <button
          type="button"
          onClick={onLocateClick}
          disabled={isLocating}
          title="Center on my current location"
          className="ryda-glass-strong p-2.5 rounded-xl shadow-md text-ryda-accent hover:text-ryda-accent-dim transition-colors flex items-center justify-center cursor-pointer border border-ryda-border"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-ryda-accent" />
          ) : (
            <LocateFixed className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Bottom Route & Fleet Summary Card */}
      <motion.div
        key={selected}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute bottom-4 left-4 right-4 z-10 ryda-glass-strong rounded-2xl p-4 shadow-xl border border-ryda-border/80"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-ryda-accent to-ryda-accent-dim flex items-center justify-center text-white font-extrabold shadow-md text-sm">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-ryda-text">Bhopal City Route</p>
              <p className="text-xs text-ryda-muted mt-0.5">{distanceKm} km · Live GPS Navigation</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-ryda-muted block">Pickup ETA</span>
            <span className="font-display font-extrabold text-base text-ryda-accent-dim">~2-3 min</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ryda-accent/10 text-ryda-accent-dim text-xs font-semibold mb-3">
        <Sparkles className="w-3.5 h-3.5" />
        {eyebrow}
      </div>
      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ryda-text">
        {title}
      </h2>
      <p className="mt-4 text-base sm:text-lg text-ryda-muted">{subtitle}</p>
    </div>
  );
}
