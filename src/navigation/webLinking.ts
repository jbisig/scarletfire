import { LinkingOptions } from '@react-navigation/native';
import showsData from '../data/shows.json';

// Build static identifier → date lookup for clean URLs
const identifierToDate: Record<string, string> = {};

Object.values(showsData).forEach((yearShows: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  yearShows.forEach(show => {
    if (show.primaryIdentifier && show.date) {
      identifierToDate[show.primaryIdentifier] = show.date.substring(0, 10);
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

// SongsTab route: /{track-title}/{date}
// e.g. /songs/dark-star/1977-05-08
const songsTabDetailRoute = {
  path: ':trackTitle/:identifier',
  parse: {
    trackTitle: parseTrackSlug,
  },
  stringify: {
    trackTitle: stringifyTrackTitle,
    identifier: (id: string) => identifierToDate[id] || id,
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
              SongPerformances: {
                path: ':songTitle',
                parse: { songTitle: parseTrackSlug },
                stringify: { songTitle: stringifyTrackTitle },
              },
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
      // Root-level routes for desktop layout (flat stack, no tab nesting)
      DiscoverLanding: 'discover',
      Home: 'shows',
      SongList: 'songs',
      Favorites: 'favorites',
      SongPerformances: {
        path: 'songs/:songTitle',
        parse: { songTitle: parseTrackSlug },
        stringify: { songTitle: stringifyTrackTitle },
      },
      ShowDetail: showDetailRoute,
      Settings: 'settings',
      PrivacyPolicy: 'privacy-policy',
    },
  },
};
