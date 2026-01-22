export default {
  expo: {
    name: "Scarlet>fire",
    slug: "scarletfire",
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
      // These will be populated from EAS secrets or environment variables
      supabaseUrl: process.env.SUPABASE_URL || "https://fftvyuykqbixzupxzlmo.supabase.co",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdHZ5dXlrcWJpeHp1cHh6bG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjU5MjAsImV4cCI6MjA4NDI0MTkyMH0.bphD6T5CxMNWVT5D8_sy9Ti9IpDhBwYMvTa4dP8qawY",
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || "836998999272-i744r408o0aoqd7r63rfo9j4c2vl6kpr.apps.googleusercontent.com",
      googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID || "836998999272-7uijb9j3amrvgvg1g7o8p34pdo0olouk.apps.googleusercontent.com",
    }
  }
};
