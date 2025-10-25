// utils/calculateRoute.js

export const calculateRoute = async (pickup, destination, apiKey) => {
    const response = await fetch('https://api.openrouteservice.org/v2/matrix/driving-car', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        origins: [pickup],         // [lat, lng]
        destinations: [destination],  // [lat, lng]
        metrics: ['distance', 'duration'],  // Metrics to fetch (distance and duration)
        units: 'km',             // Units in kilometers
      }),
    });
  
    const data = await response.json();
  
    if (data.error) {
      throw new Error('Error fetching route data from OpenRouteService');
    }
  
    const distance = data.distances[0][0];  // distance between pickup and destination
    const duration = data.durations[0][0];  // duration between pickup and destination
  
    return { distance, duration }; // distance in km, duration in seconds
  };
  