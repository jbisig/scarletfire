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

const collectionDetailRoute = {
  path: 'profile/:username/collection/:slug',
  parse: {
    username: (u: string) => decodeURIComponent(u),
    slug: (s: string) => decodeURIComponent(s),
  },
  stringify: {
    username: (u: string) => encodeURIComponent(u),
    slug: (s: string) => encodeURIComponent(s),
  },
};

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
    // Seeds Home under any deep-linked screen so cold-loaded share links
    // (ShowDetail, CollectionDetail, PublicProfile) have a working back target.
    initialRouteName: 'Home',
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
      CollectionDetail: collectionDetailRoute,
      Settings: 'settings',
      PrivacyPolicy: 'privacy-policy',
      ResetPassword: 'reset-password',
    },
  },
};

// Mobile: tab navigator with nested stacks.
//
// Share-link URLs (/show/*, /profile/*, /profile/*/collection/*) must resolve
// to screens *inside* a tab stack so the bottom tab bar renders. To do that,
// DiscoverTab uses an empty path and owns those screens — its children's
// paths are matched directly against the root URL. /discover is kept alive by
// moving the path onto DiscoverLanding itself.
export const mobileWebLinking: LinkingOptions<any> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  prefixes,
  config: {
    initialRouteName: 'MainTabs',
    screens: {
      MainTabs: {
        path: '',
        initialRouteName: 'DiscoverTab',
        screens: {
          DiscoverTab: {
            path: '',
            initialRouteName: 'DiscoverLanding',
            screens: {
              DiscoverLanding: 'discover',
              ShowDetail: showDetailRoute,
              PublicProfile: {
                path: 'profile/:username',
                parse: { username: (u: string) => decodeURIComponent(u) },
              },
              CollectionDetail: collectionDetailRoute,
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
            },
          },
        },
      },
      Settings: 'settings',
      PrivacyPolicy: 'privacy-policy',
      ResetPassword: 'reset-password',
    },
  },
};
