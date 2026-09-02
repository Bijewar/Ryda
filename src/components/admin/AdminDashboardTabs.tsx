'use client';

import { BhopalOverlay } from '@/components/maps/BhopalOverlay';
import { DemandHotspotsLayer } from '@/components/maps/DemandHotspotsLayer';
import { MapView } from '@/components/maps/MapView';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { BhopalZoneData, SystemConfig } from '@/types/reliability';
import {
  Award,
  DollarSign,
  Flame,
  Save,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export interface AdminDashboardTabsProps {
  initialConfig: SystemConfig;
  initialReliabilityStats: any;
  initialZones: BhopalZoneData[];
  driversTableNode: React.ReactNode;
  recentRidesNode: React.ReactNode;
}

export function AdminDashboardTabs({
  initialConfig,
  initialReliabilityStats,
  initialZones,
  driversTableNode,
  recentRidesNode,
}: AdminDashboardTabsProps): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<
    'overview' | 'reliability' | 'compensation' | 'demand' | 'settings'
  >('overview');
  const [config, setConfig] = React.useState<SystemConfig>(initialConfig);
  const [zones] = React.useState<BhopalZoneData[]>(initialZones);
  const [mapMode, setMapMode] = React.useState<
    'current' | 'prediction10m' | 'prediction30m' | 'repositioning'
  >('current');
  const [isSavingConfig, setIsSavingConfig] = React.useState(false);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error('Failed to update settings');
      const json = await res.json();
      if (json.data) setConfig(json.data);

      toast.success('System Rules Saved Successfully! ⚙️', {
        description:
          'New cancellation allowances, penalty rates, and compensation rules are now active.',
      });
    } catch (err) {
      toast.error('Save Failed', {
        description: err instanceof Error ? err.message : 'Please check connection.',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const stats = initialReliabilityStats?.stats ?? {
    totalDrivers: 8,
    reliableDriversCount: 6,
    totalCancellations: 4,
    penalizedCancellationsCount: 1,
    totalCompensationPaise: 15000,
  };

  const compensations = initialReliabilityStats?.compensations ?? [];
  const cancellations = initialReliabilityStats?.recentCancellations ?? [];
  const topDrivers = initialReliabilityStats?.topDrivers ?? [];
  const flaggedDrivers = initialReliabilityStats?.flaggedDrivers ?? [];

  return (
    <div className="space-y-6">
      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ryda-border/80 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-ryda-accent text-ryda-bg shadow-md'
              : 'text-ryda-muted hover:bg-ryda-surface hover:text-ryda-text'
          }`}
        >
          <Users className="h-4 w-4" />
          Driver Approvals
        </button>

        <button
          onClick={() => setActiveTab('reliability')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'reliability'
              ? 'bg-ryda-accent text-ryda-bg shadow-md'
              : 'text-ryda-muted hover:bg-ryda-surface hover:text-ryda-text'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Driver Reliability & Penalties
        </button>

        <button
          onClick={() => setActiveTab('compensation')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'compensation'
              ? 'bg-ryda-accent text-ryda-bg shadow-md'
              : 'text-ryda-muted hover:bg-ryda-surface hover:text-ryda-text'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Customer Compensation
        </button>

        <button
          onClick={() => setActiveTab('demand')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'demand'
              ? 'bg-ryda-accent text-ryda-bg shadow-md'
              : 'text-ryda-muted hover:bg-ryda-surface hover:text-ryda-text'
          }`}
        >
          <Flame className="h-4 w-4 text-amber-400" />
          AI Demand & Hotspot Forecast
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-ryda-accent text-ryda-bg shadow-md'
              : 'text-ryda-muted hover:bg-ryda-surface hover:text-ryda-text'
          }`}
        >
          <Settings className="h-4 w-4" />
          System Rule Settings
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW (Existing Drivers Approval & Recent Rides) ───────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in-50">
          {driversTableNode}
          {recentRidesNode}
        </div>
      )}

      {/* ── TAB 2: DRIVER RELIABILITY & PENALTIES ────────────────────────────── */}
      {activeTab === 'reliability' && (
        <div className="space-y-6 animate-in fade-in-50">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="border-ryda-border bg-ryda-elevated">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-ryda-muted">Reliable Drivers</span>
                <p className="text-2xl font-bold text-emerald-400 font-mono">
                  {stats.reliableDriversCount} / {stats.totalDrivers}
                </p>
                <span className="text-[10px] text-emerald-400/80">+2% earnings bonus active</span>
              </CardContent>
            </Card>

            <Card className="border-ryda-border bg-ryda-elevated">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-ryda-muted">Driver Cancellations</span>
                <p className="text-2xl font-bold text-ryda-text font-mono">
                  {stats.totalCancellations}
                </p>
                <span className="text-[10px] text-ryda-muted">Total recorded</span>
              </CardContent>
            </Card>

            <Card className="border-ryda-border bg-ryda-elevated">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-ryda-muted">Penalized Cancellations</span>
                <p className="text-2xl font-bold text-destructive font-mono">
                  {stats.penalizedCancellationsCount}
                </p>
                <span className="text-[10px] text-destructive/80">Exceeded monthly limit</span>
              </CardContent>
            </Card>

            <Card className="border-ryda-border bg-ryda-elevated">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-ryda-muted">Monthly Allowance</span>
                <p className="text-2xl font-bold text-ryda-accent font-mono">
                  {config.freeCancellationsLimit}
                </p>
                <span className="text-[10px] text-ryda-muted">Free cancellations/driver</span>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Reliable Drivers */}
            <Card className="border-ryda-border bg-ryda-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-400" />
                  Top Reliable Drivers in Bhopal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-ryda-border/60">
                  {topDrivers.map((d: any) => (
                    <li key={d.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-ryda-text">
                          {d.firstName} {d.lastName}
                        </p>
                        <p className="text-[11px] text-ryda-muted">
                          {d.totalRides} rides · {d.rating.toFixed(1)} ★
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-mono font-bold text-xs">
                          {d.reliabilityScore ?? 98}/100
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Flagged / High Cancellation Drivers */}
            <Card className="border-ryda-border bg-ryda-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  Cancellation Watchlist
                </CardTitle>
              </CardHeader>
              <CardContent>
                {flaggedDrivers.length === 0 ? (
                  <p className="py-8 text-center text-xs text-ryda-muted">
                    No drivers currently flagged for excessive cancellations.
                  </p>
                ) : (
                  <ul className="divide-y divide-ryda-border/60">
                    {flaggedDrivers.map((d: any) => (
                      <li key={d.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-ryda-text">
                            {d.firstName} {d.lastName}
                          </p>
                          <p className="text-[11px] text-destructive">
                            {d.penalizedCancellations} penalized cancellations
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-destructive/15 text-destructive font-mono font-bold text-xs">
                            {d.reliabilityScore}/100
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cancellation History Log */}
          <Card className="border-ryda-border bg-ryda-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Recent Cancellation History Log</CardTitle>
            </CardHeader>
            <CardContent>
              {cancellations.length === 0 ? (
                <p className="py-6 text-center text-xs text-ryda-muted">
                  No cancellation events logged yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-ryda-border text-ryda-muted">
                        <th className="pb-2">Driver</th>
                        <th className="pb-2">Reason Category</th>
                        <th className="pb-2">Details</th>
                        <th className="pb-2">Penalty</th>
                        <th className="pb-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ryda-border/40">
                      {cancellations.map((c: any) => (
                        <tr key={c.id} className="py-2">
                          <td className="py-2.5 font-medium">
                            {c.driver?.firstName} {c.driver?.lastName}
                          </td>
                          <td className="py-2.5">
                            <Badge
                              variant={c.isPenalized ? 'destructive' : 'secondary'}
                              className="text-[10px]"
                            >
                              {c.reasonCategory}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-ryda-muted">{c.reasonDetails ?? '—'}</td>
                          <td className="py-2.5 font-mono">
                            {c.isPenalized ? (
                              <span className="text-destructive font-bold">
                                {formatCurrency(c.penaltyAmount)}
                              </span>
                            ) : (
                              <span className="text-emerald-400">Waived</span>
                            )}
                          </td>
                          <td className="py-2.5 text-ryda-muted">{formatDate(c.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 3: CUSTOMER COMPENSATION ────────────────────────────────────── */}
      {activeTab === 'compensation' && (
        <div className="space-y-6 animate-in fade-in-50">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Card className="border-ryda-border bg-ryda-elevated">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-ryda-muted">Total Compensation Paid</span>
                <p className="text-2xl font-bold text-ryda-accent font-mono">
                  {formatCurrency(stats.totalCompensationPaise)}
                </p>
                <span className="text-[10px] text-emerald-400">Automatic ride credits issued</span>
              </CardContent>
            </Card>

            <Card className="border-ryda-border bg-ryda-elevated">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-ryda-muted">Claims Processed</span>
                <p className="text-2xl font-bold text-ryda-text font-mono">
                  {compensations.length}
                </p>
                <span className="text-[10px] text-ryda-muted">
                  Driver cancellation compensations
                </span>
              </CardContent>
            </Card>

            <Card className="border-ryda-border bg-ryda-elevated">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-ryda-muted">Base Compensation</span>
                <p className="text-2xl font-bold text-ryda-accent font-mono">
                  {formatCurrency(config.customerCompensationBaseAmount)}
                </p>
                <span className="text-[10px] text-ryda-muted">Adjusted by passenger wait time</span>
              </CardContent>
            </Card>
          </div>

          <Card className="border-ryda-border bg-ryda-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Issued Customer Compensations</CardTitle>
            </CardHeader>
            <CardContent>
              {compensations.length === 0 ? (
                <p className="py-8 text-center text-xs text-ryda-muted">
                  No customer compensations issued yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-ryda-border text-ryda-muted">
                        <th className="pb-2">Passenger</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Reason</th>
                        <th className="pb-2">Multiplier</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ryda-border/40">
                      {compensations.map((c: any) => (
                        <tr key={c.id}>
                          <td className="py-2.5 font-medium">{c.passenger?.name}</td>
                          <td className="py-2.5 font-mono font-bold text-emerald-400">
                            {formatCurrency(c.amount)}
                          </td>
                          <td className="py-2.5 text-ryda-muted">{c.reason}</td>
                          <td className="py-2.5 font-mono">{c.inconvenienceScore}x</td>
                          <td className="py-2.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            >
                              {c.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-ryda-muted">{formatDate(c.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 4: AI DEMAND & HOTSPOT FORECAST ──────────────────────────────── */}
      {activeTab === 'demand' && (
        <div className="space-y-6 animate-in fade-in-50">
          {/* Map Controls Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-ryda-border bg-ryda-elevated">
            <div>
              <h3 className="text-sm font-bold text-ryda-text flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400" />
                Live Bhopal Demand Zones &amp; Multi-Horizon AI Forecast
              </h3>
              <p className="text-xs text-ryda-muted">
                Toggle prediction horizons to view future supply-demand imbalances
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={mapMode === 'current' ? 'default' : 'outline'}
                onClick={() => setMapMode('current')}
                className={`text-xs h-8 ${mapMode === 'current' ? 'bg-ryda-accent text-ryda-bg font-bold' : 'border-ryda-border'}`}
              >
                Current Demand
              </Button>
              <Button
                size="sm"
                variant={mapMode === 'prediction10m' ? 'default' : 'outline'}
                onClick={() => setMapMode('prediction10m')}
                className={`text-xs h-8 ${mapMode === 'prediction10m' ? 'bg-ryda-accent text-ryda-bg font-bold' : 'border-ryda-border'}`}
              >
                Forecast +10m
              </Button>
              <Button
                size="sm"
                variant={mapMode === 'prediction30m' ? 'default' : 'outline'}
                onClick={() => setMapMode('prediction30m')}
                className={`text-xs h-8 ${mapMode === 'prediction30m' ? 'bg-ryda-accent text-ryda-bg font-bold' : 'border-ryda-border'}`}
              >
                Forecast +30m
              </Button>
              <Button
                size="sm"
                variant={mapMode === 'repositioning' ? 'default' : 'outline'}
                onClick={() => setMapMode('repositioning')}
                className={`text-xs h-8 ${mapMode === 'repositioning' ? 'bg-amber-500 text-black font-bold' : 'border-ryda-border'}`}
              >
                🔥 Repositioning Zones
              </Button>
            </div>
          </div>

          {/* Map Display */}
          <Card className="overflow-hidden border-ryda-border">
            <CardContent className="p-0">
              <div className="relative h-[450px]">
                <MapView
                  initialViewState={{
                    longitude: 77.4321,
                    latitude: 23.2419,
                    zoom: 11.5,
                  }}
                >
                  <BhopalOverlay />
                  <DemandHotspotsLayer zones={zones} mode={mapMode} />
                </MapView>
              </div>
            </CardContent>
          </Card>

          {/* Demand Zones Data Grid */}
          <Card className="border-ryda-border bg-ryda-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">
                Bhopal Service Area Zone Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {zones.map((z) => (
                  <div
                    key={z.id}
                    className="p-3.5 rounded-xl border border-ryda-border/70 bg-ryda-surface/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ryda-text">{z.name}</span>
                      <Badge
                        variant="outline"
                        className={
                          z.currentDemandLevel === 'VERY_HIGH'
                            ? 'bg-red-500/15 text-red-400 border-red-500/40 text-[10px]'
                            : z.currentDemandLevel === 'HIGH'
                              ? 'bg-orange-500/15 text-orange-400 border-orange-500/40 text-[10px]'
                              : z.currentDemandLevel === 'MEDIUM'
                                ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40 text-[10px]'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 text-[10px]'
                        }
                      >
                        {z.currentDemandLevel}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-ryda-muted">
                      <div>
                        30m Forecast:{' '}
                        <span className="font-semibold text-ryda-text">{z.predictedDemand30m}</span>
                      </div>
                      <div>
                        Shortage:{' '}
                        <span className="font-semibold text-destructive">
                          {z.driverShortage} cars
                        </span>
                      </div>
                      <div>
                        Active Drivers:{' '}
                        <span className="font-semibold text-ryda-text">{z.activeDrivers}</span>
                      </div>
                      <div>
                        Bonus:{' '}
                        <span className="font-mono font-bold text-amber-400">
                          {formatCurrency(z.repositioningIncentive)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 5: SYSTEM RULE SETTINGS ─────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveConfig} className="space-y-6 animate-in fade-in-50">
          <Card className="border-ryda-border bg-ryda-elevated">
            <CardHeader className="pb-3 border-b border-ryda-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-ryda-text">
                    Configurable System Rules &amp; Thresholds
                  </CardTitle>
                  <p className="text-xs text-ryda-muted">
                    All parameters take effect immediately across matching, penalties, and driver
                    rewards.
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={isSavingConfig}
                  className="bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim font-bold text-xs gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  {isSavingConfig ? 'Saving…' : 'Save Rules'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Section 1: Driver Cancellation Rules */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-ryda-accent uppercase tracking-wider">
                  Driver Cancellation &amp; Progressive Penalty Settings
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Free Monthly Cancellations Limit</Label>
                    <Input
                      type="number"
                      value={config.freeCancellationsLimit}
                      onChange={(e) =>
                        setConfig({ ...config, freeCancellationsLimit: Number(e.target.value) })
                      }
                      className="bg-ryda-surface"
                    />
                    <p className="text-[10px] text-ryda-muted">
                      Eligible cancellations allowed without penalty per month
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Base Penalty Fee (₹)</Label>
                    <Input
                      type="number"
                      value={config.basePenaltyAmount / 100}
                      onChange={(e) =>
                        setConfig({ ...config, basePenaltyAmount: Number(e.target.value) * 100 })
                      }
                      className="bg-ryda-surface"
                    />
                    <p className="text-[10px] text-ryda-muted">
                      Fee for 1st cancellation over monthly allowance
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Progressive Increment (₹)</Label>
                    <Input
                      type="number"
                      value={config.progressivePenaltyIncrement / 100}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          progressivePenaltyIncrement: Number(e.target.value) * 100,
                        })
                      }
                      className="bg-ryda-surface"
                    />
                    <p className="text-[10px] text-ryda-muted">
                      Additional fee per subsequent avoidable cancellation
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Maximum Penalty Cap (₹)</Label>
                    <Input
                      type="number"
                      value={config.maxPenaltyAmount / 100}
                      onChange={(e) =>
                        setConfig({ ...config, maxPenaltyAmount: Number(e.target.value) * 100 })
                      }
                      className="bg-ryda-surface"
                    />
                    <p className="text-[10px] text-ryda-muted">
                      Upper limit per single cancellation event
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Max Cancellation Rate Threshold (%)</Label>
                    <Input
                      type="number"
                      value={config.cancellationRateThreshold}
                      onChange={(e) =>
                        setConfig({ ...config, cancellationRateThreshold: Number(e.target.value) })
                      }
                      className="bg-ryda-surface"
                    />
                    <p className="text-[10px] text-ryda-muted">
                      Rates above this trigger driver penalty warnings
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Reliable Driver Rewards */}
              <div className="space-y-3 pt-4 border-t border-ryda-border/60">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Reliable Driver Reward Parameters
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Required Completion Rate (%)</Label>
                    <Input
                      type="number"
                      value={config.reliableDriverCompletionRate}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          reliableDriverCompletionRate: Number(e.target.value),
                        })
                      }
                      className="bg-ryda-surface"
                    />
                    <p className="text-[10px] text-ryda-muted">
                      Minimum completion rate to earn Reliable Driver status
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Earnings Bonus Multiplier (%)</Label>
                    <Input
                      type="number"
                      value={config.reliableDriverBonusRate * 100}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          reliableDriverBonusRate: Number(e.target.value) / 100,
                        })
                      }
                      className="bg-ryda-surface"
                    />
                    <p className="text-[10px] text-ryda-muted">
                      Extra payout percentage for reliable drivers (e.g. 2%)
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Customer Compensation */}
              <div className="space-y-3 pt-4 border-t border-ryda-border/60">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Customer Inconvenience Compensation
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Base Customer Ride Credit (₹)</Label>
                    <Input
                      type="number"
                      value={config.customerCompensationBaseAmount / 100}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          customerCompensationBaseAmount: Number(e.target.value) * 100,
                        })
                      }
                      className="bg-ryda-surface"
                    />
                    <p className="text-[10px] text-ryda-muted">
                      Default compensation credited when driver cancels
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Maximum Compensation (₹)</Label>
                    <Input
                      type="number"
                      value={config.customerCompensationMaxAmount / 100}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          customerCompensationMaxAmount: Number(e.target.value) * 100,
                        })
                      }
                      className="bg-ryda-surface"
                    />
                    <p className="text-[10px] text-ryda-muted">
                      Cap for high wait-time cancellations
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4: Repositioning Incentives */}
              <div className="space-y-3 pt-4 border-t border-ryda-border/60">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  AI Repositioning Incentives &amp; Budget
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Minimum Incentive (₹)</Label>
                    <Input
                      type="number"
                      value={config.repositioningMinIncentive / 100}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          repositioningMinIncentive: Number(e.target.value) * 100,
                        })
                      }
                      className="bg-ryda-surface"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Maximum Incentive (₹)</Label>
                    <Input
                      type="number"
                      value={config.repositioningMaxIncentive / 100}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          repositioningMaxIncentive: Number(e.target.value) * 100,
                        })
                      }
                      className="bg-ryda-surface"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Daily Repositioning Budget (₹)</Label>
                    <Input
                      type="number"
                      value={config.repositioningDailyBudget / 100}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          repositioningDailyBudget: Number(e.target.value) * 100,
                        })
                      }
                      className="bg-ryda-surface"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
