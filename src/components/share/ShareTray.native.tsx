import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { ShareCard } from './ShareCard';
import { ShareButton } from './ShareButton';
import { pickRandomBackground, type ShareItem } from '../../services/shareService';
import {
  shareToCopyLink,
  shareToWhatsApp,
  shareToInstagramStory,
  shareToMessages,
} from '../../services/shareDestinations.native';
import type { ShareTrayProps } from './ShareTray';

type DestinationArgs = { item: ShareItem; bgIndex: number };
type DestinationFn = (args: DestinationArgs) => void | Promise<void>;

/**
 * Native share tray — a bottom sheet that shows a preview card plus 4
 * destination buttons. Backed by @gorhom/bottom-sheet for gesture-driven
 * open/close. Rendered once by <ShareSheetProvider> near the app root;
 * open/close is controlled by passing a ShareItem or null via the `item` prop.
 *
 * A random background index is picked ONCE per tray open so the preview the
 * sender sees in the tray matches the unfurl image the recipient sees in
 * WhatsApp/iMessage (since the same bg query param is passed to the OG URL).
 */
export function ShareTray({ item, onClose }: ShareTrayProps) {
  const sheetRef = useRef<BottomSheet>(null);

  // Re-roll the background whenever a new item arrives (by showId + kind + trackId).
  // useMemo's dep array makes the roll stable for the lifetime of a single tray open.
  const bgIndex = useMemo(() => {
    return item ? pickRandomBackground() : 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    item?.showId,
    item?.kind,
    item?.kind === 'song' ? item.trackId : null,
  ]);

  // Drive the sheet open/closed from the `item` prop. The sheet owns its own
  // animated state; we just call expand/close imperatively when item changes.
  useEffect(() => {
    if (item) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [item]);

  if (!item) return null;

  const headline = item.kind === 'song' ? 'Share this song' : 'Share this show';

  const handleDestination = (fn: DestinationFn) => () => {
    // Kick off the destination handler but don't await it here — the tray
    // should close immediately so the user sees the OS share sheet / chat
    // app / toast without a lingering backdrop.
    void fn({ item, bgIndex });
    onClose();
  };

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
    />
  );

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={['80%']}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.cardWrap}>
          <ShareCard item={item} bgIndex={bgIndex} />
        </View>
        <Text style={styles.headline}>{headline}</Text>
        <View style={styles.buttons}>
          <ShareButton
            icon="link"
            label="Copy link"
            bgColor="#343434"
            onPress={handleDestination(shareToCopyLink)}
          />
          <ShareButton
            icon="logo-whatsapp"
            label="WhatsApp"
            bgColor="#25d366"
            onPress={handleDestination(shareToWhatsApp)}
          />
          <ShareButton
            icon="logo-instagram"
            label="Instagram"
            bgColor="#343434"
            onPress={handleDestination(shareToInstagramStory)}
          />
          <ShareButton
            icon="chatbubble"
            label="Messages"
            bgColor="#3ddd57"
            onPress={handleDestination(shareToMessages)}
          />
        </View>
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
  cardWrap: {
    width: '100%',
  },
  headline: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 24,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});
