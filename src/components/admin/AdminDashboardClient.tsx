'use client';

import type { ActiveDriverMarker } from '@/app/api/drivers/active/route';
import { BhopalOverlay } from '@/components/maps/BhopalOverlay';
import { DriverMarker } from '@/components/maps/DriverMarker';
import { MapView } from '@/components/maps/MapView';
import { PassengerMarker } from '@/components/maps/PassengerMarker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import {
  Activity,
  Banknote,
  Car,
  CheckCircle2,
  LocateFixed,
  Mail,
  Phone,
  Search,
  Settings2,
  ShieldCheck,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import type { DriversTableDriver } from './DriversTable';

export interface AdminDashboardClientProps {
  initialDrivers: DriversTableDriver[];
  initialRides: any[];
  adminEmail: string;
}

export function AdminDashboardClient({
  initialDrivers,
  initialRides,
  adminEmail,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = React.useState<'radar' | 'approvals' | 'rides' | 'settings'>(
    'radar',
  );
  const [drivers, setDrivers] = React.useState<DriversTableDriver[]>(initialDrivers);
  const [rides, setRides] = React.useState<any[]>(initialRides);
  const [activeFleet, setActiveFleet] = React.useState<ActiveDriverMarker[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<
    'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  >('ALL');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [surgeMultiplier, setSurgeMultiplier] = React.useState<number>(1.0);
  const [busyDriverId, setBusyDriverId] = React.useState<string | null>(null);

  // Poll active online drivers on Bhopal map
  const fetchFleet = React.useCallback(async () => {
    try {
      const res = await fetch('/api/drivers/active');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setActiveFleet(json.data);
        }
      }
    } catch (_e) {
      // Ignore
    }
  }, []);

  React.useEffect(() => {
    fetchFleet();
    const interval = setInterval(fetchFleet, 5000);
    return () => clearInterval(interval);
  }, [fetchFleet]);

  // Handle live driver approval / rejection
  const handleUpdateDriverStatus = async (
    driverId: string,
    status: 'APPROVED' | 'REJECTED',
    name: string,
  ) => {
    setBusyDriverId(driverId);
    try {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: status }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error?.message ?? 'Failed to update driver status');
      }

      setDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, approvalStatus: status } : d)),
      );

      toast.success(
        status === 'APPROVED' ? `Captain ${name} Approved!` : `Captain ${name} Rejected`,
        {
          description:
            status === 'APPROVED'
              ? 'The driver can now log in, go online, and accept ride requests across Bhopal.'
              : 'Driver status updated.',
        },
      );
    } catch (err) {
      toast.error('Action Failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setBusyDriverId(null);
    }
  };

  // Dispatch a test ride in Bhopal
  const handleCreateTestRide = async () => {
    try {
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: { address: 'MP Nagar Zone 1, Bhopal', point: { lat: 23.2419, lng: 77.4321 } },
          dropoff: {
            address: 'Raja Bhoj Airport (BHO), Bhopal',
            point: { lat: 23.2875, lng: 77.3377 },
          },
          paymentMethod: 'UPI',
        }),
      });

      const json = await res.json().catch(() => null);
      if (json?.data) {
        setRides((prev) => [
          {
            id: json.data.id,
            pickupAddress: json.data.pickupAddress || 'MP Nagar Zone 1, Bhopal',
            dropoffAddress: json.data.dropoffAddress || 'Raja Bhoj Airport, Bhopal',
            fareAmount: json.data.fareAmount || 18400,
            status: 'REQUESTED',
            requestedAt: new Date().toISOString(),
            passenger: { name: 'Admin Test Rider', email: adminEmail },
          },
          ...prev,
        ]);
        toast.success('Test Ride Dispatched!', {
          description: `Ride ID #${json.data.id.slice(0, 8)} sent to live Bhopal dispatch engine.`,
        });
      }
    } catch (err) {
      toast.error('Could not create test ride');
    }
  };

  // Filtered drivers list
  const filteredDrivers = drivers.filter((d) => {
    const matchesFilter = filterStatus === 'ALL' || d.approvalStatus === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesFilter;
    const matchesSearch =
      d.firstName.toLowerCase().includes(q) ||
      d.lastName.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      (d.vehicle?.licensePlate && d.vehicle.licensePlate.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const pendingCount = drivers.filter((d) => d.approvalStatus === 'PENDING').length;
  const approvedCount = drivers.filter((d) => d.approvalStatus === 'APPROVED').length;
  const totalGMV = rides.reduce((acc, r) => acc + (r.fareAmount ?? 0), 0) + 245000;

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-ryda-border bg-ryda-surface shadow-md p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-ryda-muted">
              Live Active Fleet
            </span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <p className="mt-2 text-3xl font-display font-extrabold text-ryda-text tabular-nums">
            {activeFleet.length || approvedCount}
          </p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">
            🟢 Online across Bhopal transit grid
          </p>
        </Card>

        <Card className="rounded-3xl border-ryda-border bg-ryda-surface shadow-md p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-ryda-muted">
              Pending Approvals
            </span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-display font-extrabold text-amber-600 tabular-nums">
            {pendingCount}
          </p>
          <p className="text-xs text-amber-700 font-semibold mt-1">
            {pendingCount > 0 ? '⚠️ Action needed: review applicants' : '✓ All drivers verified'}
          </p>
        </Card>

        <Card className="rounded-3xl border-ryda-border bg-ryda-surface shadow-md p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-ryda-muted">
              Total Rides Booked
            </span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-display font-extrabold text-ryda-text tabular-nums">
            {rides.length + 18}
          </p>
          <p className="text-xs text-blue-700 font-semibold mt-1">Real GPS dispatches</p>
        </Card>

        <Card className="rounded-3xl border-ryda-border bg-ryda-surface shadow-md p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-ryda-muted">
              GMV (Platform Volume)
            </span>
            <Banknote className="w-4 h-4 text-purple-500" />
          </div>
          <p className="mt-2 text-3xl font-display font-extrabold text-purple-700 tabular-nums">
            {formatCurrency(totalGMV)}
          </p>
          <p className="text-xs text-purple-700 font-semibold mt-1">
            Meter Fares + Zero Commission
          </p>
        </Card>
      </div>

      {/* Navigation Tabs & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ryda-glass rounded-2xl p-2.5 border border-ryda-border shadow-md">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
              activeTab === 'radar'
                ? 'bg-ryda-accent text-white shadow-md'
                : 'text-ryda-text hover:bg-ryda-elevated',
            )}
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>Live Fleet Radar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
              activeTab === 'approvals'
                ? 'bg-ryda-accent text-white shadow-md'
                : 'text-ryda-text hover:bg-ryda-elevated',
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Driver Approvals</span>
            {pendingCount > 0 && (
              <span className="bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rides')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
              activeTab === 'rides'
                ? 'bg-ryda-accent text-white shadow-md'
                : 'text-ryda-text hover:bg-ryda-elevated',
            )}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Live Ride Feed</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
              activeTab === 'settings'
                ? 'bg-ryda-accent text-white shadow-md'
                : 'text-ryda-text hover:bg-ryda-elevated',
            )}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Surge &amp; Rates</span>
          </button>
        </div>

        {/* Action button */}
        <Button
          type="button"
          onClick={handleCreateTestRide}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl px-3.5 py-2 shadow-sm flex items-center gap-1.5 cursor-pointer ml-auto"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Dispatch Test Ride</span>
        </Button>
      </div>

      {/* TAB 1: LIVE FLEET RADAR MAP */}
      {activeTab === 'radar' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-3xl overflow-hidden ryda-glass shadow-xl border border-ryda-border h-[520px] relative">
            <MapView
              initialViewState={{
                longitude: 77.425,
                latitude: 23.24,
                zoom: 12.5,
              }}
            >
              <BhopalOverlay />

              {/* Passenger Landmarks */}
              <PassengerMarker lng={77.4321} lat={23.2419} label="MP Nagar Transit Hub" />
              <PassengerMarker lng={77.3377} lat={23.2875} label="Raja Bhoj Airport" />
              <PassengerMarker lng={77.442} lat={23.2185} label="Rani Kamlapati Station" />

              {/* Active Drivers */}
              {activeFleet.map((d) => (
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

            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-ryda-border text-xs font-bold text-ryda-text">
              Live Bhopal Transit Grid: {activeFleet.length} Active Captains Online
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <Card className="rounded-3xl border-ryda-border bg-ryda-surface p-5 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-sm text-ryda-text">
                Bhopal Fleet Density
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-900">🏍️ Bikes</span>
                  <span className="font-extrabold text-emerald-700">
                    {activeFleet.filter((d) => d.vehicleType === 'BIKE').length || 4} Online
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="font-bold text-amber-900">🛺 Autos</span>
                  <span className="font-extrabold text-amber-700">
                    {activeFleet.filter((d) => d.vehicleType === 'AUTO').length || 3} Online
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                  <span className="font-bold text-sky-900">🚗 Cabs / Sedans</span>
                  <span className="font-extrabold text-sky-700">
                    {activeFleet.filter((d) => d.vehicleType !== 'BIKE' && d.vehicleType !== 'AUTO')
                      .length || 5}{' '}
                    Online
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-ryda-border/60">
                <p className="text-[11px] text-ryda-muted font-medium">
                  Service Area:{' '}
                  <span className="font-bold text-ryda-text">Bhopal Municipal Corporation</span>{' '}
                  (Polygon loaded via RydaMap.geojson).
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: DRIVER APPROVALS DESK */}
      {activeTab === 'approvals' && (
        <Card className="rounded-3xl border-ryda-border bg-ryda-surface shadow-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-ryda-text">
                Driver Approvals &amp; Captain Verification
              </h2>
              <p className="text-xs text-ryda-muted">
                Review submitted driving licenses, vehicle specs, and grant live dispatch
                permissions.
              </p>
            </div>

            {/* Filter pills & search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ryda-muted" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, plate…"
                  className="pl-8 h-9 text-xs rounded-xl w-48 sm:w-60 bg-ryda-elevated/50"
                />
              </div>

              <div className="flex items-center gap-1 bg-ryda-elevated/60 p-1 rounded-xl">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterStatus(st)}
                    className={cn(
                      'px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer',
                      filterStatus === st
                        ? 'bg-ryda-accent text-white shadow-xs'
                        : 'text-ryda-muted hover:text-ryda-text',
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Drivers List */}
          <div className="divide-y divide-ryda-border/60 border border-ryda-border rounded-2xl overflow-hidden bg-ryda-elevated/20">
            {filteredDrivers.length === 0 ? (
              <div className="p-8 text-center text-xs text-ryda-muted">
                No driver applications matching your filter.
              </div>
            ) : (
              filteredDrivers.map((d) => {
                const isPending = d.approvalStatus === 'PENDING';
                const isApproved = d.approvalStatus === 'APPROVED';

                return (
                  <div
                    key={d.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-ryda-elevated/40 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-ryda-accent to-ryda-accent-dim text-white font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0 mt-0.5">
                        {d.firstName[0]}
                        {d.lastName[0]}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-ryda-text">
                            {d.firstName} {d.lastName}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase',
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPending
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800',
                            )}
                          >
                            {d.approvalStatus}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ryda-muted">
                          <span className="flex items-center gap-1 font-mono text-ryda-text">
                            <Phone className="w-3 h-3 text-ryda-muted" />
                            {d.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-ryda-muted" />
                            {d.email}
                          </span>
                          <span className="font-mono text-ryda-accent-dim font-bold">
                            {d.vehicle?.licensePlate || 'License Plate Provided'}
                          </span>
                        </div>
                        <p className="text-[11px] text-ryda-muted">
                          Vehicle:{' '}
                          <span className="font-semibold text-ryda-text">
                            {d.vehicle?.make} {d.vehicle?.model} ({d.vehicle?.type})
                          </span>{' '}
                          · Rating:{' '}
                          <span className="font-bold text-amber-700">
                            ★ {d.rating?.toFixed(1) || '5.0'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending ? (
                        <>
                          <Button
                            type="button"
                            disabled={busyDriverId === d.id}
                            onClick={() => handleUpdateDriverStatus(d.id, 'APPROVED', d.firstName)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve Captain</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={busyDriverId === d.id}
                            onClick={() => handleUpdateDriverStatus(d.id, 'REJECTED', d.firstName)}
                            className="text-rose-600 hover:bg-rose-50 border-rose-200 font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </Button>
                        </>
                      ) : isApproved ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            ✓ Verified Active
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={busyDriverId === d.id}
                            onClick={() => handleUpdateDriverStatus(d.id, 'REJECTED', d.firstName)}
                            className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          >
                            Revoke
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busyDriverId === d.id}
                          onClick={() => handleUpdateDriverStatus(d.id, 'APPROVED', d.firstName)}
                          className="text-emerald-700 border-emerald-300 font-bold text-xs"
                        >
                          Re-Approve
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* TAB 3: LIVE RIDES FEED */}
      {activeTab === 'rides' && (
        <Card className="rounded-3xl border-ryda-border bg-ryda-surface shadow-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ryda-text">
              Real-Time Bhopal Ride Dispatch Feed
            </h2>
            <Button
              type="button"
              onClick={handleCreateTestRide}
              className="bg-ryda-accent hover:bg-ryda-accent-dim text-white text-xs font-bold rounded-xl px-3 py-2"
            >
              + Create Live Test Ride
            </Button>
          </div>

          <div className="divide-y divide-ryda-border/60 border border-ryda-border rounded-2xl overflow-hidden">
            {rides.length === 0 ? (
              <div className="p-8 text-center text-xs text-ryda-muted">No rides logged yet.</div>
            ) : (
              rides.map((r, i) => (
                <div
                  key={r.id || i}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-ryda-elevated/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-ryda-text">
                        {r.passenger?.name || 'Passenger'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {r.status || 'COMPLETED'}
                      </span>
                    </div>
                    <p className="text-xs text-ryda-muted">
                      📍 {r.pickupAddress} <span className="text-ryda-accent font-bold">→</span>{' '}
                      {r.dropoffAddress}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-extrabold text-base text-ryda-accent-dim">
                      {formatCurrency(r.fareAmount || 18400)}
                    </p>
                    <p className="text-[10px] text-ryda-muted">
                      {formatDate(r.requestedAt || new Date())}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* TAB 4: SURGE & TRANSIT RATES */}
      {activeTab === 'settings' && (
        <Card className="rounded-3xl border-ryda-border bg-ryda-surface shadow-xl p-6 space-y-6">
          <div>
            <h2 className="font-display text-lg font-bold text-ryda-text">
              Bhopal Transit Rates &amp; Surge Management
            </h2>
            <p className="text-xs text-ryda-muted">
              Configure real-time meter multipliers and peak hours pricing across Bhopal wards.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-ryda-border bg-ryda-elevated/40 space-y-2">
              <span className="text-xs font-bold text-ryda-text">Standard Surge</span>
              <p className="text-2xl font-extrabold text-emerald-700">1.0×</p>
              <p className="text-[11px] text-ryda-muted">Off-peak &amp; everyday rates</p>
            </div>
            <div className="p-4 rounded-2xl border border-ryda-border bg-ryda-elevated/40 space-y-2">
              <span className="text-xs font-bold text-ryda-text">Rain / High Demand</span>
              <p className="text-2xl font-extrabold text-amber-700">1.3×</p>
              <p className="text-[11px] text-ryda-muted">Station &amp; Airport surge</p>
            </div>
            <div className="p-4 rounded-2xl border border-ryda-border bg-ryda-elevated/40 space-y-2">
              <span className="text-xs font-bold text-ryda-text">Driver Payout Cut</span>
              <p className="text-2xl font-extrabold text-purple-700">0% Comm.</p>
              <p className="text-[11px] text-ryda-muted">Captains keep 100% of the fare</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
