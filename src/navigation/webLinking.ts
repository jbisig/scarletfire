import { LinkingOptions } from '@react-navigation/native';

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
              ShowDetail: 'show/:identifier',
            },
          },
          ShowsTab: {
            path: 'shows',
            screens: {
              Home: '',
              ShowDetail: ':identifier',
            },
          },
          SongsTab: {
            path: 'songs',
            screens: {
              SongList: '',
              SongPerformances: ':songTitle',
              ShowDetail: 'show/:identifier',
            },
          },
          FavoritesTab: {
            path: 'favorites',
            screens: {
              Favorites: '',
              ShowDetail: 'show/:identifier',
            },
          },
        },
      },
      ShowDetail: 'show/:identifier',
      Settings: 'settings',
      PrivacyPolicy: 'privacy-policy',
    },
  },
};
