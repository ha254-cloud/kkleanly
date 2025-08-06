const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
// Temporarily disable NativeWind to get the app running
// const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add path alias support
config.resolver.alias = {
  '@': path.resolve(__dirname, '.'),
  '@/components': path.resolve(__dirname, 'components'),
  '@/utils': path.resolve(__dirname, 'utils'),
  '@/constants': path.resolve(__dirname, 'constants'),
  '@/services': path.resolve(__dirname, 'services'),
  '@/context': path.resolve(__dirname, 'context'),
  '@/hooks': path.resolve(__dirname, 'hooks'),
};

// module.exports = withNativeWind(config, {
//   input: './global.css',
//   configPath: './tailwind.config.js',
// });

module.exports = config;
