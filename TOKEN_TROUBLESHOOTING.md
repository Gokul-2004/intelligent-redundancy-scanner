# Token Troubleshooting Guide

## Problem: Token Starts with "EwB"

If your token starts with `EwB`, it's an **encrypted token**, not a JWT access token.

### Why This Happens

Microsoft Graph Explorer sometimes shows encrypted tokens in the UI, but the actual JWT token is sent in HTTP requests.

### Solution: Get Token from Network Tab

1. **Open Graph Explorer**: https://developer.microsoft.com/en-us/graph/graph-explorer
2. **Open Developer Tools**: Press `F12` (or `Ctrl+Shift+I`)
3. **Go to Network Tab**
4. **Sign in** to Graph Explorer (if needed)
5. **Make a request**: Click "Run query" on any endpoint (e.g., `GET /me`)
6. **Find the request**: Look for `graph.microsoft.com` in Network tab
7. **Click the request** → Go to **Headers** tab
8. **Find Authorization header**: Look for `Authorization: Bearer eyJ...`
9. **Copy the token**: Everything after `Bearer ` (starts with `eyJ`)

### Visual Guide

```
Network Tab → graph.microsoft.com request → Headers → Authorization: Bearer [COPY THIS TOKEN]
```

## Verify Your Token

### Method 1: Check Format
- ✅ Starts with `eyJ`
- ✅ Has 2 dots (`.`) separating 3 parts
- ✅ Very long (1000+ characters)

### Method 2: Decode at jwt.ms
1. Go to https://jwt.ms
2. Paste your token
3. If it shows decoded JSON → ✅ Correct!
4. If it says "cannot be decoded" → ❌ Wrong token

## Alternative: Use MSAL (Future)

For production, we should implement proper OAuth flow using MSAL library. But for now, the Network tab method works.

## Still Having Issues?

1. Make sure you're copying from the **Authorization header**, not the UI
2. Make sure you copy the **entire token** (it's very long)
3. Check for extra spaces before/after
4. Try making a new request in Graph Explorer to get a fresh token

