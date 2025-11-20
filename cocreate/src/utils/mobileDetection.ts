/**
 * Mobile Device Detection Utilities
 * Detects mobile devices and provides device-specific information
 */

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  platform: 'ios' | 'android' | 'desktop';
  screenWidth: number;
  screenHeight: number;
  touchSupported: boolean;
}

/**
 * Checks if the current device is a mobile device
 * Uses multiple detection methods for reliability
 */
export const isMobileDevice = (): boolean => {
  // Check 1: User agent string
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUA = mobileRegex.test(userAgent);

  // Check 2: Touch capability
  const hasTouchScreen = 
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;

  // Check 3: Screen width (mobile-first breakpoint)
  const isMobileWidth = window.innerWidth <= 768;

  // Check 4: Orientation API (mobile devices typically have this)
  const hasOrientationAPI = 'orientation' in window || 'onorientationchange' in window;

  // A device is considered mobile if:
  // - User agent indicates mobile AND has touch screen
  // OR
  // - Has touch screen AND small screen width AND orientation API
  return (isMobileUA && hasTouchScreen) || 
         (hasTouchScreen && isMobileWidth && hasOrientationAPI);
};

/**
 * Checks if the current device is a tablet
 */
export const isTabletDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Tablet-specific patterns
  const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet|PlayBook|Silk/i;
  const isTabletUA = tabletRegex.test(userAgent);
  
  // Screen size check (tablets typically 768-1024px)
  const screenWidth = window.innerWidth;
  const isTabletWidth = screenWidth >= 768 && screenWidth <= 1024;
  
  return isTabletUA || (isMobileDevice() && isTabletWidth);
};

/**
 * Gets detailed device information
 */
export const getDeviceInfo = (): DeviceInfo => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isMobile = isMobileDevice();
  const isTablet = isTabletDevice();
  
  // Determine platform
  let platform: 'ios' | 'android' | 'desktop' = 'desktop';
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    platform = 'ios';
  } else if (/Android/i.test(userAgent)) {
    platform = 'android';
  }
  
  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    platform,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    touchSupported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };
};

/**
 * Checks if the device is in landscape orientation
 */
export const isLandscape = (): boolean => {
  return window.innerWidth > window.innerHeight;
};

/**
 * Checks if the device is in portrait orientation
 */
export const isPortrait = (): boolean => {
  return window.innerHeight > window.innerWidth;
};

/**
 * Gets the safe area insets for iOS devices with notches
 */
export const getSafeAreaInsets = () => {
  // iOS safe area environment variables
  const safeAreaTop = getComputedStyle(document.documentElement)
    .getPropertyValue('--sat') || 
    getComputedStyle(document.documentElement)
    .getPropertyValue('env(safe-area-inset-top)') || '0px';
    
  const safeAreaBottom = getComputedStyle(document.documentElement)
    .getPropertyValue('--sab') || 
    getComputedStyle(document.documentElement)
    .getPropertyValue('env(safe-area-inset-bottom)') || '0px';
  
  return {
    top: parseInt(safeAreaTop) || 0,
    bottom: parseInt(safeAreaBottom) || 0,
  };
};
