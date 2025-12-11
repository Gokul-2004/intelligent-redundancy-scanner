/**
 * Google Workspace Add-on for Intelligent Redundancy Scanner
 * Main entry points and card building functions
 */

// Configuration - Update with your backend URL
const BACKEND_URL = 'https://your-backend-url.com'; // Update after deployment
const CLIENT_ID = 'YOUR_CLIENT_ID'; // From Google Cloud Console

/**
 * Called when add-on is opened from Drive homepage
 */
function onDriveHomepage(e) {
  return createHomepageCard();
}

/**
 * Called when user selects items in Drive
 */
function onDriveItemsSelected(e) {
  const selectedItems = e.drive.selectedItems;
  
  if (selectedItems.length === 0) {
    return createHomepageCard();
  }
  
  // If folders are selected, show scan option
  const folders = selectedItems.filter(item => item.mimeType === 'application/vnd.google-apps.folder');
  
  if (folders.length > 0) {
    return createScanCard(folders);
  }
  
  return createHomepageCard();
}

/**
 * Called when add-on is opened from universal homepage
 */
function onHomepage(e) {
  return createHomepageCard();
}

/**
 * Creates the main homepage card
 */
function createHomepageCard() {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Intelligent Redundancy Scanner')
      .setSubtitle('Find duplicate files in your Google Drive')
      .setImageUrl('https://www.gstatic.com/images/icons/material/system/1x/folder_googblue_48dp.png')
      .setImageStyle(CardService.ImageStyle.CIRCLE))
    .addSection(CardService.newCardSection()
      .setHeader('Quick Start')
      .addWidget(CardService.newTextParagraph()
        .setText('Select folders in Google Drive, then click "Scan Selected Folders" to find duplicates.'))
      .addWidget(CardService.newButtonSet()
        .addButton(CardService.newTextButton()
          .setText('📁 Select Folders to Scan')
          .setOnClickAction(CardService.newAction()
            .setFunctionName('showFolderPicker'))))
      .addWidget(CardService.newTextParagraph()
        .setText('Or scan all files in your Drive:'))
      .addWidget(CardService.newButtonSet()
        .addButton(CardService.newTextButton()
          .setText('🚀 Scan All Files')
          .setOnClickAction(CardService.newAction()
            .setFunctionName('startFullScan')))))
    .addSection(CardService.newCardSection()
      .setHeader('How It Works')
      .addWidget(CardService.newTextParagraph()
        .setText('• <b>Exact Duplicates:</b> Files with identical content (SHA-256 hash)'))
      .addWidget(CardService.newTextParagraph()
        .setText('• <b>Near Duplicates:</b> Files with similar content (AI-powered similarity)'))
      .addWidget(CardService.newTextParagraph()
        .setText('• <b>Superset/Subset:</b> Smaller files contained in larger, newer files')))
    .build();
    
  return [card];
}

/**
 * Creates a card for scanning selected folders
 */
function createScanCard(folders) {
  const folderNames = folders.map(f => f.title).join(', ');
  const folderIds = folders.map(f => f.id);
  
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Scan Selected Folders')
      .setSubtitle(`${folders.length} folder(s) selected`))
    .addSection(CardService.newCardSection()
      .setHeader('Selected Folders')
      .addWidget(CardService.newTextParagraph()
        .setText(`<b>${folderNames}</b>`))
      .addWidget(CardService.newDecoratedText()
        .setText('Include subfolders')
        .setSwitchControl(CardService.newSwitch()
          .setFieldName('includeSubfolders')
          .setValue(true)
          .setOnChangeAction(CardService.newAction()
            .setFunctionName('toggleSubfolders'))))
      .addWidget(CardService.newButtonSet()
        .addButton(CardService.newTextButton()
          .setText('🚀 Start Scan')
          .setOnClickAction(CardService.newAction()
            .setFunctionName('startScan')
            .setParameters({
              folderIds: JSON.stringify(folderIds)
            })))))
    .build();
    
  return [card];
}

/**
 * Shows folder picker (opens Drive file picker)
 */
function showFolderPicker() {
  // This will trigger the folder selection in Drive
  // The onDriveItemsSelected will be called when folders are selected
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setText('Please select folders in Google Drive, then open this add-on again.'))
    .build();
}

/**
 * Starts scanning selected folders
 */
function startScan(e) {
  const folderIds = JSON.parse(e.parameters.folderIds || '[]');
  const includeSubfolders = e.formInputs?.includeSubfolders === 'true' || true;
  
  // Get OAuth token
  const token = getOAuthToken();
  
  if (!token) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('Error: Could not get access token. Please authorize the add-on.'))
      .build();
  }
  
  // Show scanning card
  return createScanningCard(folderIds, includeSubfolders, token);
}

/**
 * Starts full scan of all files
 */
