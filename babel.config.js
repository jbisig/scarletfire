module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated v4+ moved the Babel plugin into react-native-worklets.
    // This plugin must always be LAST per the reanimated/worklets docs.
    plugins: ['react-native-worklets/plugin'],
  };
};
