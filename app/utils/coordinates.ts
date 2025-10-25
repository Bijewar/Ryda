// app/utils/coordinates.ts

export const normalizeCoordinates = (coords: any): [number, number] | null => {
  if (!coords) return null;
  
  // Array format: [lat, lng]
  if (Array.isArray(coords) && coords.length === 2 && 
      typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    return coords as [number, number];
  }
  
  // Object format: { lat, lng }
  if (typeof coords === 'object' && 'lat' in coords && 'lng' in coords &&
      typeof coords.lat === 'number' && typeof coords.lng === 'number') {
    return [coords.lat, coords.lng];
  }
  
  console.warn("Invalid coordinate format:", coords);
  return null;
};

export const calculateDistance = (coord1: any, coord2: any): number => {
  const tuple1 = normalizeCoordinates(coord1);
  const tuple2 = normalizeCoordinates(coord2);
  
  if (!tuple1 || !tuple2) return 0;

  const [lat1, lon1] = tuple1;
  const [lat2, lon2] = tuple2;

  // Validate coordinate ranges
  if (Math.abs(lat1) > 90 || Math.abs(lat2) > 90 || 
      Math.abs(lon1) > 180 || Math.abs(lon2) > 180) {
    console.warn("Coordinates out of range");
    return 0;
  }

  // Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};