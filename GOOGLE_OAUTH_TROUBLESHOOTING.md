# Google OAuth Troubleshooting

## Common Errors & Fixes

### Error: "redirect_uri_mismatch"
**Fix**: 
- Go to Google Cloud Console → Credentials → Your OAuth client
- Make sure `http://localhost:5173` is in "Authorized redirect URIs"
- Save and wait 1-2 minutes

### Error: "access_denied" or "invalid_client"
**Fix**:
- Check that Client ID is correct (no spaces, full string)
- Make sure OAuth consent screen is configured
- Make sure Google Drive API is enabled

### Error: "OAuth consent screen not configured"
**Fix**:
1. Go to Google Cloud Console
2. APIs & Services → OAuth consent screen
3. Configure it (see GOOGLE_DRIVE_SETUP.md)
4. Then create OAuth client

### Error: "[object Object]"
**Check browser console (F12)** for actual error message

---

## Quick Checklist

- [ ] Google Drive API is enabled
- [ ] OAuth consent screen is configured
- [ ] OAuth client ID is created
- [ ] Redirect URI: `http://localhost:5173` is added
- [ ] Client ID is in `frontend/.env`
- [ ] Frontend restarted after adding `.env`

---

## Test Your Client ID

1. Open browser console (F12)
2. Type: `import.meta.env.VITE_GOOGLE_CLIENT_ID`
3. Should show your Client ID
4. If undefined, `.env` file not loaded - restart frontend

---

## Still Not Working?

Share the error from browser console (F12 → Console tab)

