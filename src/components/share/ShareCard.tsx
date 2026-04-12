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
  const formattedDate = formatDateMMDDYYYY(item.date);
  const title = item.kind === 'show' ? formattedDate : item.trackTitle;
  const tier = item.kind === 'show' ? item.tier : item.rating;

  return (
    <View style={styles.card}>
      <ImageBackground source={bgSource} style={styles.bg} imageStyle={styles.bgImage}>
        {/* Dark gradient overlay — bottom half fades from transparent to
            near-black so the white text has reliable contrast against any
            of the 6 background images. Matches the Figma card design. */}
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.55)', 'rgba(0, 0, 0, 0.9)']}
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
