import React from 'react';
import { View, Text, Image, StyleSheet, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import type { ShareItem } from '../../services/shareService';
import { getShareBackground, SHARE_LOGO } from './shareBackgrounds';

interface ShareCardProps {
  item: ShareItem;
  bgIndex: number;   // 1..6 (getShareBackground clamps out-of-range)
}

/**
 * Square preview card shown in the share tray. Mirrors Figma 138:287 (song)
 * and 138:324 (show):
 *  - 1:1 aspect, rounded corners, dark #121212 background under the bg image
 *  - Logo top-left
 *  - Info bottom-left: title / subtitle / meta row (date + stars)
 *
 * The server-rendered OG image (via @vercel/og, plan Task 20) reproduces
 * this layout for the chat unfurl preview. This component and that template
 * should stay visually in sync.
 */
export function ShareCard({ item, bgIndex }: ShareCardProps) {
  const bgSource = getShareBackground(bgIndex);
  const formattedDate = formatDate(item.date);

  const title = item.kind === 'show' ? formattedDate : item.trackTitle;
  const starCount = starsForTier(item.kind === 'show' ? item.tier : item.rating);

  return (
    <View style={styles.card}>
      <ImageBackground source={bgSource} style={styles.bg} imageStyle={styles.bgImage}>
        <View style={styles.content}>
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
              {starCount > 0 && (
                <View style={styles.stars}>
                  {Array.from({ length: starCount }).map((_, i) => (
                    <Ionicons
                      key={i}
                      name="star"
                      size={14}
                      color={COLORS.accent}
                      style={i > 0 ? styles.starSpaced : undefined}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${m}/${d}/${y}`;
}

/**
 * classicTier → number of stars:
 *   tier 1 (legendary) → 3 stars
 *   tier 2 (excellent) → 2 stars
 *   tier 3 (notable)   → 1 star
 *   null               → 0 stars (no row rendered)
 *
 * Matches the existing StarRating component's (4 - tier) formula.
 */
function starsForTier(tier: 1 | 2 | 3 | null): number {
  if (tier === 1) return 3;
  if (tier === 2) return 2;
  if (tier === 3) return 1;
  return 0;
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
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starSpaced: {
    marginLeft: 2,
  },
});
