# How to Get the Correct Microsoft Graph Token

## The Problem

Your token format is wrong. A valid JWT token should:
- Start with `eyJ` (base64 encoded JSON)
- Have **2 dots** separating 3 parts: `header.payload.signature`
- Look like: `eyJ0eXAiOiJKV1QiLCJhbGc...` (very long string)

## How to Get the Correct Token

### Step 1: Go to Graph Explorer
https://developer.microsoft.com/en-us/graph/graph-explorer

### Step 2: Sign In
- Click "Sign in" (top right)
- Sign in with your Microsoft account

### Step 3: Get Access Token
- Look for the **"Access token"** button/field
- It should show a token that starts with `eyJ`
- **Copy the entire token** (it's very long, make sure you get it all)

### Step 4: Verify Token Format
A valid token looks like:
```
eyJ0eXAiOiJKV1QiLCJub... (very long, has dots)
```

**NOT** like:
```
EwBIBMl6BAAUu4TQbLz... (no dots, encrypted format)
```

## Common Mistakes

1. **Copying encrypted token** - Make sure it's the "Access token", not an encrypted token
2. **Token cut off** - Make sure you copy the entire token (it's very long)
3. **Extra spaces** - Make sure there are no spaces before/after the token

## Test Your Token

Once you have the correct token, test it:
```
http://localhost:8000/api/test-token?microsoft_token=YOUR_TOKEN_HERE
```

If it works, you'll see:
```json
{
  "success": true,
  "user": "Your Name",
  "drive_id": "...",
  "root_files": 4,
  ...
}
```

## Still Having Issues?

1. Make sure you're signed into Graph Explorer
2. Try signing out and signing back in
3. Make sure you're copying from the "Access token" field, not elsewhere
4. Check that the token starts with `eyJ` and has dots

