# Fix: "Account does not exist in tenant" Error

## The Problem

You're getting: "Selected user account does not exist in tenant 'Microsoft Services'"

This happens when the Azure AD app is not configured to allow personal Microsoft accounts.

## Solution: Update App Registration

### Step 1: Go to Azure Portal
1. Go to https://portal.azure.com
2. Search for "Azure Active Directory" or "Microsoft Entra ID"
3. Click "App registrations"
4. Find your app (or create a new one)

### Step 2: Update Supported Account Types
1. Click on your app
2. Go to "Authentication" (left sidebar)
3. Under "Supported account types", select:
   - ✅ **"Accounts in any organizational directory and personal Microsoft accounts"**
   - This allows both work/school accounts AND personal Microsoft accounts (@outlook.com, @hotmail.com, etc.)

### Step 3: Update Redirect URI
1. Still in "Authentication"
2. Make sure you have a redirect URI:
   - Platform: **Single-page application (SPA)**
   - URI: `http://localhost:5173`
   - Click "Add" if not there

### Step 4: Save
Click "Save" at the top

## Alternative: Use "consumers" Authority

If you only want personal accounts, you can change the authority in `authConfig.js`:

```javascript
authority: 'https://login.microsoftonline.com/consumers',
```

But `common` is better as it supports both personal and work accounts.

## Verify

After updating:
1. Wait a minute for changes to propagate
2. Clear browser cache/cookies
3. Try signing in again

The app should now accept personal Microsoft accounts! 🎉

