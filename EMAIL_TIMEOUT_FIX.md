# Email Connection Timeout Fix - MediTracker

## Problem
The application was experiencing email sending failures with `ETIMEDOUT` (Connection timeout) errors when attempting to send emails via Gmail SMTP server.

**Error Log:**
```
ERROR [3ApC9P3LZ0] Connection timeout
ERROR Send Error: Connection timeout
error: Email sending error: Connection timeout
```

## Root Causes Identified

1. **Tight timeout settings** (10-15 seconds) - Too short for slower hosting environments like Render.io
2. **No connection pooling** - Each email required a fresh connection
3. **No retry mechanism** - Failed emails were never retried
4. **Inconsistent email configurations** - Three different implementations with varying configurations
5. **Network restrictions on Render.io** - Port 587/465 may be blocked or slow

## Solutions Implemented

### 1. **Increased Timeout Values** ✅
- Changed connection timeout: `10s → 30s`
- Changed greeting timeout: `10s → 30s`
- Changed socket timeout: `15s → 30s`

### 2. **Added Connection Pooling** ✅
```javascript
pool: {
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 4000,
    rateLimit: 14
}
```
This reuses connections instead of creating new ones for each email.

### 3. **Implemented Retry Logic** ✅
Added exponential backoff retry mechanism (1s, 2s, 4s delays):
- Automatically retries failed emails 3 times
- Waits between attempts to avoid network congestion

### 4. **Centralized Email Service** ✅
Updated sendotp.js and doctor.controllers.js to use the centralized EmailService.js with consistent configuration.

### 5. **Enhanced TLS Settings** ✅
```javascript
tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
}
```

## Environment Variables Setup

### Essential Gmail Configuration (.env)

```env
# Gmail SMTP Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM=noreply@meditracker.com
EMAIL_FROM_NAME=MediTracker
EMAIL_REPLY_TO=support@meditracker.com

# Increased Timeouts for Production (milliseconds)
EMAIL_CONNECTION_TIMEOUT=30000
EMAIL_GREETING_TIMEOUT=30000
EMAIL_SOCKET_TIMEOUT=30000

# Optional: Use Mock Mode for Testing
# EMAIL_MOCK=false
```

## Important: Gmail App Password Setup

**Do NOT use your regular Gmail password!** Google requires an App Password for SMTP:

### Steps to Generate Gmail App Password:

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** (left sidebar)
3. Enable **2-Step Verification** (if not already enabled)
4. Scroll down to **App passwords**
5. Select:
   - App: **Mail**
   - Device: **Windows Computer** (or your device type)
6. Google will generate a 16-character password
7. Copy this password to your `.env` file as `EMAIL_PASSWORD`

**Example:**
```
EMAIL_PASSWORD=vwxc qwer tyui oasd
```

## Alternative: Custom SMTP Server

If Gmail is blocked on your hosting provider, use a custom SMTP server:

```env
# Custom SMTP Configuration
EMAIL_USE_SMTP=true
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_REQUIRE_TLS=true
EMAIL_USER=your_email@provider.com
EMAIL_PASSWORD=your_password

# Timeouts (still recommended)
EMAIL_CONNECTION_TIMEOUT=30000
EMAIL_GREETING_TIMEOUT=30000
EMAIL_SOCKET_TIMEOUT=30000
```

## Production Checklist

- [ ] Gmail App Password configured (not regular password)
- [ ] Environment variables set on Render.io dashboard
- [ ] `EMAIL_MOCK=false` in production
- [ ] Timeouts increased to 30 seconds
- [ ] Monitor email logs for any remaining timeouts
- [ ] Set up email error alerts/notifications

## Testing the Fix

### 1. Local Testing
```bash
# Set EMAIL_MOCK=false in your .env
# Run the application and trigger an email event
npm start
```

### 2. Check Logs
Look for success messages:
```
📤 Sending email to: test@example.com
✅ Email sent in 2345ms
   Message ID: <xxx@gmail.com>
```

### 3. Verify on Render.io
- Check application logs for email sending status
- Look for the "Email sent" success message
- Monitor for any ETIMEDOUT errors

## Technical Changes Made

### Files Updated:

1. **[src/utils/sendotp.js](src/utils/sendotp.js)**
   - Migrated to use centralized EmailService
   - Added retry logic with exponential backoff
   - Improved error handling

2. **[src/services/notification/EmailService.js](src/services/notification/EmailService.js)**
   - Increased timeout values (10s → 30s)
   - Added connection pooling
   - Improved error messages and troubleshooting tips

3. **[src/controllers/doctor.controllers.js](src/controllers/doctor.controllers.js)**
   - Removed duplicate nodemailer transporter
   - Integrated with centralized EmailService
   - Added retry logic for OTP sending

## Troubleshooting

### Still Getting Timeouts?

**Option 1: Increase Timeouts Further**
```env
EMAIL_CONNECTION_TIMEOUT=60000  # 60 seconds
EMAIL_GREETING_TIMEOUT=60000
EMAIL_SOCKET_TIMEOUT=60000
```

**Option 2: Check Port Availability**
If Render.io blocks port 587, try port 465 (SSL):
```env
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_REQUIRE_TLS=false
```

**Option 3: Use Alternative Email Service**
- SendGrid
- Mailgun
- AWS SES
- Twilio SendGrid

### Check Gmail Account:
- [ ] 2-Step Verification enabled
- [ ] App Password generated and copied correctly
- [ ] Less secure apps blocked (if using regular password)
- [ ] Account not flagged for suspicious activity

### Check Network:
- [ ] Internet connection is stable
- [ ] No VPN/Proxy blocking SMTP ports
- [ ] Firewall allows outbound SMTP connections

## Monitoring & Logging

The application now logs:
- ✅ Successful emails with message ID and duration
- ⏱️ Retry attempts with backoff delays
- ❌ Final failures with error codes
- ℹ️ Connection test results on startup

Check logs with:
```bash
# On Render.io
# View live logs in Render dashboard
# Or download logs for analysis
```

## Next Steps

1. Deploy these changes to Render.io
2. Update `.env` variables with proper Gmail App Password
3. Monitor logs for first batch of emails
4. Verify successful email delivery
5. Set up email error alerts if needed

---

**Questions?** Check the error messages in the logs - they now include specific troubleshooting steps.
