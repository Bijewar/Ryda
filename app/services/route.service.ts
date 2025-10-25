// app/services/route.service.ts

import { RouteGeometry } from '../types';

export const routeService = {
  getRoute: async (
    start: [number, number], 
    end: [number, number]
  ): Promise<RouteGeometry | null> => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
      );
      
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      const route = data.routes?.[0];
      
      if (!route) return null;

      return {
        coordinates: route.geometry?.coordinates?.map((coord: [number, number]) => 
          [coord[1], coord[0]] as [number, number]
        ) || [],
        distance: route.distance || 0,
        duration: route.duration || 0
      };
    } catch (error) {
      console.error('Route error:', error);
      return null;
    }
  }
};