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

// Performance date: URL uses MM-DD-YY, data uses YYYY-MM-DD
const parsePerformanceDate = (slug: string) => {
  const [m, d, yy] = slug.split('-');
  const year = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};
const stringifyPerformanceDate = (date: string) => {
  const [y, m, d] = date.split('-');
  return `${m}-${d}-${y.slice(2)}`;
};

const songPerformancesRoute = {
  path: 'songs/:songTitle/:performanceDate?',
  parse: { songTitle: parseTrackSlug, performanceDate: parsePerformanceDate },
  stringify: { songTitle: stringifyTrackTitle, performanceDate: stringifyPerformanceDate },
};

// ShowDetail: /show/{date}/{track-title}
const sanitizeIdentifier = (id: string) => decodeURIComponent(id).replace(/[^a-zA-Z0-9._-]/g, '');

const showDetailRoute = {
  path: 'show/:identifier/:trackTitle?',
  parse: {
    identifier: sanitizeIdentifier,
    trackTitle: parseTrackSlug,
  },
  stringify: {
    identifier: (id: string) => identifierToDate[id] || id,
    trackTitle: stringifyTrackTitle,
  },
};

// Home (Shows) route: sort/filter state as query params
const homeParseConfig = {
  sort: (sort: string) => sort,
  years: (years: string) => years,
  series: (series: string) => decodeURIComponent(series),
};
const homeStringifyConfig = {
  sort: (sort: string) => sort,
  years: (years: string) => years,
  series: (series: string) => encodeURIComponent(series),
};

const prefixes = [typeof window !== 'undefined' ? window.location.origin : ''];

// Desktop: flat Stack navigator (no tab nesting)
export const desktopWebLinking: LinkingOptions<any> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  prefixes,
  config: {
    screens: {
      DiscoverLanding: 'discover',
      Home: {
        path: 'shows',
        parse: homeParseConfig,
        stringify: homeStringifyConfig,
      },
      SongList: 'songs',
      Favorites: 'favorites',
      SongPerformances: songPerformancesRoute,
      ShowDetail: showDetailRoute,
      PublicProfile: {
        path: 'profile/:username',
        parse: { username: (u: string) => decodeURIComponent(u) },
      },
      Settings: 'settings',
      PrivacyPolicy: 'privacy-policy',
      ResetPassword: 'reset-password',
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
              Home: {
                path: '',
                parse: homeParseConfig,
                stringify: homeStringifyConfig,
              },
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
                path: ':songTitle/:performanceDate?',
                parse: { songTitle: parseTrackSlug, performanceDate: parsePerformanceDate },
                stringify: { songTitle: stringifyTrackTitle, performanceDate: stringifyPerformanceDate },
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
      PublicProfile: {
        path: 'profile/:username',
        parse: { username: (u: string) => decodeURIComponent(u) },
      },
      Settings: 'settings',
      PrivacyPolicy: 'privacy-policy',
      ResetPassword: 'reset-password',
    },
  },
};
