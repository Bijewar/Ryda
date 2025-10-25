// app/utils/MapService.ts
const API_KEY = process.env.NEXT_PUBLIC_GOMAPS_API_KEY;

export const loadMapSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window object not available'));
      return;
    }

    if ((window as any).GoMaps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.gomaps.pro/v1/sdk?key=${API_KEY}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load GoMaps SDK'));
    document.head.appendChild(script);
  });
};

export const initializeMap = (container: HTMLElement, center: { lat: number; lng: number }) => {
  if (!(window as any).GoMaps) {
    throw new Error('GoMaps SDK not loaded');
  }

  return new (window as any).GoMaps.Map(container, {
    center,
    zoom: 13,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  });
};

export const addMarker = (map: any, position: { lat: number; lng: number }, color: string) => {
  return new (window as any).GoMaps.Marker({
    position,
    map,
    icon: {
      url: `https://maps.gomaps.pro/images/markers/marker-${color}.png`,
      scaledSize: new (window as any).GoMaps.Size(32, 32)
    }
  });
};

export const drawRoute = (map: any, path: Array<{ lat: number; lng: number }>) => {
  return new (window as any).GoMaps.Polyline({
    path,
    map,
    strokeColor: '#3B82F6',
    strokeWeight: 4
  });
};