function startFullScan() {
  const token = getOAuthToken();
  
  if (!token) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('Error: Could not get access token. Please authorize the add-on.'))
      .build();
  }
  
  // Show scanning card with empty folderIds (scans all)
  return createScanningCard([], true, token);
}

/**
 * Creates a card showing scan progress
 */
function createScanningCard(folderIds, includeSubfolders, token) {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Scanning for Duplicates'))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText('🔍 Analyzing files... This may take a few minutes.'))
      .addWidget(CardService.newProgressIndicator()
        .setType(CardService.ProgressIndicatorType.SPINNER)))
    .build();
  
  // Start scan in background
  scanFilesAsync(folderIds, includeSubfolders, token);
  
  return [card];
}

/**
 * Asynchronously scans files and updates UI
 * Note: Apps Script doesn't support true async, so we use a polling approach
 */
function scanFilesAsync(folderIds, includeSubfolders, token) {
  try {
    // Call backend API
    const response = UrlFetchApp.fetch(`${BACKEND_URL}/api/scan`, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        google_token: token,
        folder_ids: folderIds,
        include_subfolders: includeSubfolders
      }),
      headers: {
        'Authorization': `Bearer ${token}`
      },
      muteHttpExceptions: true // Don't throw on HTTP errors
    });
    
    const statusCode = response.getResponseCode();
    
    if (statusCode !== 200) {
      const errorText = response.getContentText();
      throw new Error(`Backend error (${statusCode}): ${errorText}`);
    }
    
    const results = JSON.parse(response.getContentText());
    
    // Store results in PropertiesService for retrieval
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty('lastScanResults', JSON.stringify(results));
    scriptProperties.setProperty('scanComplete', 'true');
    scriptProperties.setProperty('scanTimestamp', new Date().toISOString());
    
  } catch (error) {
    Logger.log('Scan error: ' + error.toString());
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty('scanError', error.toString());
    scriptProperties.setProperty('scanComplete', 'true');
  }
}

/**
 * Polls for scan completion and updates UI
 * Called periodically to check scan status
 */
function checkScanStatus() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const scanComplete = scriptProperties.getProperty('scanComplete');
  
  if (scanComplete === 'true') {
    return createResultsCard();
  }
  
  // Still scanning, return progress card
  return createScanningCard([], true, getOAuthToken());
}

/**
 * Creates results card showing duplicate groups
 */
