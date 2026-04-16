import React from 'react';
import { View, Text, Image, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ShareItem } from '../../services/shareService';
import { formatDateMMDDYYYY } from '../../services/shareService';
import { StarRating } from '../StarRating';
import { FONTS } from '../../constants/theme';
import { getShareBackground, SHARE_LOGO } from './shareBackgrounds';

interface ShareCardProps {
  item: ShareItem;
  bgIndex: number;
}

export function ShareCard({ item, bgIndex }: ShareCardProps) {
  const bgSource = getShareBackground(bgIndex);

  let title: string;
  let subtitle: string;
  let metaDate: string | null = null;
  let tier: 1 | 2 | 3 | null = null;

  if (item.kind === 'profile') {
    title = `${item.displayName}'s Profile`;
    subtitle = `${item.showCount} shows · ${item.songCount} songs`;
  } else if (item.kind === 'collection') {
    const noun = item.type === 'playlist' ? 'tracks' : 'shows';
    title = item.name;
    subtitle = `${item.itemCount} ${noun} · by @${item.ownerUsername}`;
  } else {
    const formattedDate = formatDateMMDDYYYY(item.date);
    title = item.kind === 'show' ? formattedDate : item.trackTitle;
    subtitle = item.venue;
    tier = item.kind === 'show' ? item.tier : item.rating;
    if (item.kind === 'song') metaDate = formattedDate;
  }

  return (
    <View style={styles.card}>
      <ImageBackground source={bgSource} style={styles.bg} imageStyle={styles.bgImage}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.75)']}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        />
        <View style={styles.content}>
          <Image source={SHARE_LOGO} style={styles.logo} resizeMode="contain" />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
            <View style={styles.metaRow}>
              {metaDate && (
                <Text style={styles.meta}>{metaDate}</Text>
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
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
    fontFamily: FONTS.primary,
    fontWeight: '500',
  },
  subtitle: {
    color: '#fff',
    fontSize: 15,
    fontFamily: FONTS.primary,
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
    fontFamily: FONTS.primary,
    fontWeight: '500',
    opacity: 0.9,
  },
});
