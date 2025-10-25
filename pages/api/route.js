// pages/api/route.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { start, end } = req.body;

    // Validate input coordinates
    if (!start || !end || !Array.isArray(start) || !Array.isArray(end)) {
      return res.status(400).json({
        error: "Invalid coordinates. Provide start and end as [lat, lng] arrays.",
      });
    }

    if (start.length !== 2 || end.length !== 2) {
      return res.status(400).json({
        error: "Coordinates must be [latitude, longitude] arrays.",
      });
    }

    const [startLat, startLng] = start;
    const [endLat, endLng] = end;

    // Validate coordinate ranges
    if (
      Math.abs(startLat) > 90 ||
      Math.abs(endLat) > 90 ||
      Math.abs(startLng) > 180 ||
      Math.abs(endLng) > 180
    ) {
      return res.status(400).json({
        error:
          "Invalid coordinate values. Latitude must be -90 to 90, longitude -180 to 180.",
      });
    }

    console.log(
      `Calculating route from [${startLat}, ${startLng}] to [${endLat}, ${endLng}]`
    );

    try {
      // Try to get route from OSRM
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

      const response = await fetch(osrmUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "RydaApp/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`OSRM API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("OSRM response received");

      const route = data.routes?.[0];

      if (route && route.geometry && route.geometry.coordinates) {
        // Success - return actual route from OSRM
        const routeGeometry = {
          coordinates: route.geometry.coordinates.map((coord) => [
            coord[1],
            coord[0],
          ]), // Convert lng,lat to lat,lng
          distance: route.distance || 0,
          duration: route.duration || 0,
          source: "osrm",
          isFallback: false,
        };

        console.log(
          `Route calculated: ${(routeGeometry.distance / 1000).toFixed(
            1
          )}km, ${Math.round(routeGeometry.duration / 60)}min`
        );

        return res.status(200).json({
          success: true,
          route: routeGeometry,
        });
      } else {
        throw new Error("No valid route found in OSRM response");
      }
    } catch (error) {
      console.error("OSRM API error:", error.message);

      // Fallback to straight-line calculation
      console.log("Using fallback calculation...");

      const distance = calculateDistance(start, end) * 1000; // km → meters
      const duration = Math.max((distance / 1000) * 120, 300); // Assume 30 km/h, minimum 5 minutes

      const fallbackRoute = {
        coordinates: [start, end], // Simple straight line
        distance: distance,
        duration: duration,
        source: "fallback",
        isFallback: true,
      };

      console.log(
        `Fallback route: ${(fallbackRoute.distance / 1000).toFixed(
          1
        )}km, ${Math.round(fallbackRoute.duration / 60)}min`
      );

      return res.status(200).json({
        success: true,
        route: fallbackRoute,
        warning:
          "Using estimated straight-line distance due to routing service unavailability",
      });
    }
  } catch (error) {
    console.error("Route API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Helper function to calculate distance between two points
function calculateDistance(coord1, coord2) {
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;

  if (lat1 === lat2 && lon1 === lon2) {
    return 0; // Same location
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in kilometers
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
