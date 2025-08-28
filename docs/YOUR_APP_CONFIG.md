# 🔐 **Your Kleanly App Configuration**

## ✅ **Your SHA-1 Fingerprint Found!**

**Your Development SHA-1 Fingerprint:**
```
E8:CB:C0:05:7F:38:CC:F3:36:AE:D2:94:62:38:08:43:76:5D:34:54
```

---

## 🚀 **Google Cloud Console Setup (Use These Values)**

### **Step 1: Restrict Your API Key**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your API key to edit it
4. Under **Application restrictions**, select **Android apps**
5. Click **Add an item** and enter:

#### **For Development/Testing:**
```
Package name: host.exp.exponent
SHA-1: E8:CB:C0:05:7F:38:CC:F3:36:AE:D2:94:62:38:08:43:76:5D:34:54
```

#### **For Production (when you publish):**
```
Package name: com.kleanly.app
SHA-1: [Get from Google Play Console after upload]
```

### **Step 2: API Restrictions**
Under **API restrictions**, select **Restrict key** and choose:
- ✅ **Geocoding API**
- ✅ **Places API**
- ✅ **Maps SDK for Android** (if you add maps later)

---

## 📱 **Your Current App Details**

- **App Name**: bolt-expo-nativewind
- **Package Name (Development)**: host.exp.exponent
- **SHA-1 (Development)**: E8:CB:C0:05:7F:38:CC:F3:36:AE:D2:94:62:38:08:43:76:5D:34:54
- **Google API Key**: Already configured in your app ✅

---

## 🧪 **Test Your Location Service**

Your location service is now ready! Test it by:

1. **Run your app**:
```bash
npx expo start
```

2. **Navigate to any screen with the LocationPicker component**

3. **Tap "Detect My Location"** and grant permission

4. **Verify the address appears** in the input field

---

## ⚠️ **Important Next Steps**

1. **Apply the restrictions above** to secure your API key
2. **Monitor your API usage** in Google Cloud Console
3. **Test the location detection** on a real device
4. **For production**: Update package name and get new SHA-1

---

✅ **Your location system is now fully configured and ready to use!**
