import React from 'react';
import { View, Text, Image, StyleSheet, ImageBackground } from 'react-native';
import type { ShareItem } from '../../services/shareService';
import { formatDateMMDDYYYY } from '../../services/shareService';
import { StarRating } from '../StarRating';
import { getShareBackground, SHARE_LOGO } from './shareBackgrounds';

interface ShareCardProps {
  item: ShareItem;
  bgIndex: number;   // 1..6 (getShareBackground clamps out-of-range to bg-1)
}

/**
 * Square preview card shown in the share tray. Mirrors Figma 138:287 (song)
 * and 138:324 (show):
 *   - 1:1 aspect, rounded corners, dark #121212 background under the bg image
 *   - Scarlet Fire logo top-left
 *   - Info bottom-left: title / subtitle (venue) / meta row (date + stars)
 *
 * The server-rendered OG image (via @vercel/og, plan Task 20) reproduces
 * this layout for the chat unfurl preview. This component and that template
 * should stay visually in sync.
 *
 * The card sizes depend on which ShareItem kind is passed:
 *   - show: title = formatted date, meta row = stars only
 *   - song: title = track title, meta row = date + stars
 */
export function ShareCard({ item, bgIndex }: ShareCardProps) {
  const bgSource = getShareBackground(bgIndex);
  const formattedDate = formatDateMMDDYYYY(item.date);
  const title = item.kind === 'show' ? formattedDate : item.trackTitle;
  // Song cards use the track rating if present, falling back to the show tier.
  // Show cards use the show's classicTier directly.
  const tier = item.kind === 'show' ? item.tier : item.rating;

  return (
    <View style={styles.card}>
      <ImageBackground source={bgSource} style={styles.bg} imageStyle={styles.bgImage}>
        <View style={styles.content}>
          {/* Figma puts the logo top-left at ~15% of the card width; 56×62 is the
              intended native-render size at the ~350px tray width. */}
          <Image source={SHARE_LOGO} style={styles.logo} resizeMode="contain" />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.venue}
            </Text>
            <View style={styles.metaRow}>
              {item.kind === 'song' && (
                <Text style={styles.meta}>{formattedDate}</Text>
              )}
              {tier !== null && <StarRating tier={tier} size={14} />}
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#121212',
  },
  bg: {
    flex: 1,
  },
  bgImage: {
    borderRadius: 32,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logo: {
    width: 56,
    height: 62,
  },
  info: {
    gap: 4,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '500',
  },
  subtitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.9,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  meta: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.9,
  },
});
