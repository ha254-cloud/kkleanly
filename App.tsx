import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

export function App() {
  // Automatically import all files from the app directory for ExpoRouter
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
