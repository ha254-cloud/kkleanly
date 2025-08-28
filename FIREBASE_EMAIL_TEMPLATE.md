# Firebase Email Template Configuration (Copy-Paste Ready)

## In Firebase Console > Authentication > Templates > Password reset:

### **Sender Name:**
```
Kleanly Team
```

### **Subject:**
```
Your Kleanly Password Reset Request
```

### **Email Body (HTML):**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
  <div style="background-color: #2563eb; padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Kleanly</h1>
  </div>
  
  <div style="padding: 30px;">
    <h2 style="color: #333333; margin: 0 0 20px 0;">Password Reset Request</h2>
    
    <p style="color: #666666; font-size: 16px; line-height: 1.6;">
      Hello,
    </p>
    
    <p style="color: #666666; font-size: 16px; line-height: 1.6;">
      We received a request to reset your Kleanly account password for <strong>%EMAIL%</strong>.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="%LINK%" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #666666; font-size: 14px;">
      If the button doesn't work, copy and paste this link:
    </p>
    <p style="color: #2563eb; font-size: 14px; word-break: break-all;">
      %LINK%
    </p>
    
    <p style="color: #666666; font-size: 14px; margin-top: 30px;">
      <strong>This link expires in 1 hour for security.</strong>
    </p>
    
    <p style="color: #666666; font-size: 14px;">
      If you didn't request this, please ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
    
    <p style="color: #666666; font-size: 14px; text-align: center;">
      Best regards,<br>
      <strong>The Kleanly Team</strong>
    </p>
  </div>
</div>
```
