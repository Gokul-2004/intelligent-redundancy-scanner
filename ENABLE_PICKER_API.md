# Enable Google Picker API - Quick Fix

## The Error
"This content is blocked. Contact the site owner to fix the issue."

This means the **Google Picker API** is not enabled in your Google Cloud project.

## Quick Fix (1 minute)

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Select your project** (the same one where you enabled Drive API)
3. **Go to APIs & Services** → **Library**
4. **Search for**: `Google Picker API`
5. **Click on it** → **Click "Enable"**
6. **Wait a few seconds** for it to enable

## That's It! ✅

Now refresh your app page and try selecting folders again. The Picker should work!

---

## Why This Happens

- **Google Drive API** = Access to read/write files
- **Google Picker API** = The UI component for selecting folders/files

They're separate APIs, so both need to be enabled.

---

## Verify It's Enabled

After enabling, you can check:
- Go to **APIs & Services** → **Enabled APIs & services**
- You should see both:
  - ✅ Google Drive API
  - ✅ Google Picker API

