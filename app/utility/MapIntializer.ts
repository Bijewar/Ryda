// app/utils/MapInitializer.ts
declare global {
    interface Window {
      initGoMaps: () => void;
      GoMaps: any;
    }
  }
  
  export const initializeGoMaps = (apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.GoMaps) return resolve();
  
      window.initGoMaps = () => resolve();
  
      const script = document.createElement('script');
      script.src = `https://maps.gomaps.pro/v1/sdk?key=${apiKey}&callback=initGoMaps`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error('Failed to load GoMaps SDK'));
  
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(script, firstScript);
  
      // Fallback timeout
      setTimeout(() => {
        if (!window.GoMaps) {
          reject(new Error('GoMaps SDK loading timed out'));
        }
      }, 10000);
    });
  };