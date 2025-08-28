# 📱 **Bundle ID Configuration for Kleanly**

## 🎯 **Your New Bundle IDs**

I've updated your app.json with proper bundle identifiers:

### **iOS Bundle Identifier:**
```
com.kleanly.app
```

### **Android Package Name:**
```
com.kleanly.app
```

---

## 📋 **Updated app.json Configuration**

Your app.json now includes:

```json
{
  "expo": {
    "name": "Kleanly",
    "slug": "kleanly-laundry-app",
    "ios": {
      "bundleIdentifier": "com.kleanly.app"
    },
    "android": {
      "package": "com.kleanly.app",
      "versionCode": 1
    }
  }
}
```

---

## 🔄 **What Changed**

✅ **App Name**: `bolt-expo-nativewind` → `Kleanly`
✅ **Slug**: `bolt-expo-nativewind` → `kleanly-laundry-app`
✅ **Scheme**: `myapp` → `kleanly`
✅ **iOS Bundle ID**: Added `com.kleanly.app`
✅ **Android Package**: Added `com.kleanly.app`

---

## 🔐 **Google API Key Configuration**

Now you need to update your Google Cloud Console with the new bundle ID:

### **For Production Builds:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your API key
4. Under **Application restrictions** → **Android apps**
5. Add a new entry:

```
Package name: com.kleanly.app
SHA-1: [You'll get this after building]
```

### **For Development (Keep Both):**

Keep your existing development configuration AND add the production one:

#### **Development (Expo Go):**
```
Package name: host.exp.exponent
SHA-1: E8:CB:C0:05:7F:38:CC:F3:36:AE:D2:94:62:38:08:43:76:5D:34:54
```

#### **Production (Custom Build):**
```
Package name: com.kleanly.app
SHA-1: [Get from EAS Build or Google Play Console]
```

---

## 🏗️ **Building with New Bundle ID**

### **Development Build:**
```bash
eas build --profile development --platform android
```

### **Production Build:**
```bash
eas build --profile production --platform android
```

### **iOS Build:**
```bash
eas build --profile production --platform ios
```

---

## 📱 **Getting Production SHA-1**

After building, you can get your production SHA-1:

### **Method 1: From EAS Build**
```bash
eas credentials:list
```

### **Method 2: From Google Play Console**
1. Upload your APK/AAB to Google Play Console
2. Go to **Release** → **Setup** → **App Integrity**
3. Copy the SHA-1 from **App signing** section

### **Method 3: From APK directly**
```bash
unzip -p your-app.apk META-INF/CERT.RSA | keytool -printcert | grep SHA1
```

---

## 🚀 **Next Steps**

1. **Build your app** with the new bundle ID:
   ```bash
   eas build --profile development
   ```

2. **Get the new SHA-1** fingerprint

3. **Update Google API key restrictions** with the new package name and SHA-1

4. **Test location services** with the new build

---

## ⚠️ **Important Notes**

- **Bundle IDs must be unique** across all apps in app stores
- **Cannot be changed** after publishing to stores
- **Must match** in Google Play Console and Apple App Store
- **Use reverse domain notation** (com.company.app)

---

## 🔧 **EAS Build Configuration**

Make sure you have `eas.json` configured:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

---

✅ **Your Bundle IDs are now properly configured for production deployment!**
