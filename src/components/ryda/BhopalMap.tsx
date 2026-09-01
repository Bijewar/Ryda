"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Activity, Radio, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "./AnimatedCounter";
import { cn } from "@/lib/utils";

/* ----- Types ----- */

interface BhopalFeature {
  type: "Feature";
  properties: {
    name?: string;
    centroid?: [number, number];
    bbox?: [number, number, number, number];
    area_km2?: number;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

interface BhopalGeoJSON {
  type: "FeatureCollection";
  features: BhopalFeature[];
}

interface Driver {
  name: string;
  vehicle: string;
  eta: string;
  ward: string;
  lon: number;
  lat: number;
}

/* ----- Constants ----- */

const DRIVERS: Driver[] = [
  { name: "Arjun Singh",       vehicle: "Maruti Swift · MP04 AB 1234",  eta: "3 min", ward: "MP Nagar",     lon: 77.4627, lat: 23.2310 },
  { name: "Ravi Verma",        vehicle: "Hyundai i20 · MP04 CD 5678",   eta: "5 min", ward: "New Market",   lon: 77.4040, lat: 23.2530 },
  { name: "Suresh Kumar",      vehicle: "Toyota Etios · MP04 EF 9012",  eta: "2 min", ward: "Habibganj",    lon: 77.4660, lat: 23.2450 },
  { name: "Imran Khan",        vehicle: "Maruti Dzire · MP04 GH 3456",  eta: "7 min", ward: "Old City",     lon: 77.4080, lat: 23.2370 },
  { name: "Deepak Sharma",     vehicle: "Tata Tigor · MP04 IJ 7890",    eta: "4 min", ward: "BHEL",          lon: 77.4730, lat: 23.2730 },
  { name: "Mohammed Yusuf",    vehicle: "Honda Amaze · MP04 KL 1122",   eta: "6 min", ward: "Kolar",         lon: 77.4280, lat: 23.2150 },
  { name: "Prakash Malviya",   vehicle: "Maruti Swift · MP04 MN 3344",  eta: "3 min", ward: "Arera Colony",  lon: 77.4380, lat: 23.2010 },
  { name: "Anil Rathore",      vehicle: "Hyundai Verna · MP04 OP 5566", eta: "8 min", ward: "Shahpura",     lon: 77.4480, lat: 23.1960 },
  { name: "Vikas Tiwari",      vehicle: "Toyota Etios · MP04 QR 7788",  eta: "5 min", ward: "Bairagarh",    lon: 77.4500, lat: 23.3000 },
  { name: "Nadeem Ahmed",      vehicle: "Maruti Dzire · MP04 ST 9900",  eta: "4 min", ward: "TT Nagar",      lon: 77.4200, lat: 23.2200 },
];

const CENTROID: [number, number] = [77.37865460965641, 23.4873398029371];

// Route for the animated "vehicle driving" — MP Nagar → Habibganj
const ROUTE: [number, number][] = [
  [77.4627, 23.2310], // MP Nagar
  [77.4540, 23.2360],
  [77.4600, 23.2410],
  [77.4660, 23.2450], // Habibganj
];

const VB_WIDTH = 600;
const VB_HEIGHT = 960;
const PADDING = 28;

/* ----- Projection helpers ----- */

interface Projection {
  bbox: [number, number, number, number];
  toXY: (lon: number, lat: number) => { x: number; y: number };
  toPct: (lon: number, lat: number) => { xPct: number; yPct: number };
}

function buildProjection(bbox: [number, number, number, number]): Projection {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const lonRange = maxLon - minLon || 1;
  const latRange = maxLat - minLat || 1;
  const availW = VB_WIDTH - PADDING * 2;
  const availH = VB_HEIGHT - PADDING * 2;
  const scale = Math.min(availW / lonRange, availH / latRange);
  const usedW = lonRange * scale;
  const usedH = latRange * scale;
  const offsetX = PADDING + (availW - usedW) / 2;
  const offsetY = PADDING + (availH - usedH) / 2;
  const toXY = (lon: number, lat: number) => ({
    x: offsetX + (lon - minLon) * scale,
    y: offsetY + (maxLat - lat) * scale,
  });
  const toPct = (lon: number, lat: number) => {
    const { x, y } = toXY(lon, lat);
    return { xPct: x / VB_WIDTH, yPct: y / VB_HEIGHT };
  };
  return { bbox, toXY, toPct };
}

/* ----- Live stats panel ----- */

interface LiveStats {
  drivers: number;
  eta: string;
  surge: string;
  active: number;
}

function useLiveStats(): LiveStats {
  const [stats, setStats] = useState<LiveStats>({
    drivers: 8,
    eta: "4.2",
    surge: "1.0",
    active: 12,
  });
  useEffect(() => {
    const id = setInterval(() => {
      setStats({
        drivers: 7 + Math.floor(Math.random() * 3),
        eta: (3.8 + Math.random() * 0.8).toFixed(1),
        surge: "1.0",
        active: 10 + Math.floor(Math.random() * 5),
      });
    }, 3200);
    return () => clearInterval(id);
  }, []);
  return stats;
}

/* ----- Stat row ----- */

function StatRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Navigation;
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-ryda-border last:border-b-0">
      <div className="flex items-center gap-2.5 text-sm text-ryda-muted">
        <Icon className="size-4" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div
        className={cn(
          "text-sm font-semibold tabular-nums",
          accent ? "text-ryda-primary" : "text-ryda-text",
        )}
      >
        {value}
      </div>
    </div>
  );
}

