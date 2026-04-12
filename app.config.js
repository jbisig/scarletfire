export default ({ config }) => {
  return {
    ...config,
    expo: {
      name: "Scarlet>fire",
      slug: "scarletfire",
      owner: "scarlet-fire",
      version: "1.2.6",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "dark",
      scheme: "scarletfire",
      newArchEnabled: true,
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#121212"
      },
      updates: {
        fallbackToCacheTimeout: 0
      },
      assetBundlePatterns: [
        "**/*"
      ],
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.scarletfire.app",
        buildNumber: "2",
        entitlements: {
          "com.apple.developer.applesignin": ["Default"]
        },
        // Universal links for the share feature — any https link matching
        // /show/* on www.scarletfire.app opens the native app directly if
        // installed, falling back to Safari / the web build otherwise.
        // Requires the corresponding apple-app-site-association file to be
        // served at /.well-known/apple-app-site-association AND a rebuild
        // (EAS) to apply the new entitlement.
        associatedDomains: [
          "applinks:www.scarletfire.app",
          "applinks:scarletfire.app"
        ],
        infoPlist: {
          NSAppleMusicUsageDescription: "This app streams audio from the Internet Archive.",
          NSPhotoLibraryUsageDescription: "This app needs access to your photo library to set your profile picture.",
          NSCameraUsageDescription: "This app needs access to your camera to take a profile picture.",
          UIBackgroundModes: [
            "audio"
          ],
          // Declare URL schemes we may query via Linking.canOpenURL from
          // the share destination handlers — iOS 9+ privacy requirement.
          LSApplicationQueriesSchemes: [
            "whatsapp",
            "sms",
            "instagram",
            "instagram-stories"
          ],
          CFBundleURLTypes: [
            {
              CFBundleURLSchemes: [
                "com.googleusercontent.apps.836998999272-7uijb9j3amrvgvg1g7o8p34pdo0olouk"
              ]
            }
          ]
        },
        config: {
          usesNonExemptEncryption: false
        }
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#1a1a1a"
        },
        package: "com.scarletfire.app",
        versionCode: 2,
        permissions: [
          "android.permission.INTERNET",
          "android.permission.MODIFY_AUDIO_SETTINGS",
          "android.permission.FOREGROUND_SERVICE",
          "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
          "android.permission.WAKE_LOCK"
        ],
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        // Android app link: any https://www.scarletfire.app/show/* URL tapped
        // on a device with the app installed opens the native app directly.
        // Requires /.well-known/assetlinks.json to be served AND Google's
        // crawler to verify the SHA256 fingerprint match — can take up to
        // 24h to propagate after deploy.
        intentFilters: [
          {
            action: "VIEW",
            autoVerify: true,
            data: [
              {
                scheme: "https",
                host: "www.scarletfire.app",
                pathPrefix: "/show"
              }
            ],
            category: ["BROWSABLE", "DEFAULT"]
          }
        ]
      },
      web: {
        favicon: "./assets/favicon.png",
        bundler: "metro",
        name: "Scarlet>Fire - Grateful Dead Archive",
        description: "Browse and stream 40+ years of Grateful Dead live shows",
        themeColor: "#121212",
        backgroundColor: "#121212",
      },
      plugins: [
        "expo-font",
        "expo-video",
        "expo-secure-store",
        "expo-apple-authentication",
        "@react-native-google-signin/google-signin",
        [
          "expo-image-picker",
          {
            photosPermission: "This app needs access to your photo library to set your profile picture.",
            cameraPermission: "This app needs access to your camera to take a profile picture."
          }
        ],
        "./plugins/audio-player/withAudioPlayerModule"
      ],
      extra: {
        eas: {
          projectId: "0848e85c-eef7-43c6-82da-02d89777edca"
        },
        // Populated from EAS secrets (production) or .env file (local development)
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
        googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
        googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
      }
    }
  };
};
