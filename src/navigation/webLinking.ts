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

const songPerformancesRoute = {
  path: 'songs/:songTitle',
  parse: { songTitle: parseTrackSlug },
  stringify: { songTitle: stringifyTrackTitle },
};

// ShowDetail: /show/{date}/{track-title}
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

// ShowsTab ShowDetail: /shows/{date}/{track-title} (no "show/" prefix)
const showsTabDetailRoute = {
  path: 'shows/:identifier/:trackTitle?',
  parse: showDetailRoute.parse,
  stringify: showDetailRoute.stringify,
};

// SongsTab ShowDetail: /songs/{track-title}/{date}
const songsTabDetailRoute = {
  path: 'songs/:trackTitle/:identifier',
  parse: {
    trackTitle: parseTrackSlug,
  },
  stringify: {
    trackTitle: stringifyTrackTitle,
    identifier: (id: string) => identifierToDate[id] || id,
  },
};

const prefixes = [typeof window !== 'undefined' ? window.location.origin : ''];

// Desktop: flat Stack navigator (no tab nesting)
export const desktopWebLinking: LinkingOptions<any> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  prefixes,
  config: {
    screens: {
      DiscoverLanding: 'discover',
      Home: 'shows',
      SongList: 'songs',
      Favorites: 'favorites',
      SongPerformances: songPerformancesRoute,
      ShowDetail: showDetailRoute,
      Settings: 'settings',
      PrivacyPolicy: 'privacy-policy',
    },
  },
};

// Mobile: tab navigator with nested stacks
export const mobileWebLinking: LinkingOptions<any> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  prefixes,
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
              ShowDetail: {
                path: ':identifier/:trackTitle?',
                parse: showDetailRoute.parse,
                stringify: showDetailRoute.stringify,
              },
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
              ShowDetail: {
                path: ':trackTitle/:identifier',
                parse: songsTabDetailRoute.parse,
                stringify: songsTabDetailRoute.stringify,
              },
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
