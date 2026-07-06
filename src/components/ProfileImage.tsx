import React, { useState, useEffect } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Platform } from 'react-native';
import { webStyle } from '../utils/webStyle';

const DEFAULT_PROFILE = require('../../assets/images/logged-out-pfp.png');

interface ProfileImageProps {
  uri: string | null;
  style: StyleProp<ImageStyle>;
}

export function ProfileImage({ uri, style }: ProfileImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  const remoteUri = uri && !hasError ? uri : null;

  // No remote URI — show default profile using RN Image (handles bundled assets reliably)
  if (!remoteUri) {
    return <Image source={DEFAULT_PROFILE} style={style} />;
  }

  // On native, use RN Image for remote URLs too
  if (Platform.OS !== 'web') {
    return (
      <Image
        source={{ uri: remoteUri }}
        style={style}
        onError={() => setHasError(true)}
      />
    );
  }

  // On web, use a raw <img> for remote URLs to bypass RNW Image cross-origin issues.
  // The flattened RN style is fed into a DOM element's `style` (CSSProperties),
  // but RN's `ImageStyle` type allows values (OpaqueColorValue from
  // PlatformColor, AnimatedNode from Animated.Value) that don't structurally
  // match CSSProperties — those APIs are native-only and never actually
  // appear in a style object on web, so `webStyle` is the correct escape
  // hatch here, same as the RN-style-accepting-web-only-CSS case it's
  // documented for.
  const flatStyle = webStyle(StyleSheet.flatten(style) || {});

  return (
    // @ts-ignore — raw HTML img to bypass RNW Image issues with Google CDN
    <img
      src={remoteUri}
      referrerPolicy="no-referrer"
      style={{
        ...flatStyle,
        objectFit: 'cover',
        display: 'block',
      }}
      onError={() => setHasError(true)}
    />
  );
}
