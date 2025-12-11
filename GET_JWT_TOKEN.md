# How to Get the Correct JWT Token from Graph Explorer

## The Problem

If your token starts with `EwB`, it's an **encrypted token**, not a JWT access token. We need a JWT token that starts with `eyJ`.

## Solution: Get Token from Browser Developer Tools

### Method 1: Get Token from Network Tab (Easiest)

1. **Open Graph Explorer**: https://developer.microsoft.com/en-us/graph/graph-explorer
2. **Open Browser Developer Tools**:
   - Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Go to **Network** tab
3. **Sign in** to Graph Explorer (if not already)
4. **Make a test request**:
   - In Graph Explorer, try: `GET /me`
   - Click "Run query"
5. **Find the request** in Network tab:
   - Look for a request to `graph.microsoft.com`
   - Click on it
   - Go to **Headers** tab
   - Look for `Authorization: Bearer ...`
   - Copy the token after `Bearer ` (this is your JWT token!)

### Method 2: Use MSAL to Get Token (Better for Production)

For now, let's use Method 1. But we can implement proper OAuth flow later.

## Verify Your Token

A valid JWT token:
- ✅ Starts with `eyJ`
- ✅ Has 2 dots: `eyJ...` `.` `...` `.` `...`
- ✅ Is very long (1000+ characters)
- ✅ Can be decoded at https://jwt.ms

An encrypted token (wrong):
- ❌ Starts with `EwB` or other letters
- ❌ No dots
- ❌ Cannot be decoded at jwt.ms

## Quick Test

1. Copy your token
2. Go to https://jwt.ms
3. Paste token
4. If it decodes → ✅ Good token!
5. If it says "cannot be decoded" → ❌ Wrong token, try Method 1 above

