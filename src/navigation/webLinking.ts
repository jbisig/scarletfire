import { LinkingOptions } from '@react-navigation/native';

const showDetailRoute = {
  path: 'show/:identifier/:trackTitle?',
  parse: {
    trackTitle: (slug: string) => decodeURIComponent(slug).replace(/-/g, ' '),
  },
  stringify: {
    trackTitle: (title: string) => encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-')),
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
