export default ({ config }) => {
  return {
    ...config,
    expo: {
      name: "Scarlet>fire",
      slug: "scarletfire",
      owner: "scarlet-fire",
      version: "1.0.0",
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
        buildNumber: "1",
        infoPlist: {
          NSAppleMusicUsageDescription: "This app streams audio from the Internet Archive.",
          NSPhotoLibraryUsageDescription: "This app needs access to your photo library to set your profile picture.",
          NSCameraUsageDescription: "This app needs access to your camera to take a profile picture.",
          UIBackgroundModes: [
            "audio"
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
        versionCode: 1,
        permissions: [
          "android.permission.INTERNET",
          "android.permission.MODIFY_AUDIO_SETTINGS",
          "android.permission.RECORD_AUDIO"
        ],
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false
      },
      web: {
        favicon: "./assets/favicon.png",
        bundler: "metro"
      },
      plugins: [
        "expo-font",
        "expo-video",
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
