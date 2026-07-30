import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Dimensions } from 'react-native';
import { RatingCard } from './RatingCard';
import { useRatingTrayState } from './useRatingTrayState';
import { pickRandomBackground } from '../../services/shareService';
import { ratingItemKey, type RatingTrayProps } from './ratingTrayTypes';

const MOBILE_WEB_MAX_WIDTH = 768;

/**
 * Web rating tray. Mirrors ShareTray.web's layout rules:
 *  - desktop & tablet (≥768px): centered panel
 *  - mobile web (<768px): slide-up bottom panel
 * Escape and backdrop click close it. Rendered once by
 * <RatingOverlayProvider>; open/close driven by the `item` prop.
 */
export function RatingTray({ item, onClose }: RatingTrayProps) {
  const { width } = Dimensions.get('window');
  const isMobileWeb = width < MOBILE_WEB_MAX_WIDTH;
  const { userStars, systemStars, handleSelect, handleReset } = useRatingTrayState(item);

  // One background roll per tray open, stable while the same item is shown.
  const bgIndex = useMemo(() => {
    return item ? pickRandomBackground() : 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingItemKey(item)]);

  // Escape key closes the panel (desktop convention).
  useEffect(() => {
    if (!item) return;
    if (typeof window === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <Pressable onPress={onClose} style={styles.backdrop}>
      <Pressable
        // Stop backdrop-click propagation so tapping inside the panel
        // doesn't close it.
        onPress={(e: any) => {
          if (e?.stopPropagation) e.stopPropagation();
        }}
        style={[styles.panel, isMobileWeb ? styles.panelMobile : styles.panelDesktop]}
        testID="rating-overlay"
      >
        <RatingCard
          item={item}
          bgIndex={bgIndex}
          systemStars={systemStars}
          userStars={userStars}
          onSelect={handleSelect}
          onReset={handleReset}
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  panel: {
    backgroundColor: '#1f1f1f',
    padding: 24,
  },
  panelDesktop: {
    width: 420,
    maxWidth: '90%',
    borderRadius: 24,
  },
  panelMobile: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
});
