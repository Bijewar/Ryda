// utils/addressToCoordinates.js

export const addressToCoordinates = async (address, apiKey) => {
    const response = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}`);
  
    const data = await response.json();
  
    if (data.error) {
      throw new Error('Error fetching geocoding data from OpenRouteService');
    }
  
    const coordinates = data.features[0].geometry.coordinates;  // [lng, lat]
    return [coordinates[1], coordinates[0]];  // Return in [lat, lng] format
  };
  