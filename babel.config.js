/**
 * Expo no longer ships a babel.config.js in new projects — Metro applies
 * babel-preset-expo on its own. Jest does not: it resolves Babel config from
 * the project root, and without this it fails to parse the Flow annotations in
 * React Native's own jest setup files.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
