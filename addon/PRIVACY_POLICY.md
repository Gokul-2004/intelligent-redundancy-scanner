# Privacy Policy for Intelligent Redundancy Scanner

**Last Updated:** [DATE]

## Introduction

Intelligent Redundancy Scanner ("we," "our," or "the Service") is a Google Workspace Add-on that helps users identify duplicate files in their Google Drive. This Privacy Policy explains how we collect, use, and protect your information.

## Information We Collect

### Google Drive Data
- **File Metadata**: We access file names, sizes, modification dates, and MIME types to identify duplicates.
- **File Content**: We temporarily download and analyze file content to compute hashes and extract text for similarity comparison.
- **Folder Structure**: We access folder IDs and names when you select specific folders to scan.

### Authentication Data
- **OAuth Tokens**: We use Google OAuth 2.0 tokens to access your Google Drive. These tokens are provided by Google and managed through Google's authentication system.

## How We Use Your Information

### Primary Purpose
- **Duplicate Detection**: We analyze your files to identify exact duplicates, near-duplicates, and superset/subset relationships.
- **Content Analysis**: We extract text from documents (PDF, DOCX, XLSX, PPTX) and generate embeddings for similarity comparison.
- **Results Display**: We present duplicate groups in the add-on interface for your review.

### What We Do NOT Do
- ❌ **We do NOT store your files** - All processing is done in-memory and files are not saved to our servers.
- ❌ **We do NOT share your data** - Your files and data are never shared with third parties.
- ❌ **We do NOT track you** - We do not use analytics, cookies, or tracking technologies.
- ❌ **We do NOT sell data** - We do not monetize your data in any way.

## Data Storage and Retention

### Stateless Architecture
- **No Persistent Storage**: Our service uses a stateless architecture. We do not maintain a database or store your files or scan results.
- **Temporary Processing**: Files are downloaded temporarily during scanning, processed in-memory, and immediately discarded.
- **No Retention**: Once a scan completes, all file data is removed from our servers. Results are only displayed in your add-on interface.

### Backend Processing
- Files are processed on our backend servers for computational efficiency (AI embeddings, similarity calculations).
- Processing occurs only during active scans initiated by you.
- All data is cleared immediately after processing completes.

## Data Security

### Security Measures
- **HTTPS Encryption**: All communication between the add-on and our servers uses HTTPS/TLS encryption.
- **OAuth 2.0**: We use Google's secure OAuth 2.0 protocol for authentication.
- **Token Security**: OAuth tokens are handled securely and never exposed in client-side code.
- **No Logging**: We do not log file contents or sensitive user data.

### Third-Party Services
- **Google APIs**: We use Google Drive API and Google Identity Services, which are subject to Google's privacy policies.
- **Hosting**: Our backend is hosted on [YOUR HOSTING PROVIDER], which maintains industry-standard security practices.

## Your Rights and Choices

### Access and Control
- **Revoke Access**: You can revoke the add-on's access to your Google Drive at any time through your Google Account settings.
- **Select Folders**: You choose which folders to scan - we only access folders you explicitly select.
- **No Scanning**: You are not required to use the service. Scanning only occurs when you initiate it.

### Data Deletion
- Since we do not store your data, there is no stored data to delete.
- Revoking access immediately stops all data processing.

## Children's Privacy

Our service is not intended for users under the age of 13. We do not knowingly collect information from children under 13.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by:
- Updating the "Last Updated" date at the top of this policy
- Posting a notice in the add-on interface for significant changes

## Compliance

### GDPR (European Users)
- We process data only with your explicit consent (OAuth authorization)
- You can withdraw consent at any time by revoking access
- We do not transfer data outside the EU without appropriate safeguards
- You have the right to access, rectify, or erase your data (though we don't store it)

### CCPA (California Users)
- We do not sell personal information
- We do not share personal information for business purposes
- You have the right to know what data is collected (see above)
- You have the right to delete data (we don't store it)

## Contact Us

If you have questions about this Privacy Policy or our data practices, please contact us:

- **Email**: [YOUR_SUPPORT_EMAIL]
- **Website**: [YOUR_WEBSITE_URL]

## Acknowledgment

By using Intelligent Redundancy Scanner, you acknowledge that you have read and understood this Privacy Policy and agree to the collection and use of information as described herein.

---

**Note**: This privacy policy template should be customized with your actual contact information, hosting provider details, and any additional services you use. It should be hosted on a publicly accessible URL for the Google Workspace Marketplace submission.

