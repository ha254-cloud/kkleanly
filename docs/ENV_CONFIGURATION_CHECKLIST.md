# 🔧 **Environment Configuration Checklist for Kleanly**

## ✅ **Already Configured**

### **API Credentials:**
- ✅ **CONSUMER_KEY**: `AAtYI3HyOjHMQpRMA1iJO6pgMQA8m249bHCr0lZzo0GbytVz`
- ✅ **CONSUMER_SECRET**: `VygTSQCPMxdTOG27ZYzm53OClo66tW2UcR4rvAePOWaeyvGcD73lrL2Geu5QI7is`

### **Google Services:**
- ✅ **GOOGLE_MAPS_API_KEY**: `AIzaSyBvOkBZa6m5w1RxQZq8QZq8QZq8QZq8QZq`
- ✅ **EXPO_PUBLIC_GOOGLE_API_KEY**: `AIzaSyBvOkBZa6m5w1RxQZq8QZq8QZq8QZq8QZq`

### **Application Config:**
- ✅ **APP_ENV**: `development`
- ✅ **API_BASE_URL**: `https://api.kleanly.co.ke`
- ✅ **SUPPORT_EMAIL**: `kleanlyspt@gmail.com`
- ✅ **SUPPORT_PHONE**: `+254700000000`

---

## ⚠️ **NEEDS TO BE CONFIGURED**

### **🔥 HIGH PRIORITY (Required for Core Features)**

#### **Firebase Configuration:**
```env
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

#### **M-Pesa Payment:**
```env
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey
```

#### **Security Keys:**
```env
ENCRYPTION_KEY=your_32_character_encryption_key_here
JWT_SECRET=your_jwt_secret_key_here
```

---

### **🟡 MEDIUM PRIORITY (For Enhanced Features)**

#### **Email Service:**
```env
EMAIL_SERVICE_API_KEY=your_email_service_api_key
EMAIL_SERVICE_DOMAIN=your_email_domain
```

#### **Push Notifications:**
```env
ONESIGNAL_APP_ID=your_onesignal_app_id
```

#### **WhatsApp Business:**
```env
WHATSAPP_BUSINESS_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

---

### **🟢 LOW PRIORITY (Optional Analytics)**

```env
GOOGLE_ANALYTICS_ID=your_google_analytics_id
MIXPANEL_TOKEN=your_mixpanel_token
```

---

## 🚀 **Quick Setup Guide**

### **Step 1: Firebase Setup**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Add an Android/iOS app
4. Copy the configuration values to your .env

### **Step 2: M-Pesa Setup**
1. Go to [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create an app for M-Pesa
3. Get your consumer key, secret, and passkey
4. Update the .env file

### **Step 3: Generate Security Keys**
```bash
# Generate encryption key (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **Step 4: Email Service (Optional)**
- Use SendGrid, Mailgun, or similar service
- Get API key and domain
- Update .env file

---

## ⚡ **What Works Right Now**

With your current configuration, these features are ready:

✅ **Location Detection** (Google API configured)
✅ **Basic App Structure**
✅ **UI Components**
✅ **Navigation**

---

## 🔒 **Security Reminder**

1. **Never commit .env to Git**
2. **Use different keys for development/production**
3. **Regularly rotate API keys**
4. **Keep your consumer key/secret secure**

---

## 📋 **Next Steps Priority**

1. **🔥 URGENT**: Set up Firebase (for authentication & database)
2. **🔥 URGENT**: Generate security keys
3. **🟡 IMPORTANT**: Configure M-Pesa (for payments)
4. **🟢 OPTIONAL**: Set up analytics and notifications

Your app will work for testing with the current configuration, but you'll need Firebase and security keys for full functionality!
