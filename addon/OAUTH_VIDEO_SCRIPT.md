# OAuth Verification Video Script

**Duration**: 3-5 minutes  
**Format**: Screen recording with voiceover  
**Upload**: YouTube (unlisted)  
**Purpose**: Demonstrate OAuth flow and add-on functionality for Google verification

## Video Structure

### Introduction (0:00 - 0:30)
**Script:**
"Hi, I'm [YOUR NAME], and this is a demonstration of the OAuth consent flow and functionality for Intelligent Redundancy Scanner, a Google Workspace Add-on that helps users find duplicate files in their Google Drive."

**Visual:**
- Show Google Workspace Marketplace listing (if available)
- Or show the add-on in Google Drive

### Part 1: OAuth Consent Flow (0:30 - 2:00)

**Script:**
"First, let me demonstrate the OAuth consent flow. When a user first installs the add-on, they'll see Google's OAuth consent screen."

**Visual:**
1. Open Google Drive
2. Click "Add-ons" → "Get add-ons" (or show installation flow)
3. Search for "Intelligent Redundancy Scanner"
4. Click "Install"
5. Show OAuth consent screen appearing
6. Highlight the requested scopes:
   - "See and download all your Google Drive files" (drive.readonly)
   - "See, edit, create, and delete only the specific Google Drive files you use with this app" (drive.file)
7. Explain: "These scopes are necessary to scan files for duplicates. We only request read-only access to analyze file content."
8. Click "Allow" or "Continue"
9. Show successful authorization

**Key Points to Emphasize:**
- Clear explanation of why each scope is needed
- User has full control (can revoke access anytime)
- Only read-only access requested
- No sensitive scopes requested

### Part 2: Add-on Functionality (2:00 - 4:00)

**Script:**
"Now let me show you how the add-on works. After authorization, users can access the add-on from the Google Drive interface."

**Visual:**
1. Open Google Drive
2. Show add-on icon/sidebar
3. Click to open the add-on
4. Show the homepage card:
   - Title: "Intelligent Redundancy Scanner"
   - Description of features
   - "Select Folders to Scan" button
5. Demonstrate folder selection:
   - Select one or more folders in Drive
   - Show add-on detecting selected folders
   - Show "Scan Selected Folders" card appearing
6. Click "Start Scan"
7. Show scanning progress card:
   - "Scanning for Duplicates" message
   - Progress indicator
8. Wait for scan to complete (or show results if pre-recorded)
9. Show results card:
   - Summary statistics (total files, duplicate groups)
   - List of duplicate groups
   - File details for each group

**Key Points to Emphasize:**
- User controls which folders to scan
- Clear progress feedback
- Results are clearly displayed
- No automatic actions (read-only)

### Part 3: Data Handling (4:00 - 4:30)

**Script:**
"Let me explain how we handle user data. Our service uses a stateless architecture - we don't store any files or data. Files are processed temporarily in memory and immediately discarded after scanning."

**Visual:**
- Show backend code or architecture diagram (optional)
- Or simply state: "All processing happens in real-time, no data is stored"

**Key Points to Emphasize:**
- No data storage
- Temporary processing only
- Files discarded after scan
- Privacy-focused architecture

### Part 4: Revocation (4:30 - 5:00)

**Script:**
"Users can revoke access at any time through their Google Account settings."

**Visual:**
1. Go to Google Account settings
2. Navigate to "Security" → "Third-party apps with account access"
3. Find "Intelligent Redundancy Scanner"
4. Show "Remove access" option
5. Explain: "Users have full control and can revoke access instantly"

**Key Points to Emphasize:**
- User control
- Easy revocation
- No data retention after revocation

### Conclusion (5:00 - 5:30)

**Script:**
"In summary, Intelligent Redundancy Scanner:
- Requests only necessary, read-only scopes
- Provides clear OAuth consent information
- Gives users full control over their data
- Uses a privacy-focused, stateless architecture
- Allows easy access revocation

Thank you for reviewing our OAuth implementation. If you have any questions, please contact us at [YOUR_SUPPORT_EMAIL]."

**Visual:**
- Show contact information
- Show add-on logo or branding

## Production Tips

### Recording
- Use screen recording software (OBS, Loom, or QuickTime)
- Record in 1080p or higher
- Use a clear, professional voiceover
- Remove background noise
- Keep video under 5 minutes

### Editing
- Add text overlays for key points
- Highlight important UI elements
- Add smooth transitions
- Include captions if possible
- Add intro/outro graphics

### Upload
- Upload to YouTube as unlisted
- Set title: "OAuth Verification - Intelligent Redundancy Scanner"
- Add description with key points
- Copy the video URL for submission

## Checklist

Before recording:
- [ ] Test OAuth flow works smoothly
- [ ] Prepare demo folders with test files
- [ ] Ensure add-on is fully functional
- [ ] Write script and practice
- [ ] Set up screen recording software

During recording:
- [ ] Speak clearly and slowly
- [ ] Show all requested scopes clearly
- [ ] Demonstrate full functionality
- [ ] Explain data handling
- [ ] Show revocation process

After recording:
- [ ] Edit for clarity and professionalism
- [ ] Add captions or text overlays
- [ ] Upload to YouTube (unlisted)
- [ ] Test video playback
- [ ] Copy video URL for submission

## Common Mistakes to Avoid

- ❌ Don't rush through the OAuth screen
- ❌ Don't skip explaining scopes
- ❌ Don't forget to show revocation
- ❌ Don't make video too long (>5 minutes)
- ❌ Don't use poor audio quality
- ❌ Don't skip showing actual functionality

## Success Criteria

Your video should clearly demonstrate:
- ✅ OAuth consent screen with scopes
- ✅ Why each scope is needed
- ✅ Add-on functionality
- ✅ User control and data handling
- ✅ Easy access revocation

