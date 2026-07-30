import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { RatingCard } from './RatingCard';
import { useRatingTrayState } from './useRatingTrayState';
import { pickRandomBackground } from '../../services/shareService';
import { ratingItemKey, type RatingTrayProps } from './ratingTrayTypes';

/**
 * Native rating tray — a bottom sheet showing the rating card (same
 * image-background container as the share card, no logo), the 0–3 star
 * picker, and a fixed-height reset slot. Mirrors ShareTray.native:
 * gesture-driven via @gorhom/bottom-sheet, rendered once by
 * <RatingOverlayProvider>, open/close controlled by the `item` prop.
 */
export function RatingTray({ item, onClose }: RatingTrayProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const { userStars, systemStars, handleSelect, handleReset } = useRatingTrayState(item);

  // One background roll per tray open, stable while the same item is shown.
  const bgIndex = useMemo(() => {
    return item ? pickRandomBackground() : 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingItemKey(item)]);

  useEffect(() => {
    if (item) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [item]);

  if (!item) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={['62%']}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={(props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      )}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.container} testID="rating-overlay">
        <RatingCard
          item={item}
          bgIndex={bgIndex}
          systemStars={systemStars}
          userStars={userStars}
          onSelect={handleSelect}
          onReset={handleReset}
        />
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#1f1f1f',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  handle: {
    backgroundColor: '#b3b3b3',
    width: 54,
    height: 6,
  },
  container: {
    flex: 1,
    padding: 24,
  },
});
