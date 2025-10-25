// This file handles API calls to OpenRouteService for routing, distance, and geocoding
export const fetchRoute = async (pickup, destination, apiKey) => {
    const pickupCoords = [pickup[0], pickup[1]];  // [lat, lng]
    const destinationCoords = [destination[0], destination[1]];
  
    const response = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: [pickupCoords, destinationCoords],
        options: { units: 'km' },
      }),
    });
  
    const data = await response.json();
    const routeCoordinates = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    return routeCoordinates;
  };
  
  export const fetchDistance = async (pickup, destination, apiKey) => {
    const response = await fetch('https://api.openrouteservice.org/v2/matrix/driving-car', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        origins: [pickup],
        destinations: [destination],
        metrics: ['distance', 'duration'],
        units: 'km',
      }),
    });
  
    const data = await response.json();
    return {
      distance: data.distances[0][0],
      duration: data.durations[0][0],
    };
  };
  
  export const geocodeAddress = async (address, apiKey) => {
    const response = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}`);
    const data = await response.json();
    const coordinates = data.features[0].geometry.coordinates;
    return [coordinates[1], coordinates[0]];  // [lat, lng]
  };
  