'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BHOPAL_POIS } from '@/lib/geo/pois';
import type { Point } from '@/types/ride';
import { Compass, Loader2, MapPin, Search, X } from 'lucide-react';
import * as React from 'react';

export interface PlacesAutocompleteProps {
  id: string;
  label: string;
  placeholder: string;
  iconColor?: string;
  value: string;
  point?: Point;
  onChange: (address: string, point: Point) => void;
  error?: string;
  showLocationButton?: boolean;
}

interface Suggestion {
  address: string;
  landmark?: string;
  point: { lat: number; lng: number };
}

export function PlacesAutocomplete({
  id,
  label,
  placeholder,
  iconColor = 'text-ryda-accent',
  value,
  point,
  onChange,
  error,
  showLocationButton = false,
}: PlacesAutocompleteProps): React.ReactElement {
  const [query, setQuery] = React.useState(value);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Sync external value changes
  React.useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside listener
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced fetch for suggestions
  React.useEffect(() => {
    if (!isOpen || query.trim().length < 2) {
      if (isOpen && query.trim().length === 0) {
        // Show default popular Bhopal spots on empty focus
        setSuggestions(
          BHOPAL_POIS.slice(0, 5).map((p) => ({
            address: `${p.name}, Bhopal, Madhya Pradesh`,
            landmark: p.name,
            point: { lat: p.lat, lng: p.lng },
          })),
        );
      }
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/geo/autocomplete?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setSuggestions(json.data);
          }
        }
      } catch (_e) {
        // Fallback silently to local POIs matching query
        const local = BHOPAL_POIS.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase()),
        ).map((p) => ({
          address: `${p.name}, Bhopal, Madhya Pradesh`,
          landmark: p.name,
          point: { lat: p.lat, lng: p.lng },
        }));
        setSuggestions(local);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleSelect = (item: Suggestion) => {
    setQuery(item.address);
    setIsOpen(false);
    onChange(item.address, item.point);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      // Default to Bhopal center if geolocation is unavailable
      const defaultPoint = { lat: 23.2419, lng: 77.4321 };
      setQuery('MP Nagar, Bhopal');
      onChange('MP Nagar, Bhopal', defaultPoint);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userPoint = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        };

        try {
          // Reverse geocode via Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userPoint.lat}&lon=${userPoint.lng}&zoom=18`,
          );
          if (res.ok) {
            const data = await res.json();
            const addr =
              data.display_name ?? `Current Location (${userPoint.lat}, ${userPoint.lng})`;
            setQuery(addr);
            onChange(addr, userPoint);
          } else {
            setQuery(`Location: ${userPoint.lat}, ${userPoint.lng}`);
            onChange(`Location: ${userPoint.lat}, ${userPoint.lng}`, userPoint);
          }
        } catch (_e) {
          setQuery('Current GPS Location (Bhopal)');
          onChange('Current GPS Location (Bhopal)', userPoint);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        // Fallback gracefully on permission denial
        const bhopalCenter = { lat: 23.2419, lng: 77.4321 };
        setQuery('MP Nagar, Bhopal (Center)');
        onChange('MP Nagar, Bhopal (Center)', bhopalCenter);
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  };

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-medium text-ryda-text">
          {label}
        </Label>
        {showLocationButton && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1 text-[11px] text-ryda-accent hover:underline disabled:opacity-50"
          >
            {isLocating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Compass className="h-3 w-3" />
            )}
            <span>Locate Me</span>
          </button>
        )}
      </div>

      <div className="relative">
        <MapPin
          className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${iconColor}`}
          aria-hidden="true"
        />
        <Input
          id={id}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-9 pr-8 text-sm"
          autoComplete="off"
          aria-invalid={!!error}
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange('', { lat: 0, lng: 0 });
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-ryda-border bg-ryda-elevated/95 p-1 shadow-2xl backdrop-blur-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-4 text-xs text-ryda-muted">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-ryda-accent" />
              Searching Bhopal locations…
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-3 text-center text-xs text-ryda-muted">
              No Bhopal locations found. Try searching a major landmark (e.g., MP Nagar, New
              Market).
            </div>
          ) : (
            <ul className="divide-y divide-ryda-border/30">
              {suggestions.map((item, idx) => (
                <li key={`${item.address}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left text-xs transition-colors hover:bg-ryda-accent/15"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ryda-accent" />
                    <div className="min-w-0 flex-1">
                      {item.landmark && (
                        <p className="font-semibold text-ryda-text">{item.landmark}</p>
                      )}
                      <p className="truncate text-ryda-muted">{item.address}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Popular Bhopal POI Quick Chips */}
      {!query && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-ryda-muted">Popular:</span>
          {BHOPAL_POIS.slice(0, 4).map((poi) => (
            <button
              key={poi.name}
              type="button"
              onClick={() =>
                handleSelect({
                  address: `${poi.name}, Bhopal`,
                  landmark: poi.name,
                  point: { lat: poi.lat, lng: poi.lng },
                })
              }
              className="rounded-full border border-ryda-border/60 bg-ryda-bg/40 px-2 py-0.5 text-[10px] text-ryda-muted transition-colors hover:border-ryda-accent/50 hover:text-ryda-accent"
            >
              {poi.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