/* ----- Main component ----- */

export function BhopalMap() {
  const [geo, setGeo] = useState<BhopalGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const stats = useLiveStats();

  useEffect(() => {
    let cancelled = false;
    fetch("/geo/bhopal-boundary-simplified.geojson")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<BhopalGeoJSON>;
      })
      .then((data) => {
        if (cancelled) return;
        setGeo(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load GeoJSON");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const projection = useMemo<Projection | null>(() => {
    if (!geo?.features?.[0]) return null;
    const f = geo.features[0];
    const bbox =
      f.properties.bbox ??
      (f.geometry.coordinates?.[0]?.length
        ? computeBbox(f.geometry.coordinates[0])
        : null);
    if (!bbox) return null;
    return buildProjection(bbox);
  }, [geo]);

  const pathD = useMemo<string>(() => {
    if (!projection || !geo?.features?.[0]) return "";
    const ring = geo.features[0].geometry.coordinates[0];
    if (!ring?.length) return "";
    return (
      ring
        .map(([lon, lat], i) => {
          if (lon === undefined || lat === undefined) return "";
          const { x, y } = projection.toXY(lon, lat);
          return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .filter(Boolean)
        .join(" ") + " Z"
    );
  }, [projection, geo]);

  const centroidXY = useMemo(() => {
    if (!projection) return null;
    return projection.toXY(CENTROID[0], CENTROID[1]);
  }, [projection]);

  // Route polyline + path length for animated car
  const routeXY = useMemo(() => {
    if (!projection) return null;
    return ROUTE.map(([lon, lat]) => projection.toXY(lon, lat));
  }, [projection]);

  const routePathD = useMemo(() => {
    if (!routeXY || routeXY.length === 0) return "";
    return (
      routeXY
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
        .join(" ") + " Z"
    );
  }, [routeXY]);

  return (
    <section
      id="bhopal"
      aria-labelledby="bhopal-heading"
      className="relative scroll-mt-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col gap-3 mb-8 sm:mb-12">
            <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-ryda-primary">
              <MapPin className="size-3.5" aria-hidden="true" />
              Geofence · PostGIS ST_Contains
            </span>
            <h2
              id="bhopal-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ryda-text font-display"
            >
              Bhopal, geofenced.
            </h2>
            <p className="max-w-2xl text-base sm:text-lg text-ryda-muted leading-relaxed">
              The official OpenStreetMap district boundary (2,778 km², 465
              vertices) is the source of truth for every pickup, dropoff, and
              driver-online toggle. Hover any driver to inspect their live
              assignment — and watch the car ride along the route.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 lg:gap-6">
            {/* Map */}
            <div className="ryda-glass-elevated rounded-2xl p-3 sm:p-4 relative overflow-hidden">
              <div className="relative w-full" style={{ aspectRatio: `${VB_WIDTH} / ${VB_HEIGHT}` }}>
                <p className="sr-only">
                  Map of the Bhopal service area. The polygon outline shows the
                  official district boundary covering 2,778 square kilometres.
                  Ten simulated driver markers are positioned inside the
                  polygon at MP Nagar, New Market, Habibganj, Old City, BHEL,
                  Kolar, Arera Colony, Shahpura, Bairagarh, and TT Nagar. A
                  pulsing marker at the centroid (77.38° East, 23.49° North) is
                  labelled Bhopal. An animated car drives between MP Nagar and
                  Habibganj along a route polyline.
                </p>

                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Skeleton className="w-full h-full rounded-xl bg-ryda-surface-2" />
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-6"
                  >
                    <p className="text-sm text-ryda-muted">
                      Couldn&apos;t load the Bhopal boundary.
                    </p>
                    <p className="text-xs font-mono text-ryda-muted/70">
                      {error}
                    </p>
                  </div>
                )}

                {projection && !loading && !error && (
                  <>
                    <svg
                      viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
                      className="absolute inset-0 w-full h-full"
                      role="img"
                      aria-label="Bhopal service-area geofence with active driver markers and an animated car"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <defs>
                        {/* Light radial backdrop tint */}
                        <radialGradient id="ryda-map-bg" cx="50%" cy="42%" r="65%">
                          <stop offset="0%" stopColor="#FFE5DC" stopOpacity="0.55" />
                          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                        </radialGradient>
                        {/* Gradient stroke for the polygon (orange → pink) */}
                        <linearGradient id="ryda-poly-stroke" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%"  stopColor="#FF5722" />
                          <stop offset="100%" stopColor="#FF4081" />
                        </linearGradient>
                        {/* Gradient for the route polyline */}
                        <linearGradient id="ryda-route" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%"   stopColor="#FFD300" stopOpacity="0.95" />
                          <stop offset="100%" stopColor="#FF5722" stopOpacity="0.95" />
                        </linearGradient>
                        <filter id="ryda-glow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="2" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      <rect
                        x="0"
                        y="0"
                        width={VB_WIDTH}
                        height={VB_HEIGHT}
                        fill="url(#ryda-map-bg)"
                      />

                      {/* Boundary polygon — light theme: subtle orange tint + gradient stroke */}
                      {pathD && (
                        <>
                          <motion.path
                            d={pathD}
                            fill="#FF5722"
                            fillOpacity="0.05"
                            stroke="url(#ryda-poly-stroke)"
                            strokeOpacity="0.75"
                            strokeWidth="2"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            whileInView={{ pathLength: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.6, ease: "easeOut" }}
                          />
                        </>
                      )}

                      {/* Animated route polyline (draws in) */}
                      {routePathD && (
                        <motion.path
                          d={routePathD}
                          fill="none"
                          stroke="url(#ryda-route)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray="2 6"
                          initial={{ pathLength: 0, opacity: 0 }}
                          whileInView={{ pathLength: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                        />
                      )}

                      {/* Pickup point — yellow, big pulse */}
                      {routeXY && routeXY[0] && (
                        <g>
                          <circle
                            cx={routeXY[0].x}
                            cy={routeXY[0].y}
                            r="6"
                            fill="#FFD300"
                            opacity="0.45"
                            style={{
                              transformOrigin: `${routeXY[0].x}px ${routeXY[0].y}px`,
                              animation: "ryda-pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite",
                            }}
                          />
                          <circle cx={routeXY[0].x} cy={routeXY[0].y} r="4.5" fill="#FFD300" stroke="#FFFFFF" strokeWidth="1.5" />
                        </g>
                      )}
                      {/* Dropoff point — orange, smaller pulse */}
                      {(() => {
                        const lastPt = routeXY && routeXY.length > 0 ? routeXY[routeXY.length - 1] : undefined;
                        if (!lastPt) return null;
                        return (
                          <g>
                            <circle
                              cx={lastPt.x}
                              cy={lastPt.y}
                              r="4"
                              fill="#FF5722"
                              opacity="0.4"
                              style={{
                                transformOrigin: `${lastPt.x}px ${lastPt.y}px`,
                                animation: "ryda-pulse-ring 3.2s cubic-bezier(0.4,0,0.6,1) infinite",
                              }}
                            />
                            <circle cx={lastPt.x} cy={lastPt.y} r="3" fill="#FF5722" stroke="#FFFFFF" strokeWidth="1.2" />
                          </g>
                        );
                      })()}

                      {/* Animated car driving along the route (offset-path) */}
                      {routePathD && (
                        <g>
                          <motion.g
                            initial={{ offsetDistance: "0%" }}
                            animate={{ offsetDistance: ["0%", "100%"] }}
                            transition={{
                              duration: 6,
                              repeat: Infinity,
                              ease: "easeInOut",
                              repeatType: "loop",
                            }}
                            style={{
                              offsetPath: `path('${routePathD}')`,
                              offsetRotate: "auto",
                            } as any}
                          >
                            {/* mini car icon */}
                            <g transform="translate(-10, -8) scale(0.5)">
                              <ellipse cx="20" cy="22" rx="14" ry="2" fill="#0F0F17" opacity="0.18" />
                              <path d="M2 18 Q2 12 8 12 L14 12 Q16 6 22 6 L32 6 Q38 6 40 12 L46 14 Q50 14 50 18 L50 22 L2 22 Z" fill="#FF5722" />
                              <path d="M14 12 Q16 7 22 7 L32 7 Q38 7 40 12 L40 16 L14 16 Z" fill="#7DD3FC" opacity="0.85" />
                              <circle cx="14" cy="22" r="5" fill="#0F172A" />
                              <circle cx="14" cy="22" r="2.5" fill="#F3F4F6" />
                              <circle cx="38" cy="22" r="5" fill="#0F172A" />
                              <circle cx="38" cy="22" r="2.5" fill="#F3F4F6" />
                            </g>
                          </motion.g>
                        </g>
                      )}

                      {/* Centroid pulsing dot + label */}
                      {centroidXY && (
                        <g>
                          <circle
                            cx={centroidXY.x}
                            cy={centroidXY.y}
                            r="5"
                            fill="#FF5722"
                            opacity="0.35"
                            style={{
                              transformOrigin: `${centroidXY.x}px ${centroidXY.y}px`,
                              animation: "ryda-pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite",
                            }}
                          />
                          <circle cx={centroidXY.x} cy={centroidXY.y} r="4" fill="#FF5722" />
                          <text
                            x={centroidXY.x + 10}
                            y={centroidXY.y + 4}
                            fontSize="13"
                            fontFamily="var(--font-geist-sans), sans-serif"
                            fontWeight="700"
                            fill="#0F0F17"
                          >
                            Bhopal
                          </text>
                        </g>
                      )}

                      {/* Driver dots */}
                      {DRIVERS.map((d, i) => {
                        const { x, y } = projection.toXY(d.lon, d.lat);
                        const isHovered = hovered === i;
                        return (
                          <g
                            key={d.name}
                            tabIndex={0}
                            role="button"
                            aria-label={`${d.name}, ${d.vehicle}, ETA ${d.eta}, near ${d.ward}`}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                            onFocus={() => setHovered(i)}
                            onBlur={() => setHovered(null)}
                            style={{ cursor: "pointer" }}
                          >
                            <circle
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#FF5722"
                              opacity="0.5"
                              className={`ryda-stagger-${(i % 10) + 1}`}
                              style={{
                                transformOrigin: `${x}px ${y}px`,
                                animation: "ryda-driver-pulse 2.6s ease-in-out infinite",
                              }}
                            />
                            <circle
                              cx={x}
                              cy={y}
                              r={isHovered ? 5 : 3.5}
                              fill="#FFFFFF"
                              stroke="#FF5722"
                              strokeWidth="1.6"
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* HTML tooltip overlay */}
                    {hovered !== null &&
                      (() => {
                        const d = DRIVERS[hovered];
                        if (!d) return null;
                        const { xPct, yPct } = projection.toPct(d.lon, d.lat);
                        const flip = xPct > 0.62;
                        return (
                          <div
                            className="pointer-events-none absolute z-10 ryda-glass-elevated rounded-lg px-3 py-2 min-w-[180px] shadow-xl"
                            style={{
                              left: `${xPct * 100}%`,
                              top: `${yPct * 100}%`,
                              transform: `translate(${flip ? "-100%" : "0"}, calc(-100% - 14px))`,
                            }}
                          >
                            <div className="flex items-center gap-1.5 text-xs text-ryda-primary font-mono uppercase tracking-wider mb-0.5">
                              <Radio className="size-3" aria-hidden="true" />
                              {d.ward}
                            </div>
                            <div className="text-sm font-semibold text-ryda-text">
                              {d.name}
                            </div>
                            <div className="text-xs text-ryda-muted font-mono">
                              {d.vehicle}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-ryda-text">
                              <Navigation className="size-3 text-ryda-primary" aria-hidden="true" />
                              ETA {d.eta}
                            </div>
                          </div>
                        );
                      })()}
                  </>
                )}
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-1 pb-1 text-xs text-ryda-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block w-4 h-3 border rounded-sm"
                    style={{
                      borderColor: "var(--ryda-border)",
                      backgroundColor: "var(--ryda-surface)",
                    }}
                    aria-hidden="true"
                  />
                  <span>Bhopal GeoJSON boundary</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full bg-white ring-2 ring-ryda-primary"
                    aria-hidden="true"
                  />
                  <span>Active driver</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-ryda-yellow" aria-hidden="true" />
                  Pickup
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-ryda-primary" aria-hidden="true" />
                  Dropoff
                </span>
              </div>
            </div>

            {/* Live stats panel */}
            <div className="ryda-glass rounded-2xl p-5 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-ryda-text uppercase tracking-wider">
                  Live network
                </h3>
                <span className="inline-flex items-center gap-1.5 text-xs text-ryda-primary">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-ryda-primary opacity-75 animate-ping" />
                    <span className="relative inline-flex size-2 rounded-full bg-ryda-primary" />
                  </span>
                  Demo mode
                </span>
              </div>
              <p className="text-xs text-ryda-muted mb-4">
                Simulated telemetry — refreshes every 3.2 s.
              </p>

              <div className="flex-1">
                <StatRow
                  icon={Radio}
                  label="Drivers online"
                  value={
                    <AnimatedCounter to={stats.drivers} duration={0.8} />
                  }
                  accent
                />
                <StatRow
                  icon={Navigation}
                  label="Avg ETA"
                  value={`${stats.eta} min`}
                />
                <StatRow
                  icon={Zap}
                  label="Surge multiplier"
                  value={`${stats.surge}×`}
                />
                <StatRow
                  icon={Activity}
                  label="Active rides"
                  value={
                    <AnimatedCounter to={stats.active} duration={0.8} />
                  }
                />
              </div>

              <div className="mt-5 pt-4 border-t border-ryda-border">
                <div className="text-xs text-ryda-muted leading-relaxed">
                  Every marker is gated by{" "}
                  <code className="font-mono text-ryda-primary/90">
                    ST_Contains(bhopal_geom, point)
                  </code>
                  . Drivers outside the polygon cannot go online.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ----- Helpers ----- */

function computeBbox(ring: number[][]): [number, number, number, number] {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const pt of ring) {
    const lon = pt[0] ?? 0;
    const lat = pt[1] ?? 0;
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
  }
  return [minLon, minLat, maxLon, maxLat];
}
