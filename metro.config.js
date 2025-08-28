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

// Fix for react-native-maps on web
config.resolver.platforms = ['web', 'ios', 'android', 'native'];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    // Return a web-compatible mock or empty module
    return {
      filePath: path.resolve(__dirname, 'web-mocks/react-native-maps.js'),
      type: 'sourceFile'
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// module.exports = withNativeWind(config, {
//   input: './global.css',
//   configPath: './tailwind.config.js',
// });

module.exports = config;
