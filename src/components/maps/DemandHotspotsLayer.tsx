'use client';

import type { BhopalZoneData } from '@/types/reliability';
import * as React from 'react';
import { Marker } from 'react-map-gl/maplibre';

export interface DemandHotspotsLayerProps {
  zones: BhopalZoneData[];
  mode?: 'current' | 'prediction10m' | 'prediction30m' | 'repositioning';
}

export function DemandHotspotsLayer({
  zones,
  mode = 'current',
}: DemandHotspotsLayerProps): React.ReactElement {
  const getColor = (level: string) => {
    switch (level) {
      case 'VERY_HIGH':
        return {
          bg: 'bg-red-500/25 border-red-500/80 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]',
          dot: 'bg-red-500',
          badge: 'bg-red-500/20 text-red-300 border-red-500/40',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/25 border-orange-500/80 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.5)]',
          dot: 'bg-orange-500',
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-500/20 border-yellow-500/70 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]',
          dot: 'bg-yellow-400',
          badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
        };
      default:
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/60 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
          dot: 'bg-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
    }
  };

  return (
    <>
      {zones.map((zone) => {
        const level =
          mode === 'prediction10m'
            ? zone.predictedDemand10m
            : mode === 'prediction30m'
              ? zone.predictedDemand30m
              : mode === 'repositioning' && zone.driverShortage > 0
                ? 'VERY_HIGH'
                : zone.currentDemandLevel;

        const styling = getColor(level);

        return (
          <Marker
            key={zone.id}
            longitude={zone.centerLng}
            latitude={zone.centerLat}
            anchor="center"
          >
            <div className="relative flex flex-col items-center justify-center pointer-events-none">
              {/* Radar pulse aura */}
              <span
                className={`absolute h-24 w-24 rounded-full border animate-ping opacity-30 ${styling.bg}`}
                style={{ animationDuration: '3s' }}
              />
              <span className={`absolute h-16 w-16 rounded-full border ${styling.bg}`} />

              {/* Zone label badge */}
              <div
                className={`relative px-2 py-0.5 rounded-full border text-[10px] font-bold shadow-lg backdrop-blur-md whitespace-nowrap flex items-center gap-1 ${styling.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${styling.dot}`} />
                <span>{zone.name.split(' ')[0]}</span>
                {mode === 'repositioning' && zone.repositioningIncentive > 0 ? (
                  <span className="font-mono text-amber-300 ml-0.5">
                    +₹{(zone.repositioningIncentive / 100).toFixed(0)}
                  </span>
                ) : (
                  <span className="text-[9px] opacity-80 uppercase ml-0.5">{level}</span>
                )}
              </div>
            </div>
          </Marker>
        );
      })}
    </>
  );
}
