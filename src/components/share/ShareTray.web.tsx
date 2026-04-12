import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { ShareCard } from './ShareCard';
import { ShareButton } from './ShareButton';
import { pickRandomBackground } from '../../services/shareService';
import {
  shareToCopyLink,
  shareToWhatsApp,
  shareToMessages,
} from '../../services/shareDestinations.web';
import type { ShareTrayProps } from './ShareTray';
import type { ShareItem } from '../../services/shareService';

type DestinationArgs = { item: ShareItem; bgIndex: number };
type DestinationFn = (args: DestinationArgs) => Promise<void>;

const DESKTOP_MIN_WIDTH = 1024;
const MOBILE_WEB_MAX_WIDTH = 768;

/**
 * Web share tray: a portal-style modal dialog. Layout adapts by viewport:
 *  - desktop (≥1024px): centered modal, Copy link + WhatsApp only
 *  - tablet (768-1023px): centered modal, Copy link + WhatsApp
 *  - mobile web (<768px): slide-up bottom panel, Copy link + WhatsApp + Messages
 *
 * Instagram is hidden on web entirely — the web doesn't have a
 * share-to-stories API equivalent. Messages is hidden on desktop because
 * the sms: URL scheme is only meaningful on mobile browsers.
 *
 * Rendered once by <ShareSheetProvider>. Open/close driven by the `item`
 * prop: non-null → visible, null → not rendered.
 */
export function ShareTray({ item, onClose }: ShareTrayProps) {
  const { width } = Dimensions.get('window');
  const isDesktop = width >= DESKTOP_MIN_WIDTH;
  const isMobileWeb = width < MOBILE_WEB_MAX_WIDTH;

  // Pick a random bg per tray open. Memoized on the item identity so it stays
  // stable for the lifetime of one modal — matches the native tray's pattern.
  const bgIndex = useMemo(() => {
    return item ? pickRandomBackground() : 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.showId, item?.kind]);

  // Escape key closes the modal on web (convention on desktop).
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

  const headline = item.kind === 'song' ? 'Share this song' : 'Share this show';

  const handleDestination = (fn: DestinationFn) => async () => {
    try {
      await fn({ item, bgIndex });
    } finally {
      onClose();
    }
  };

  return (
    <Pressable onPress={onClose} style={styles.backdrop}>
      <Pressable
        // Stop backdrop-click propagation so tapping inside the panel
        // doesn't close the modal.
        onPress={(e: any) => {
          if (e?.stopPropagation) e.stopPropagation();
        }}
        style={[
          styles.panel,
          isDesktop ? styles.panelDesktop : styles.panelMobile,
        ]}
      >
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
          {isMobileWeb && (
            <ShareButton
              icon="chatbubble"
              label="Messages"
              bgColor="#3ddd57"
              onPress={handleDestination(shareToMessages)}
            />
          )}
        </View>
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
    gap: 16,
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
  cardWrap: {
    width: '100%',
  },
  headline: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    gap: 12,
  },
});
