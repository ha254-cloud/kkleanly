@@ .. @@
 // Connect to emulators in development
-if (__DEV__ || process.env.NODE_ENV === 'development') {
-  try {
-    // Connect Auth emulator
-    if (!auth._delegate._authCredentials) {
-      connectAuthEmulator(auth, 'http://localhost:9099');
-    }
-    
-    // Connect Firestore emulator
-    if (!db._delegate._settings?.host?.includes('localhost')) {
-      connectFirestoreEmulator(db, 'localhost', 8080);
-    }
-  } catch (error) {
-    console.log('Emulator connection already established or failed:', error);
-  }
-}