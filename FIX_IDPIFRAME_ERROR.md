# Fix: "idpiframe_initialization_failed" Error

## What This Error Means

This error means Google OAuth can't initialize the iframe for sign-in. Common causes:

1. **OAuth consent screen not configured** (most common)
2. **App in Testing mode** but your email not added as test user
3. **Redirect URI mismatch**

## Quick Fix

### Step 1: Configure OAuth Consent Screen

1. Go to: https://console.cloud.google.com
2. Select your project
3. Go to: **APIs & Services** → **OAuth consent screen**

4. **If not configured:**
   - Click "Configure Consent Screen"
   - User Type: **External** → Click "Create"
   - Fill in:
     - App name: `Redundancy Scanner`
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"

5. **Add Scopes:**
   - Click "Add or Remove Scopes"
   - Search: `drive.readonly` → Add it
   - Search: `drive.file` → Add it
   - Click "Update" → "Save and Continue"

6. **Add Test Users (if app is in Testing mode):**
   - Click "Add Users"
   - Add your email address
   - Click "Add" → "Save and Continue"

7. **Review and Submit:**
   - Review everything
   - Click "Back to Dashboard"

### Step 2: Verify OAuth Client

1. Go to: **APIs & Services** → **Credentials**
2. Click on your OAuth client
3. Check:
   - **Authorized JavaScript origins**: `http://localhost:5173` (exact, no trailing slash)
   - **Authorized redirect URIs**: `http://localhost:5173` (exact, no trailing slash)

### Step 3: Wait and Retry

1. Wait 1-2 minutes for changes to propagate
2. Clear browser cache/cookies (or use incognito)
3. Refresh the page
4. Try signing in again

## Still Not Working?

If app is in "Testing" mode:
- Make sure your email is in "Test users" list
- Or publish the app (but this requires verification for production)

For development, "Testing" mode is fine, just add yourself as a test user.

## Alternative: Use Popup Instead of Iframe

If iframe keeps failing, we can switch to popup-based sign-in (I can update the code if needed).

