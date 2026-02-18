import { LinkingOptions } from '@react-navigation/native';
import showsData from '../data/shows.json';

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Build static lookups from shows.json for clean URLs
const identifierToDate: Record<string, string> = {};
const identifierToDateVenue: Record<string, string> = {};

Object.values(showsData).forEach((yearShows: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  yearShows.forEach(show => {
    if (!show.date) return;
    const date = show.date.substring(0, 10);
    const venueSlug = show.venue ? `-${slugify(show.venue)}` : '';
    const dateVenueSlug = `${date}${venueSlug}`;

    if (show.primaryIdentifier) {
      identifierToDate[show.primaryIdentifier] = date;
      identifierToDateVenue[show.primaryIdentifier] = dateVenueSlug;
    }
  });
});

const parseTrackSlug = (slug: string) => decodeURIComponent(slug).replace(/-/g, ' ');
const stringifyTrackTitle = (title: string) => encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'));

// Default route for ShowDetail: /show/{date}/{track-title}
const showDetailRoute = {
  path: 'show/:identifier/:trackTitle?',
  parse: {
    trackTitle: parseTrackSlug,
  },
  stringify: {
    identifier: (id: string) => identifierToDate[id] || id,
    trackTitle: stringifyTrackTitle,
  },
};

// ShowsTab route: /{date}/{track-title} (no "show/" prefix)
const showsTabDetailRoute = {
  path: ':identifier/:trackTitle?',
  parse: showDetailRoute.parse,
  stringify: showDetailRoute.stringify,
};

// SongsTab route: /{track-title}/{date-venue}
// e.g. /songs/dark-star/1977-05-08-barton-hall
const songsTabDetailRoute = {
  path: ':trackTitle/:identifier',
  parse: {
    trackTitle: parseTrackSlug,
    // Extract date (YYYY-MM-DD) from slug like "1977-05-08-barton-hall"
    identifier: (slug: string) => slug.substring(0, 10),
  },
  stringify: {
    trackTitle: stringifyTrackTitle,
    identifier: (id: string) => identifierToDateVenue[id] || identifierToDate[id] || id,
  },
};

export const webLinking: LinkingOptions<any> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  prefixes: [typeof window !== 'undefined' ? window.location.origin : ''],
  config: {
    screens: {
      MainTabs: {
        path: '',
        screens: {
          DiscoverTab: {
            path: 'discover',
            screens: {
              DiscoverLanding: '',
              ShowDetail: showDetailRoute,
            },
          },
          ShowsTab: {
            path: 'shows',
            screens: {
              Home: '',
              ShowDetail: showsTabDetailRoute,
            },
          },
          SongsTab: {
            path: 'songs',
            screens: {
              SongList: '',
              SongPerformances: ':songTitle',
              ShowDetail: songsTabDetailRoute,
            },
          },
          FavoritesTab: {
            path: 'favorites',
            screens: {
              Favorites: '',
              ShowDetail: showDetailRoute,
            },
          },
        },
      },
      ShowDetail: showDetailRoute,
      Settings: 'settings',
      PrivacyPolicy: 'privacy-policy',
    },
  },
};
