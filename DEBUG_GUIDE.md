# Debugging Guide - Why No Files Found?

## Quick Test

### Test Your Token
Open this URL in your browser (replace YOUR_TOKEN):
```
http://localhost:8000/api/test-token?microsoft_token=YOUR_TOKEN
```

This will tell you:
- ✅ Can we access your account?
- ✅ Can we see your OneDrive?
- ✅ How many files are in root folder?
- ✅ What folders exist?

---

## Common Issues

### 1. Token Doesn't Have Files.Read Permission

**Symptom**: Test endpoint shows "Cannot access OneDrive"

**Fix**: 
- Go to Graph Explorer
- Make sure you request `Files.Read` permission
- Get a new token

### 2. Files Are in Subfolders

**Symptom**: Test shows folders but no files in root

**Fix**: The recursive scan should handle this, but check backend logs to see if folders are being scanned.

### 3. Token Expired

**Symptom**: 401 Unauthorized errors

**Fix**: Get a new token from Graph Explorer

---

## Check Backend Logs

Look at the terminal where backend is running. You should see:
```
Getting user's OneDrive...
Listing files from OneDrive...
  Scanning folder: root
    Found X items in folder
      File: filename.docx
      Folder: foldername (will scan)
```

If you don't see these messages, the scan isn't running properly.

---

## Manual Test

Try this curl command (replace YOUR_TOKEN):

```bash
curl "http://localhost:8000/api/test-token?microsoft_token=YOUR_TOKEN"
```

This will show you exactly what the API can see.

