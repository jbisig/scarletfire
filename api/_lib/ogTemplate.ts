/**
 * Satori template for the share card, rendered server-side by @vercel/og
 * and returned as a 1200×1200 PNG by the /api/og/show/* and /api/og/song/*
 * endpoints.
 *
 * The layout mirrors src/components/share/ShareCard.tsx (the in-tray
 * preview) so the sender sees the same card image they're sharing. Keep
 * these two implementations visually in sync.
 *
 * This file is .ts (not .tsx) because Vercel's function builder compiles
 * .ts helpers in api/_lib/ but skips .tsx helpers — only endpoint files
 * may be .tsx. We use React.createElement directly instead of JSX to
 * stay in .ts territory.
 *
 * Satori constraints to remember:
 *  - Every element with children must have `display: 'flex'`
 *  - Only a subset of CSS is supported (no transforms, grid, animations)
 *  - Colors must be resolvable hex or rgba strings (no CSS variables)
 */
import React from 'react';
import { WEB_ORIGIN } from './constants.js';

export interface CardProps {
  title: string;
  subtitle: string;
  metaLine?: string;       // date — only present on song cards
  tier: 1 | 2 | 3 | null;  // classicTier → stars
  bgIndex: number;         // 1..6
}

const STAR_COLOR = '#E54C4F';
const TEXT_COLOR = '#FFFFFF';
const SUBTLE_TEXT_COLOR = 'rgba(255, 255, 255, 0.9)';
const CARD_BG_FALLBACK = '#121212';

function starsForTier(tier: 1 | 2 | 3 | null): number {
  if (tier === 1) return 3;
  if (tier === 2) return 2;
  if (tier === 3) return 1;
  return 0;
}

function starElement(key: number, size = 48) {
  // Inline SVG star — Satori supports SVG nodes natively.
  return React.createElement(
    'svg',
    {
      key,
      xmlns: 'http://www.w3.org/2000/svg',
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: STAR_COLOR,
    },
    React.createElement('polygon', {
      points: '12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26',
    })
  );
}

export function renderCard(props: CardProps) {
  const bgUrl = `${WEB_ORIGIN}/share/bg-${props.bgIndex}.png`;
  const logoUrl = `${WEB_ORIGIN}/share/logo.png`;
  const starCount = starsForTier(props.tier);

  const infoChildren: React.ReactElement[] = [
    // Title (formatted date for shows, track title for songs)
    React.createElement(
      'div',
      {
        key: 'title',
        style: {
          display: 'flex',
          fontSize: 64,
          fontFamily: 'FamiljenGrotesk',
          fontWeight: 500,
          color: TEXT_COLOR,
          lineHeight: 1.1,
        },
      },
      props.title
    ),
    // Subtitle (venue)
    React.createElement(
      'div',
      {
        key: 'subtitle',
        style: {
          display: 'flex',
          fontSize: 44,
          fontFamily: 'FamiljenGrotesk',
          fontWeight: 500,
          color: SUBTLE_TEXT_COLOR,
        },
      },
      props.subtitle
    ),
    // Meta row: optional date + optional stars
    React.createElement(
      'div',
      {
        key: 'meta',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        },
      },
      ...(props.metaLine
        ? [
            React.createElement(
              'span',
              {
                key: 'metaLine',
                style: {
                  fontSize: 44,
                  fontFamily: 'FamiljenGrotesk',
          fontWeight: 500,
                  color: SUBTLE_TEXT_COLOR,
                },
              },
              props.metaLine
            ),
          ]
        : []),
      ...(starCount > 0
        ? [
            React.createElement(
              'div',
              {
                key: 'stars',
                style: { display: 'flex', gap: 4 },
              },
              ...Array.from({ length: starCount }).map((_, i) => starElement(i))
            ),
          ]
        : [])
    ),
  ];

  return React.createElement(
    'div',
    {
      style: {
        width: 1200,
        height: 1200,
        display: 'flex',
        position: 'relative',
        backgroundColor: CARD_BG_FALLBACK,
      },
    },
    // Background image
    React.createElement('img', {
      key: 'bg',
      src: bgUrl,
      width: 1200,
      height: 1200,
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        objectFit: 'cover',
      },
    }),
    // Gradient overlay — matches the in-app ShareCard's LinearGradient
    React.createElement('div', {
      key: 'gradient',
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.75) 100%)',
      },
    }),
    // Logo top-left
    React.createElement('img', {
      key: 'logo',
      src: logoUrl,
      width: 186,
      height: 206,
      style: { position: 'absolute', top: 96, left: 96 },
    }),
    // Info block bottom-left
    React.createElement(
      'div',
      {
        key: 'info',
        style: {
          position: 'absolute',
          bottom: 96,
          left: 96,
          right: 96,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          color: TEXT_COLOR,
        },
      },
      ...infoChildren
    )
  );
}
