/**
 * Tests for toFavoriteSong (Task 18) — the single factory that replaces five
 * hand-built FavoriteSong-shaped object literals scattered across
 * ShowDetailScreen, FullPlayer, and web/PlayerBar.
 */

import { toFavoriteSong } from '../favoriteSong';
import { Track, ShowDetail } from '../../types/show.types';

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'track-1.mp3',
    title: 'Dark Star',
    format: 'VBR MP3',
    streamUrl: 'https://archive.org/download/gd77-05-08/track-1.mp3',
    ...overrides,
  };
}

function makeShow(overrides: Partial<ShowDetail> = {}): ShowDetail {
  return {
    identifier: 'gd77-05-08.sbd.hicks',
    title: 'Grateful Dead Live at Barton Hall on 1977-05-08',
    date: '1977-05-08',
    year: '1977',
    venue: 'Cornell University',
    location: 'Ithaca, NY',
    tracks: [],
    ...overrides,
  };
}

describe('toFavoriteSong', () => {
  it('maps track + show fields into a FavoriteSong', () => {
    const track = makeTrack();
    const show = makeShow();

    expect(toFavoriteSong(track, show)).toEqual({
      trackId: 'track-1.mp3',
      trackTitle: 'Dark Star',
      showIdentifier: 'gd77-05-08.sbd.hicks',
      showDate: '1977-05-08',
      venue: 'Barton Hall',
      streamUrl: 'https://archive.org/download/gd77-05-08/track-1.mp3',
    });
  });

  it('derives venue via getVenueFromShow (title-derived venue wins over raw field)', () => {
    const track = makeTrack();
    const show = makeShow({ title: 'Grateful Dead Live at Barton Hall on 1977-05-08', venue: 'Some Other Venue' });

    expect(toFavoriteSong(track, show).venue).toBe('Barton Hall');
  });

  it('falls back to the raw venue field when the title has no parseable venue', () => {
    const track = makeTrack();
    const show = makeShow({ title: 'Untitled Show', venue: 'Winterland' });

    expect(toFavoriteSong(track, show).venue).toBe('Winterland');
  });

  it('falls back to "Unknown Venue" when neither title nor venue is available', () => {
    const track = makeTrack();
    const show = makeShow({ title: '', venue: undefined });

    expect(toFavoriteSong(track, show).venue).toBe('Unknown Venue');
  });

  it('uses the track id, title, and streamUrl as-is (no transformation)', () => {
    const track = makeTrack({ id: 't2', title: 'Truckin', streamUrl: 'https://example.com/t2.mp3' });
    const show = makeShow();

    const result = toFavoriteSong(track, show);
    expect(result.trackId).toBe('t2');
    expect(result.trackTitle).toBe('Truckin');
    expect(result.streamUrl).toBe('https://example.com/t2.mp3');
  });

  it('uses show.identifier and show.date as-is', () => {
    const track = makeTrack();
    const show = makeShow({ identifier: 'gd66-02-12.aud', date: '1966-02-12' });

    const result = toFavoriteSong(track, show);
    expect(result.showIdentifier).toBe('gd66-02-12.aud');
    expect(result.showDate).toBe('1966-02-12');
  });
});
