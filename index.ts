import { registerRootComponent } from 'expo';
// Temporary: Commented out until we implement custom audio player
// import TrackPlayer from 'react-native-track-player';

import App from './App';
// import { PlaybackService } from './src/services/trackPlayerService';

// Register the playback service for handling remote events (lock screen, headphones, etc.)
// Temporary: Commented out until we implement custom audio player
// TrackPlayer.registerPlaybackService(() => PlaybackService);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
