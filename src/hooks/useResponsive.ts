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

export function useResponsive() {
  const [windowWidth, setWindowWidth] = useState(
    Dimensions.get('window').width
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleResize = () => {
      setWindowWidth(Dimensions.get('window').width);
    };

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  // On native, always return mobile
  if (Platform.OS !== 'web') {
    return {
      breakpoint: 'mobile' as Breakpoint,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      windowWidth,
    };
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
