// Centralized API configuration for mobile and desktop compatibility

// Detect environment more reliably
const isProduction = import.meta.env.MODE === 'production' || 
                    import.meta.env.PROD === true || 
                    window.location.hostname !== 'localhost';

// Get API base URL with multiple fallback strategies
export const getApiBaseUrl = (): string => {
  // 1. Check environment variable first
  if (import.meta.env.VITE_API_URL) {
    console.log('Using VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // 2. Production detection
  if (isProduction) {
    const productionUrl = '/api';
    console.log('Using production API URL:', productionUrl);
    return productionUrl;
  }

  // 3. Development fallback
  const developmentUrl = 'http://localhost:3001/api';
  console.log('Using development API URL:', developmentUrl);
  return developmentUrl;
};

// Get base URL for health checks (without /api suffix)
export const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api', '');
  }

  if (isProduction) {
    return '';
  }

  return 'http://localhost:3001';
};

// Detect mobile device
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Debug information
export const debugApiConfig = () => {
  console.log('=== API Configuration Debug ===');
  console.log('Environment Mode:', import.meta.env.MODE);
  console.log('Environment PROD:', import.meta.env.PROD);
  console.log('Window hostname:', window.location.hostname);
  console.log('Window origin:', window.location.origin);
  console.log('Is Production:', isProduction);
  console.log('Is Mobile Device:', isMobileDevice());
  console.log('User Agent:', navigator.userAgent);
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('Final API Base URL:', getApiBaseUrl());
  console.log('Final Base URL:', getBaseUrl());
  console.log('================================');
};

// Call debug on load in development
if (!isProduction) {
  debugApiConfig();
}
