import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.wide) return 'wide';
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
}

// Stable constant for native — avoids creating new object on every call
const NATIVE_RESPONSIVE = {
  breakpoint: 'mobile' as Breakpoint,
  isMobile: true,
  isTablet: false,
  isDesktop: false,
  windowWidth: 0,
};

export function useResponsive() {
  const [windowWidth, setWindowWidth] = useState(
    Platform.OS === 'web' ? Dimensions.get('window').width : 0
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  // On native, always return stable constant
  if (Platform.OS !== 'web') {
    return NATIVE_RESPONSIVE;
  }

  const breakpoint = getBreakpoint(windowWidth);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop' || breakpoint === 'wide',
    windowWidth,
  };
}
