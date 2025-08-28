// Lightweight polyfill for crypto.getRandomValues to satisfy libraries (uuid)
// NOT cryptographically secure. For secure randomness use 'expo-random' or 'react-native-get-random-values'.
if (typeof global !== 'undefined') {
  // @ts-ignore
  if (!global.crypto) {
    // @ts-ignore
    global.crypto = {};
  }
  // @ts-ignore
  if (typeof global.crypto.getRandomValues !== 'function') {
    // @ts-ignore
    global.crypto.getRandomValues = (buffer: Uint8Array) => {
      if (!(buffer instanceof Uint8Array)) {
        throw new TypeError('Expected Uint8Array');
      }
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
      return buffer;
    };
    console.warn('[polyfills/crypto] Applied non-secure getRandomValues fallback.');
  }
}
