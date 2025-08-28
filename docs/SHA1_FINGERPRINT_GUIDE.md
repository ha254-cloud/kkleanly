# 🔐 SHA-1 Fingerprint & Package Name Guide for Kleanly

## 📱 **Your App Information**

### **Package Name / Bundle ID:**
- **Android**: `host.exp.exponent` (for Expo Go) or your custom package name
- **iOS**: `host.exp.exponent` (for Expo Go) or your custom bundle ID
- **For production builds**: You'll set a custom package name in `app.json`

### **Current Expo Config:**
- **App Name**: bolt-expo-nativewind
- **Slug**: bolt-expo-nativewind
- **EAS Project ID**: a4fc020e-ae2d-4c88-847b-a44d84216f16

---

## 🛠️ **How to Get Your SHA-1 Fingerprint**

### **Method 1: For Development (Expo Go)**

If you're testing with **Expo Go**, you need the Expo Go app's SHA-1:

**For Android Expo Go:**
```
SHA1: A5:CE:37:1A:5F:71:C1:26:3E:4B:9A:8A:58:1C:1B:12:6C:7E:27:30
```

**For iOS Expo Go:**
No SHA-1 needed for iOS development.

---

### **Method 2: For Custom Development Build**

If you're using **EAS Build** or custom development build:

1. **Generate your keystore** (if you haven't):
```bash
eas credentials:configure
```

2. **Get the SHA-1**:
```bash
eas credentials:list
```

Or manually with keytool:
```bash
keytool -list -v -keystore path/to/your/keystore.jks -alias your-key-alias
```

---

### **Method 3: For Production Build**

For **Google Play Console** uploaded apps:

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to **Release** → **Setup** → **App Integrity**
4. Copy the **SHA-1 certificate fingerprint** from the **App signing** section

---

## 🔒 **Google Cloud Console Setup**

### **Step 1: Create API Key**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **API Key**

### **Step 2: Restrict API Key**
1. Click on your API key to edit
2. Under **Application restrictions**, select **Android apps**
3. Add your package name and SHA-1:

#### **For Development (Expo Go):**
```
Package name: host.exp.exponent
SHA-1: A5:CE:37:1A:5F:71:C1:26:3E:4B:9A:8A:58:1C:1B:12:6C:7E:27:30
```

#### **For Production:**
```
Package name: com.kleanly.app (or your custom package)
SHA-1: [Your production SHA-1 from Play Console]
```

### **Step 3: Enable APIs**
Enable these APIs for your project:
- ✅ **Geocoding API**
- ✅ **Places API**
- ✅ **Maps SDK for Android** (if using maps)

---

## 📝 **Quick Commands for SHA-1**

### **Windows (with Android Studio):**
```cmd
cd "C:\Users\%USERNAME%\.android"
keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### **macOS/Linux:**
```bash
cd ~/.android
keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### **Using OpenSSL (alternative):**
```bash
openssl sha1 -binary your-certificate.crt | openssl base64
```

---

## ⚠️ **Important Security Notes**

1. **Never commit API keys** to your repository
2. **Use environment variables** for sensitive data
3. **Restrict your API key** to specific apps and APIs
4. **Regenerate keys** if they're ever exposed
5. **Monitor API usage** in Google Cloud Console

---

## 🚀 **For Kleanly Production**

When you're ready to publish Kleanly:

1. **Update app.json** with your custom package name:
```json
{
  "expo": {
    "android": {
      "package": "com.kleanly.app"
    },
    "ios": {
      "bundleIdentifier": "com.kleanly.app"
    }
  }
}
```

2. **Build with EAS**:
```bash
eas build --platform android
```

3. **Get production SHA-1** from Play Console
4. **Update Google API key restrictions**

---

## 📞 **Need Help?**

If you're having trouble:
1. Check the [Expo Documentation](https://docs.expo.dev/)
2. Visit [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
3. Use the [Google Cloud Console Help](https://cloud.google.com/support)

---

✅ **Your API key is already configured in the app. Just follow the restriction steps above to secure it!**
