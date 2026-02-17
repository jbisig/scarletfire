import React, { useState, useEffect } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Platform } from 'react-native';

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

  // On web, use a raw <img> for remote URLs to bypass RNW Image cross-origin issues
  const flatStyle = StyleSheet.flatten(style) || {};

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
