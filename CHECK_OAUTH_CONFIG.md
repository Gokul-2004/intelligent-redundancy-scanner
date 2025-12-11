# Check Your OAuth Configuration

## The Error You're Seeing

"ERR_FAILED" on id assertion endpoint usually means OAuth configuration issue.

## Quick Checks

### 1. OAuth Consent Screen
Go to: Google Cloud Console → APIs & Services → OAuth consent screen

**Must be configured:**
- ✅ User Type: External
- ✅ App name filled in
- ✅ Scopes added: `.../auth/drive.readonly` and `.../auth/drive.file`
- ✅ Test users: Your email added (if app is in Testing mode)

### 2. OAuth Client Settings
Go to: Google Cloud Console → APIs & Services → Credentials → Your OAuth client

**Check:**
- ✅ Application type: Web application
- ✅ Authorized JavaScript origins: `http://localhost:5173` (exact match, no trailing slash)
- ✅ Authorized redirect URIs: `http://localhost:5173` (exact match, no trailing slash)

### 3. Common Mistakes
- ❌ Using `https://localhost:5173` (should be `http://`)
- ❌ Trailing slash: `http://localhost:5173/` (should be no slash)
- ❌ Missing scopes in consent screen
- ❌ App in Testing mode but your email not in test users

## After Fixing

1. Save changes in Google Console
2. Wait 1-2 minutes for changes to propagate
3. Clear browser cache/cookies
4. Refresh the page
5. Try signing in again

## Still Not Working?

Share:
1. What you see in browser console (F12) - especially the error object details
2. Screenshot of your OAuth client settings (hide Client ID/Secret)

