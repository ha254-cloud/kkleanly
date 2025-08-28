# 🔥 **Firebase Setup Guide for Kleanly**

## 🚀 **Step 1: Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: **`kleanly-laundry-app`**
4. Enable Google Analytics (recommended)
5. Choose your analytics account
6. Click **"Create project"**

---

## 📱 **Step 2: Add Your App to Firebase**

### **Add Android App:**
1. Click **"Add app"** → **Android** (🤖)
2. **Android package name**: `com.kleanly.app`
3. **App nickname**: `Kleanly Android`
4. **Debug signing certificate SHA-1**: `E8:CB:C0:05:7F:38:CC:F3:36:AE:D2:94:62:38:08:43:76:5D:34:54`
5. Click **"Register app"**
6. **Download** `google-services.json`

### **Add iOS App:**
1. Click **"Add app"** → **iOS** (🍎)
2. **iOS bundle ID**: `com.kleanly.app`
3. **App nickname**: `Kleanly iOS`
4. Click **"Register app"**
5. **Download** `GoogleService-Info.plist`

---

## ⚙️ **Step 3: Configure Firebase Services**

### **Authentication:**
1. Go to **Authentication** → **Sign-in method**
2. Enable these providers:
   - ✅ **Email/Password**
   - ✅ **Phone** (for SMS verification)
   - ✅ **Google** (optional)
3. Configure **Authorized domains** (add your domain)

### **Firestore Database:**
1. Go to **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select region: **nam5 (us-central)**
5. Click **"Done"**

### **Storage:**
1. Go to **Storage**
2. Click **"Get started"**
3. Choose **"Start in test mode"**
4. Select same region as Firestore
5. Click **"Done"**

---

## 🔑 **Step 4: Get Your Firebase Config**

1. Go to **Project Settings** (⚙️ gear icon)
2. Scroll down to **"Your apps"**
3. Click on your **web app** (if not created, add one)
4. Copy the **firebaseConfig** object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

---

## 📝 **Step 5: Update Your .env File**

Replace these values in your `.env` file:

```env
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

---

## 🛡️ **Step 6: Configure Security Rules**

### **Firestore Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Orders - users can read/write their own orders
    match /orders/{orderId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == resource.data.driverId);
    }
    
    // Services - public read, admin write
    match /services/{serviceId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### **Storage Security Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /orders/{orderId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📧 **Step 7: Configure Email Templates**

1. Go to **Authentication** → **Templates**
2. Customize these templates:
   - **Password reset**
   - **Email verification**
   - **Email address change**

---

## 🧪 **Step 8: Test Your Setup**

After configuration, test these features:
1. **User registration**
2. **User login**
3. **Password reset**
4. **Data storage**
5. **File uploads**

---

## 🚨 **Important Notes**

1. **Start with test mode** for development
2. **Update security rules** before production
3. **Enable billing** for production use
4. **Monitor usage** in Firebase console
5. **Set up backup** for Firestore data

---

## 📞 **Need Help?**

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Getting Started](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Auth Guide](https://firebase.google.com/docs/auth)

---

✅ **Once you complete these steps, come back and I'll configure the app integration!**
