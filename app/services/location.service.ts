// app/services/location.service.ts

import { LocationSuggestion } from '../types';

export const locationService = {
  search: async (query: string): Promise<LocationSuggestion[]> => {
    if (query.length < 3) return [];
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`
      );
      
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.map((item: any) => ({
        display: item.display_name,
        coords: [parseFloat(item.lat), parseFloat(item.lon)] as [number, number],
      }));
    } catch (error) {
      console.error('Location search error:', error);
      return [];
    }
  },

  reverseGeocode: async (coords: [number, number]): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.display_name || null;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return null;
    }
  }
};