function createResultsCard() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const resultsJson = scriptProperties.getProperty('lastScanResults');
  const scanComplete = scriptProperties.getProperty('scanComplete');
  const error = scriptProperties.getProperty('scanError');
  
  if (!scanComplete || scanComplete !== 'true') {
    // Still scanning - show progress with refresh button
    const card = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader()
        .setTitle('Scanning for Duplicates'))
      .addSection(CardService.newCardSection()
        .addWidget(CardService.newTextParagraph()
          .setText('🔍 Analyzing files... This may take a few minutes.'))
        .addWidget(CardService.newProgressIndicator()
          .setType(CardService.ProgressIndicatorType.SPINNER))
        .addWidget(CardService.newButtonSet()
          .addButton(CardService.newTextButton()
            .setText('🔄 Check Status')
            .setOnClickAction(CardService.newAction()
              .setFunctionName('checkScanStatus')))))
      .build();
    return [card];
  }
  
  if (error) {
    const card = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader()
        .setTitle('Scan Error'))
      .addSection(CardService.newCardSection()
        .addWidget(CardService.newTextParagraph()
          .setText(`❌ Error: ${error}`))
        .addWidget(CardService.newButtonSet()
          .addButton(CardService.newTextButton()
            .setText('🔄 Try Again')
            .setOnClickAction(CardService.newAction()
              .setFunctionName('onHomepage')))))
      .build();
    
    // Clear error
    scriptProperties.deleteProperty('scanError');
    scriptProperties.deleteProperty('scanComplete');
    
    return [card];
  }
  
  if (!resultsJson) {
    const card = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader()
        .setTitle('Scan Results'))
      .addSection(CardService.newCardSection()
        .addWidget(CardService.newTextParagraph()
          .setText('No results found. Please try scanning again.'))
        .addWidget(CardService.newButtonSet()
          .addButton(CardService.newTextButton()
            .setText('🔄 Scan Again')
            .setOnClickAction(CardService.newAction()
              .setFunctionName('onHomepage')))))
      .build();
    return [card];
  }
  
  const results = JSON.parse(resultsJson);
  
  // Build results card
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Scan Results')
      .setSubtitle(`Scanned ${results.total_files || 0} files`))
    .addSection(CardService.newCardSection()
      .setHeader('Summary')
      .addWidget(CardService.newKeyValue()
        .setTopLabel('Total Files Scanned')
        .setContent((results.total_files || 0).toString())
        .setIcon(CardService.Icon.DESCRIPTION))
      .addWidget(CardService.newKeyValue()
        .setTopLabel('Duplicate Groups Found')
        .setContent((results.total_duplicate_groups || 0).toString())
        .setIcon(CardService.Icon.DRIVE_FILE))
      .addWidget(CardService.newKeyValue()
        .setTopLabel('Storage Savings')
        .setContent(formatBytes(results.storage_savings || 0))
        .setIcon(CardService.Icon.INBOX)))
    .build();
  
  // Add exact duplicates section
  if (results.exact_duplicates && results.exact_duplicates.length > 0) {
    const exactSection = CardService.newCardSection()
      .setHeader(`🔴 Exact Duplicates (${results.exact_duplicates.length} groups)`);
    
    results.exact_duplicates.slice(0, 5).forEach((group, idx) => {
      const primaryName = group.primary_file?.name || 'Unknown';
      const duplicateCount = group.duplicate_files?.length || 0;
      
      exactSection.addWidget(CardService.newDecoratedText()
        .setText(`Group ${idx + 1}: ${primaryName}`)
        .setBottomLabel(`${duplicateCount} duplicate(s) found`)
        .setIcon(CardService.Icon.DRIVE_FILE));
    });
    
    if (results.exact_duplicates.length > 5) {
      exactSection.addWidget(CardService.newTextParagraph()
        .setText(`... and ${results.exact_duplicates.length - 5} more groups`));
    }
    
    card.addSection(exactSection);
  }
  
  // Add near duplicates section
  if (results.near_duplicates && results.near_duplicates.length > 0) {
    const nearSection = CardService.newCardSection()
      .setHeader(`🟡 Near Duplicates (${results.near_duplicates.length} groups)`);
    
    results.near_duplicates.slice(0, 5).forEach((group, idx) => {
      const primaryName = group.primary_file?.name || 'Unknown';
      const similarity = ((group.similarity_score || 0) * 100).toFixed(1);
      
      nearSection.addWidget(CardService.newDecoratedText()
        .setText(`Group ${idx + 1}: ${primaryName}`)
        .setBottomLabel(`${similarity}% similarity`)
        .setIcon(CardService.Icon.DRIVE_FILE));
    });
    
    if (results.near_duplicates.length > 5) {
      nearSection.addWidget(CardService.newTextParagraph()
        .setText(`... and ${results.near_duplicates.length - 5} more groups`));
    }
    
    card.addSection(nearSection);
  }
  
  // Add superset/subset duplicates section
  if (results.superset_subset_duplicates && results.superset_subset_duplicates.length > 0) {
    const supersetSection = CardService.newCardSection()
      .setHeader(`🔵 Superset/Subset (${results.superset_subset_duplicates.length} groups)`);
    
    results.superset_subset_duplicates.slice(0, 5).forEach((group, idx) => {
      const primaryName = group.primary_file?.name || 'Unknown';
      const containment = ((group.containment_score || 0) * 100).toFixed(1);
      
      supersetSection.addWidget(CardService.newDecoratedText()
        .setText(`Group ${idx + 1}: ${primaryName}`)
        .setBottomLabel(`${containment}% containment`)
        .setIcon(CardService.Icon.DRIVE_FILE));
    });
    
    if (results.superset_subset_duplicates.length > 5) {
      supersetSection.addWidget(CardService.newTextParagraph()
        .setText(`... and ${results.superset_subset_duplicates.length - 5} more groups`));
    }
    
    card.addSection(supersetSection);
  }
  
  // Add action buttons
  card.addSection(CardService.newCardSection()
    .addWidget(CardService.newButtonSet()
      .addButton(CardService.newTextButton()
        .setText('🔄 Scan Again')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('onHomepage')))
      .addButton(CardService.newTextButton()
        .setText('📊 View Full Report')
        .setOnClickAction(CardService.newAction()
          .setFunctionName('openFullReport')
          .setParameters({
            results: resultsJson
          })))));
  
  // Clear scan status
  scriptProperties.deleteProperty('lastScanResults');
  scriptProperties.deleteProperty('scanComplete');
  scriptProperties.deleteProperty('scanTimestamp');
  
  return [card];
}

/**
 * Formats bytes to human-readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Opens full report in a new window
 */
function openFullReport(e) {
  const resultsJson = e.parameters.results;
  // For now, just show a notification
  // In production, you could open a web app URL with results
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setText('Full report feature coming soon. Results are displayed above.'))
    .build();
}

/**
 * Gets OAuth token for API calls
 */
function getOAuthToken() {
  try {
    return ScriptApp.getOAuthToken();
  } catch (error) {
    Logger.log('OAuth token error: ' + error.toString());
    return null;
  }
}

/**
 * Toggles subfolders setting
 */
function toggleSubfolders(e) {
  // This is handled by the switch widget
  return CardService.newActionResponseBuilder().build();
}

