# Google Workspace Add-on Setup Guide

This directory contains the Google Workspace Add-on code for the Intelligent Redundancy Scanner.

## Architecture

- **Apps Script**: Handles UI (Card Service) and OAuth
- **FastAPI Backend**: Handles heavy computation (embeddings, similarity, file processing)

## Setup Instructions

### 1. Create Apps Script Project

1. Go to https://script.google.com
2. Click "New Project"
3. Name it: "Intelligent Redundancy Scanner Add-on"
4. Delete the default `Code.gs` content
5. Copy the contents of `Code.gs` from this directory
6. Copy the contents of `appsscript.json` to the project's manifest

### 2. Configure Manifest

1. In Apps Script editor, click the project settings icon (gear) on the left
2. Check "Show 'appsscript.json' manifest file in editor"
3. Replace the manifest with the contents from `appsscript.json`
4. Update `BACKEND_URL` in `Code.gs` with your deployed backend URL
5. Update `CLIENT_ID` with your Google Cloud OAuth client ID

### 3. Deploy as Add-on

1. Click "Deploy" → "New deployment"
2. Select type: "Add-on"
3. Fill in:
   - Description: "Find duplicate files in Google Drive using AI-powered content analysis"
   - Version: "1"
4. Click "Deploy"
5. Copy the deployment ID

### 4. Configure OAuth Consent Screen

1. Go to Google Cloud Console
2. APIs & Services → OAuth consent screen
3. Ensure scopes are added:
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/script.external_request`
4. Add test users (your email)
5. Submit for verification (if publishing)

### 5. Test the Add-on

1. In Google Drive, click the "Add-ons" menu
2. Select "Intelligent Redundancy Scanner"
3. Authorize the add-on
4. Select folders and click "Scan"

### 6. Submit to Marketplace

1. Go to Google Cloud Console
2. APIs & Services → Google Workspace Marketplace SDK
3. Enable the API
4. Create store listing:
   - App name, description, screenshots
   - Privacy policy URL
   - Terms of service URL
   - Support email
5. Submit for review

## Files

- `Code.gs`: Main Apps Script code with card builders
- `appsscript.json`: Add-on manifest with OAuth scopes and triggers
- `README.md`: This file

## Notes

- The add-on uses Card Service for UI (Google's native UI framework)
- OAuth is handled automatically by Apps Script
- Heavy computation is delegated to the FastAPI backend
- Results are stored temporarily in PropertiesService

## Troubleshooting

- **OAuth errors**: Check scopes in manifest and OAuth consent screen
- **Backend errors**: Verify BACKEND_URL is correct and backend is deployed
- **Card not showing**: Check trigger functions in manifest

