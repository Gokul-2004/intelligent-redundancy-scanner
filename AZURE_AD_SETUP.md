# Azure AD App Registration - Quick Setup

## Step 1: Register App in Azure Portal

1. Go to https://portal.azure.com
2. Sign in with your Microsoft account
3. Search for "Azure Active Directory" or "Microsoft Entra ID"
4. Click "App registrations" → "New registration"

## Step 2: Configure App

- **Name**: `Redundancy Scanner` (or any name)
- **Supported account types**: 
  - ⚠️ **IMPORTANT**: Select **"Accounts in any organizational directory and personal Microsoft accounts"**
  - This allows both work/school accounts AND personal Microsoft accounts
  - If you only select organizational accounts, personal accounts won't work!
- **Redirect URI**: 
  - Platform: **Single-page application (SPA)**
  - URI: `http://localhost:5173` (for development)
  - Click "Add"

## Step 3: Get Client ID

1. After registration, you'll see the app overview
2. Copy the **Application (client) ID**
3. This is your `VITE_AZURE_CLIENT_ID`

## Step 4: Configure API Permissions

1. Go to "API permissions"
2. Click "Add a permission" → "Microsoft Graph" → "Delegated permissions"
3. Add these permissions:
   - `Files.Read`
   - `Files.Read.All`
   - `Sites.Read.All`
   - `User.Read`
4. Click "Add permissions"
5. **No admin consent needed** for delegated permissions (user grants their own)

## Step 5: Update Frontend Config

1. Create/update `frontend/.env`:
```env
VITE_AZURE_CLIENT_ID=your-client-id-here
VITE_REDIRECT_URI=http://localhost:5173
VITE_API_URL=http://localhost:8000
```

2. Restart frontend: `npm run dev`

## Troubleshooting

### Error: "Account does not exist in tenant"
- **Fix**: Go to Azure Portal → Your App → Authentication
- Make sure "Supported account types" is set to **"Accounts in any organizational directory and personal Microsoft accounts"**
- Save and wait 1-2 minutes for changes to propagate
- Clear browser cache and try again

### Still not working?
- Check that redirect URI matches exactly: `http://localhost:5173`
- Make sure you're using the correct Client ID
- Try signing out and signing back in

## That's It!

Now users can:
1. Click "Sign in with Microsoft"
2. Sign in with their account
3. Grant permissions
4. Start scanning automatically!

No more manual token copying! 🎉

