import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useAppState = (onForeground?: () => void, onBackground?: () => void) => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App has come to the foreground!');
        if (onForeground) {
          onForeground();
        }
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        console.log('📱 App has gone to the background!');
        if (onBackground) {
          onBackground();
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [onForeground, onBackground]);

  return appState.current;
};
