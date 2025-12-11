import { PublicClientApplication } from '@azure/msal-browser';

// Azure AD app configuration
// You'll need to register an app at https://portal.azure.com
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
    // Use 'common' for personal + work accounts, or 'consumers' for personal only
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
    // Allow personal Microsoft accounts
    knownAuthorities: [],
  },
  cache: {
    cacheLocation: 'sessionStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    allowNativeBroker: false, // Disable native broker for better compatibility
  },
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest = {
  scopes: [
    'Files.Read',
    'Files.Read.All',
    'Sites.Read.All',
    'User.Read',
  ],
};

// Create the main myMSALObj instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
msalInstance.initialize().then(() => {
  console.log('MSAL initialized');
});

