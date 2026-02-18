import { LinkingOptions } from '@react-navigation/native';
import showsData from '../data/shows.json';

// Build static identifier → date lookup for clean URLs
// Primary identifiers map to dates; non-primary identifiers pass through as-is
const identifierToDate: Record<string, string> = {};
Object.values(showsData).forEach((yearShows: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  yearShows.forEach(show => {
    if (show.primaryIdentifier && show.date) {
      identifierToDate[show.primaryIdentifier] = show.date.substring(0, 10);
    }
  });
});

const showDetailRoute = {
  path: 'show/:identifier/:trackTitle?',
  parse: {
    trackTitle: (slug: string) => decodeURIComponent(slug).replace(/-/g, ' '),
  },
  stringify: {
    identifier: (id: string) => identifierToDate[id] || id,
    trackTitle: (title: string) => encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-')),
  },
};

const showsTabDetailRoute = {
  path: ':identifier/:trackTitle?',
  parse: showDetailRoute.parse,
  stringify: showDetailRoute.stringify,
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
              ShowDetail: showDetailRoute,
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
