import { useRef, useState, useEffect } from 'react'
import { scanAPI, duplicatesAPI } from './services/api'

function App() {
  const [token, setToken] = useState(null)
  const [results, setResults] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const [selectedFolders, setSelectedFolders] = useState([]) // Array of {id, name}
  const [includeSubfolders, setIncludeSubfolders] = useState(true) // Default: include all subfolders
  const [expandedGroups, setExpandedGroups] = useState(new Set()) // Track which groups are expanded
  const [deletingFiles, setDeletingFiles] = useState(new Set()) // Track files being deleted
  const [deletingClusters, setDeletingClusters] = useState(new Set()) // Track clusters being deleted
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, stage: '' }) // Scan progress
  const [showReport, setShowReport] = useState(false) // Toggle report view
  const tokenClientRef = useRef(null)
  const pickerApiLoadedRef = useRef(false)

  // Material 3 Color Palette
  const colors = {
    primary: '#6750A4',      // Material 3 Primary Purple
    primaryContainer: '#EADDFF',
    secondary: '#625B71',
    secondaryContainer: '#E8DEF8',
    tertiary: '#7D5260',
    surface: '#FFFBFE',
    surfaceVariant: '#E7E0EC',
    error: '#BA1A1A',
    errorContainer: '#F9DEDC',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    outline: '#79747E',
    shadow: 'rgba(0, 0, 0, 0.15)'
  }

  // Load Google Identity Services (popup flow)
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    const initGIS = () => {
      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        setError('Google Identity Services failed to load. Please refresh the page.')
        return
      }

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
        callback: (resp) => {
          if (resp.error) {
            console.error('Token error:', resp)
            setError(`Sign in failed: ${resp.error}`)
            return
          }
          setToken(resp.access_token)
          setIsSignedIn(true)
          setError(null)
        }
      })

      setGoogleReady(true)
    }

    if (!clientId || clientId === 'YOUR_CLIENT_ID_HERE') {
      setError('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in frontend/.env and restart npm run dev.')
      return
    }

    // If already loaded
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      initGIS()
      return
    }

    // Load GIS script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      console.log('Google Identity script loaded')
      initGIS()
    }
    script.onerror = () => {
      setError('Failed to load Google Identity script. Check your network and try again.')
    }
    document.head.appendChild(script)

    return () => {
      // cleanup script listener not strictly needed
    }
  }, [])

  const handleSignIn = () => {
    if (!googleReady || !tokenClientRef.current) {
      setError('Google Sign-In not ready. Please wait a moment and try again.')
      return
    }

    try {
      tokenClientRef.current.requestAccessToken()
    } catch (error) {
      console.error('Sign in error:', error)
      setError('Sign in failed. Please try again.')
    }
  }

  const handleSignOut = async () => {
    setToken(null)
    setIsSignedIn(false)
    setResults(null)
    setSelectedFolders([])
  }

  // Load Google Picker API
  useEffect(() => {
    if (!isSignedIn || !token || pickerApiLoadedRef.current) return

    const loadPicker = () => {
      console.log('Attempting to load Picker API...')
      console.log('gapi available:', !!window.gapi)
      console.log('gapi.load available:', !!(window.gapi && window.gapi.load))
      console.log('google.picker available:', !!(window.google && window.google.picker))
      
      if (window.gapi && window.gapi.load) {
        try {
          window.gapi.load('picker', {
            callback: () => {
              console.log('✅ Google Picker API loaded successfully')
              pickerApiLoadedRef.current = true
            },
            onerror: (error) => {
              console.error('❌ Error loading Picker API:', error)
              setError('Failed to load Google Picker. Please refresh the page.')
            },
            timeout: 10000,
            ontimeout: () => {
              console.error('❌ Picker API load timeout')
              setError('Google Picker API timed out. Please refresh the page.')
            }
          })
        } catch (error) {
          console.error('Exception loading Picker:', error)
          // Retry after delay
          setTimeout(loadPicker, 1000)
        }
      } else {
        console.log('Waiting for gapi to be available...')
        // Retry after a short delay
        setTimeout(loadPicker, 500)
      }
    }

    // Wait a bit for gapi to be fully loaded
    const timer = setTimeout(loadPicker, 1000)
    
    return () => clearTimeout(timer)
  }, [isSignedIn, token])

  const handleSelectFolders = () => {
    if (!token) {
      setError('No access token. Please sign in first.')
      return
    }

    if (!window.google || !window.google.picker) {
      setError('Google Picker API not loaded. Please refresh the page and wait a few seconds.')
      return
    }

    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      const picker = window.google.picker
      
      // Create view for folders
      const view = new picker.DocsView(picker.ViewId.FOLDERS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true)

      // Build picker
      const pickerBuilder = new picker.PickerBuilder()
        .enableFeature(picker.Feature.MULTISELECT_ENABLED)
        .setAppId(clientId)
        .setOAuthToken(token)
        .addView(view)
        .setCallback((data) => {
          if (!data) {
            console.error('Picker callback: no data received')
            return
          }

          const action = data[picker.Response.ACTION]
          
          if (action === picker.Action.PICKED) {
            const docs = data[picker.Response.DOCUMENTS]
            if (!docs || docs.length === 0) {
              setError('No folders selected.')
              return
            }

            const folders = docs
              .filter(doc => doc.mimeType === 'application/vnd.google-apps.folder')
              .map(doc => ({ id: doc.id, name: doc.name }))
            
            if (folders.length > 0) {
              setSelectedFolders(prev => {
                // Merge with existing, avoid duplicates
                const existingIds = new Set(prev.map(f => f.id))
                const newFolders = folders.filter(f => !existingIds.has(f.id))
                return [...prev, ...newFolders]
              })
              setError(null)
            } else {
              setError('Please select at least one folder (not files).')
            }
          } else if (action === picker.Action.CANCEL) {
            console.log('User cancelled folder selection')
          } else if (action === 'loaded') {
            // Picker loaded successfully - not an error, just ignore
            console.log('Picker loaded successfully')
          } else {
            // Only log as error if there's an actual error
            const error = data[picker.Response.ERROR]
            if (error) {
              console.error('Picker error:', error)
              setError(`Picker error: ${error}`)
            } else {
              // Unknown action, just log for debugging
              console.log('Picker action:', action, data)
            }
          }
        })
        .build()
      
      pickerBuilder.setVisible(true)
    } catch (error) {
      console.error('Error creating picker:', error)
      setError(`Failed to open folder picker: ${error.message}`)
    }
  }

  const handleRemoveFolder = (folderId) => {
    setSelectedFolders(prev => prev.filter(f => f.id !== folderId))
  }

  const handleScan = async () => {
    if (!token) {
      setError('No access token. Please sign in first.')
      return
    }

    if (selectedFolders.length === 0) {
      setError('Please select at least one folder to scan.')
      return
    }

    setScanning(true)
    setError(null)
    setResults(null)

    try {
      console.log('Starting scan with token:', token.substring(0, 20) + '...')
      console.log('Selected folders:', selectedFolders)
      const response = await scanAPI.scan({ 
        google_token: token,
        folder_ids: selectedFolders.map(f => f.id),
        include_subfolders: includeSubfolders
      })
      console.log('Scan response:', response.data)
      setResults(response.data)
    } catch (err) {
      console.error('Error scanning:', err)
      console.error('Error response:', err.response)
      
      // Extract detailed error message
      let errorMsg = 'Scan failed'
      if (err.response?.data) {
        if (err.response.data.detail) {
          errorMsg = err.response.data.detail
        } else if (err.response.data.error) {
          errorMsg = err.response.data.error
        } else if (typeof err.response.data === 'string') {
          errorMsg = err.response.data
        } else {
          errorMsg = JSON.stringify(err.response.data)
        }
      } else if (err.message) {
        errorMsg = err.message
      }
      
      setError(`Scan failed: ${errorMsg}`)
      
      // If token expired, try to refresh
      if (errorMsg.includes('401') || errorMsg.includes('expired') || errorMsg.includes('invalid')) {
        setError(`${errorMsg}\n\nToken may be expired. Please sign out and sign in again.`)
      }
    } finally {
      setScanning(false)
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const buildReportMarkdown = () => {
    if (!results) return ''
    const lines = []
    const now = new Date().toLocaleString()
    const scope = selectedFolders.length > 0
      ? `Selected folders (${selectedFolders.length}): ${selectedFolders.map(f => f.name).join(', ')}`
      : 'Scope: Entire Drive'

    lines.push('# Duplicate Scan Report')
    lines.push(`Generated: ${now}`)
    lines.push(scope)
    lines.push(`Include subfolders: ${includeSubfolders ? 'Yes' : 'No'}`)
    lines.push('')
    lines.push('## Summary')
    lines.push(`- Total files scanned: ${results.total_files}`)
    lines.push(`- Duplicate groups: ${results.total_duplicate_groups}`)
    lines.push(`- Total duplicate files: ${results.total_duplicate_files || 0}`)
    lines.push(`- Estimated storage savings: ${formatBytes(results.total_storage_savings_bytes || 0)}`)
    lines.push('')

    const addGroupSection = (groups, label) => {
      if (!groups || groups.length === 0) return
      groups.forEach((group) => {
        const primary = group.primary_file
        const duplicates = group.duplicate_files || []
        const number = lines.filter(l => l.startsWith('### Duplicate Group')).length + 1
        lines.push(`### Duplicate Group #${number} (${label})`)
        lines.push(`Primary: ${primary?.name || 'Unknown'} (${formatBytes(primary?.size || 0)}, ${formatDate(primary?.last_modified)})`)
        lines.push('Duplicates:')
        if (duplicates.length === 0) {
          lines.push('- None')
        } else {
          duplicates.forEach(d => {
            lines.push(`- ${d.name} (${formatBytes(d.size || 0)}, ${formatDate(d.last_modified)})`)
          })
        }
        if (group.similarity_score) {
          lines.push(`Similarity: ${(group.similarity_score * 100).toFixed(1)}%`)
        }
        if (group.containment_score) {
          lines.push(`Containment: ${(group.containment_score * 100).toFixed(1)}%`)
        }
        lines.push('Suggestion: Keep Primary')
        lines.push('')
      })
    }

    addGroupSection(results.exact_duplicates, 'Exact')
    addGroupSection(results.superset_subset_duplicates, 'Superset/Subset')
    addGroupSection(results.near_duplicates, 'Near')

    return lines.join('\n')
  }

  const handleExportReport = (format = 'md') => {
    if (!results) return
    const content = format === 'json' ? JSON.stringify(results, null, 2) : buildReportMarkdown()
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = format === 'json' ? 'duplicate-report.json' : 'duplicate-report.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }

  const handleDeleteFile = async (fileId, fileName, groupKey, permanent = false) => {
    if (!token) {
      setError('No access token. Please sign in again.')
      return
    }

    const action = permanent ? 'permanently delete' : 'move to trash'
    const confirmMsg = permanent 
      ? `⚠️ PERMANENT DELETE: Are you sure you want to permanently delete "${fileName}"? This cannot be undone!`
      : `Move "${fileName}" to trash? You can restore it from Google Drive Trash later.`
    
    if (!window.confirm(confirmMsg)) {
      return
    }

    setDeletingFiles(prev => new Set(prev).add(fileId))

    try {
      await duplicatesAPI.deleteFiles({
        google_token: token,
        group_id: groupKey,
        file_ids: [fileId],
        action: permanent ? 'delete' : 'trash',
        permanent: permanent
      })

      // Remove the file from results
      setResults(prev => {
        if (!prev) return null

        const updateGroup = (group) => {
          // Remove from duplicate_files
          const updatedDuplicates = group.duplicate_files.filter(f => f.id !== fileId)
          
          // If primary file was deleted, make first duplicate the primary
          if (group.primary_file.id === fileId && updatedDuplicates.length > 0) {
            return {
              ...group,
              primary_file: updatedDuplicates[0],
              duplicate_files: updatedDuplicates.slice(1)
            }
          }

          return {
            ...group,
            duplicate_files: updatedDuplicates
          }
        }

        const exact = (prev.exact_duplicates || []).map(updateGroup).filter(g => 
          g.duplicate_files.length > 0 || g.primary_file.id !== fileId
        )
        const superset = (prev.superset_subset_duplicates || []).map(updateGroup).filter(g => 
          g.duplicate_files.length > 0 || g.primary_file.id !== fileId
        )
        const near = (prev.near_duplicates || []).map(updateGroup).filter(g => 
          g.duplicate_files.length > 0 || g.primary_file.id !== fileId
        )

        return {
          ...prev,
          exact_duplicates: exact,
          superset_subset_duplicates: superset,
          near_duplicates: near,
          total_duplicate_groups: exact.length + superset.length + near.length,
          total_duplicate_files: exact.reduce((sum, g) => sum + g.duplicate_files.length, 0) +
                                 superset.reduce((sum, g) => sum + g.duplicate_files.length, 0) +
                                 near.reduce((sum, g) => sum + g.duplicate_files.length, 0)
        }
      })

      setError(null)
    } catch (err) {
      console.error('Error deleting file:', err)
      console.error('Full error:', err.response)
      let errorMsg = 'Failed to delete file'
      if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail
      } else if (err.response?.data?.errors && err.response.data.errors.length > 0) {
        errorMsg = err.response.data.errors[0].error || 'Delete failed'
      } else if (err.message) {
        errorMsg = err.message
      }
      
      // Check for permission errors
      if (errorMsg.includes('403') || errorMsg.includes('permission') || errorMsg.includes('insufficient')) {
        errorMsg = 'Permission denied. With current scopes, only files this app created can be trashed/deleted.'
      }
      
      setError(`Delete failed: ${errorMsg}`)
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        return newSet
      })
    }
  }

  const handleClusterAction = async () => {
    setError('Cluster delete is disabled with current read-only scopes.')
  }

  return (
    <div style={{ 
      padding: '32px 24px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '42px', 
          fontWeight: '700', 
          color: colors.onSurface,
          marginBottom: '12px',
          letterSpacing: '-0.5px'
        }}>
          Intelligent Redundancy Scanner
        </h1>
        <p style={{ 
          fontSize: '18px', 
          color: colors.onSurfaceVariant,
          fontWeight: '400',
          lineHeight: '1.6'
        }}>
          Find and remove duplicate files from your Google Drive. No data stored — everything happens in real-time.
        </p>
      </div>
      
      {/* Sign In Section - Card */}
      <div style={{ 
        marginBottom: '32px', 
        padding: '32px', 
        backgroundColor: colors.surface,
        borderRadius: '16px',
        boxShadow: `0 2px 8px ${colors.shadow}`,
        border: `1px solid ${colors.surfaceVariant}`
      }}>
        {!isSignedIn ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔐</div>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: colors.onSurface,
              marginBottom: '12px'
            }}>
              Get Started
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: colors.onSurfaceVariant,
              marginBottom: '32px',
              lineHeight: '1.6'
            }}>
              Sign in with your Google account to scan your Drive for duplicate files
            </p>
            <button
              onClick={handleSignIn}
              style={{
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: colors.primary,
                color: colors.onPrimary,
                border: 'none',
                borderRadius: '28px',
                cursor: 'pointer',
                boxShadow: `0 2px 8px ${colors.shadow}`,
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = `0 4px 12px ${colors.shadow}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = `0 2px 8px ${colors.shadow}`
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: colors.onSurface,
                marginBottom: '8px'
              }}>
                Signed in to Google Drive
              </h3>
              {token ? (
                <p style={{ 
                  color: '#34A853', 
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>✅</span> Access token ready
                </p>
              ) : (
                <p style={{ 
                  color: colors.tertiary, 
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⏳</span> Getting access token...
                </p>
              )}
            </div>
            <button
              onClick={handleSignOut}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: colors.errorContainer,
                color: colors.error,
                border: `1px solid ${colors.error}`,
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.error
                e.currentTarget.style.color = colors.onPrimary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.errorContainer
                e.currentTarget.style.color = colors.error
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ 
          marginBottom: '24px', 
          padding: '16px 20px', 
          backgroundColor: colors.errorContainer, 
          border: `1px solid ${colors.error}`, 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong style={{ color: colors.error, fontSize: '14px', fontWeight: '600' }}>Error:</strong>
            <p style={{ color: colors.error, fontSize: '14px', marginTop: '4px', margin: 0 }}>{error}</p>
          </div>
        </div>
      )}

      {/* Folder Selection Section - Card */}
      {isSignedIn && token && (
        <div style={{ 
          marginBottom: '32px', 
          padding: '32px', 
          backgroundColor: colors.surface,
          borderRadius: '16px',
          boxShadow: `0 2px 8px ${colors.shadow}`,
          border: `1px solid ${colors.surfaceVariant}`
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: colors.onSurface,
            marginBottom: '8px'
          }}>
            Select Folders to Scan
          </h3>
          <p style={{ 
            fontSize: '14px', 
            color: colors.onSurfaceVariant,
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            Choose which folders to scan for duplicates. You can select multiple folders.
          </p>
          
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={handleSelectFolders}
              style={{
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: '500',
                backgroundColor: colors.secondaryContainer,
                color: colors.onSecondaryContainer,
                border: 'none',
                borderRadius: '24px',
                cursor: 'pointer',
                boxShadow: `0 1px 3px ${colors.shadow}`,
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = `0 2px 6px ${colors.shadow}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = `0 1px 3px ${colors.shadow}`
              }}
            >
              <span>📁</span> Select Folders
            </button>
            
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginTop: '16px',
              cursor: 'pointer',
              fontSize: '14px',
              color: colors.onSurfaceVariant
            }}>
              <input
                type="checkbox"
                checked={includeSubfolders}
                onChange={(e) => setIncludeSubfolders(e.target.checked)}
                style={{ 
                  marginRight: '12px',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span>Include all subfolders automatically</span>
            </label>
          </div>

          {selectedFolders.length > 0 ? (
            <div style={{ 
              marginTop: '24px',
              padding: '16px',
              backgroundColor: colors.surfaceVariant,
              borderRadius: '12px'
            }}>
              <strong style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: colors.onSurface,
                marginBottom: '12px',
                display: 'block'
              }}>
                Selected Folders ({selectedFolders.length})
              </strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedFolders.map((folder) => (
                  <div 
                    key={folder.id} 
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      backgroundColor: colors.surface,
                      borderRadius: '20px',
                      border: `1px solid ${colors.outline}`
                    }}
                  >
                    <span>📁</span>
                    <span style={{ fontSize: '13px', color: colors.onSurface }}>{folder.name}</span>
                    <button
                      onClick={() => handleRemoveFolder(folder.id)}
                      style={{
                        padding: '2px 6px',
                        fontSize: '12px',
                        backgroundColor: 'transparent',
                        color: colors.error,
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.errorContainer
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ 
              marginTop: '24px',
              padding: '32px',
              textAlign: 'center',
              backgroundColor: colors.surfaceVariant,
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
              <p style={{ 
                fontSize: '14px', 
                color: colors.onSurfaceVariant,
                margin: 0
              }}>
                No folders selected. Click "Select Folders" to get started.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Scan Button & Progress */}
      {isSignedIn && token && (
        <div style={{ marginBottom: '32px' }}>
          {scanning ? (
            <div style={{
              padding: '32px',
              backgroundColor: colors.surface,
              borderRadius: '16px',
              boxShadow: `0 2px 8px ${colors.shadow}`,
              border: `1px solid ${colors.surfaceVariant}`
            }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: colors.onSurface,
                  marginBottom: '8px'
                }}>
                  Scanning Files...
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  color: colors.onSurfaceVariant
                }}>
                  {scanProgress.stage || 'Analyzing your files for duplicates'}
                </p>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: colors.surfaceVariant,
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: scanProgress.total > 0 ? `${(scanProgress.current / scanProgress.total) * 100}%` : '30%',
                  height: '100%',
                  backgroundColor: colors.primary,
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                  animation: scanProgress.total === 0 ? 'pulse 1.5s ease-in-out infinite' : 'none'
                }} />
              </div>
              {scanProgress.total > 0 && (
                <p style={{ 
                  textAlign: 'center',
                  fontSize: '12px',
                  color: colors.onSurfaceVariant,
                  margin: 0
                }}>
                  {scanProgress.current} of {scanProgress.total} files processed
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={handleScan}
              disabled={!token || selectedFolders.length === 0}
              style={{
                width: '100%',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: selectedFolders.length === 0 ? colors.surfaceVariant : colors.primary,
                color: selectedFolders.length === 0 ? colors.onSurfaceVariant : colors.onPrimary,
                border: 'none',
                borderRadius: '28px',
                cursor: selectedFolders.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: selectedFolders.length === 0 ? 'none' : `0 2px 8px ${colors.shadow}`,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (selectedFolders.length > 0) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = `0 4px 12px ${colors.shadow}`
                }
              }}
              onMouseLeave={(e) => {
                if (selectedFolders.length > 0) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = `0 2px 8px ${colors.shadow}`
                }
              }}
            >
              {selectedFolders.length === 0 ? (
                <>
                  <span>⚠️</span> Select Folders First
                </>
              ) : (
                <>
                  <span>🚀</span> Start Scan
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: colors.onSurface,
            marginBottom: '24px',
            letterSpacing: '-0.5px'
          }}>
            Scan Results
          </h2>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowReport(prev => !prev)}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #ddd',
                backgroundColor: showReport ? colors.secondaryContainer : '#fff',
                color: showReport ? colors.onSecondaryContainer : colors.onSurface,
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {showReport ? 'Hide Report' : 'View Report'}
            </button>
            <button
              onClick={() => handleExportReport('md')}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                color: colors.onSurface,
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Export Markdown
            </button>
            <button
              onClick={() => handleExportReport('json')}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                color: colors.onSurface,
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Export JSON
            </button>
          </div>

          {showReport && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: colors.surface,
              borderRadius: '12px',
              border: `1px solid ${colors.surfaceVariant}`,
              boxShadow: `0 1px 3px ${colors.shadow}`,
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '13px', color: colors.onSurface }}>
                {buildReportMarkdown()}
              </pre>
            </div>
          )}
          
          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px', 
            marginBottom: '32px' 
          }}>
            <div style={{ 
              padding: '24px', 
              backgroundColor: colors.surface,
              borderRadius: '16px',
              boxShadow: `0 2px 8px ${colors.shadow}`,
              border: `1px solid ${colors.surfaceVariant}`
            }}>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: '500',
                color: colors.onSurfaceVariant,
                marginBottom: '8px'
              }}>
                Total Files Scanned
              </div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: '700',
                color: colors.primary,
                lineHeight: '1.2'
              }}>
                {results.total_files}
              </div>
            </div>
            <div style={{ 
              padding: '24px', 
              backgroundColor: colors.surface,
              borderRadius: '16px',
              boxShadow: `0 2px 8px ${colors.shadow}`,
              border: `1px solid ${colors.surfaceVariant}`
            }}>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: '500',
                color: colors.onSurfaceVariant,
                marginBottom: '8px'
              }}>
                Duplicate Clusters
              </div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: '700',
                color: colors.tertiary,
                lineHeight: '1.2'
              }}>
                {results.total_duplicate_groups}
              </div>
            </div>
          </div>

          {/* All Duplicate Groups */}
          {results.total_duplicate_groups > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Exact Duplicates */}
              {results.exact_duplicates && results.exact_duplicates.length > 0 && (
                <div>
                  <h3 style={{ marginBottom: '15px', color: '#d32f2f', fontSize: '14px', fontWeight: '600' }}>
                    🔴 EXACT DUPLICATES ({results.exact_duplicates.length})
                  </h3>
                  {results.exact_duplicates.map((group, idx) => {
                    const groupKey = `exact-${idx}`
                    const isExpanded = expandedGroups.has(groupKey)
                    const allFiles = [group.primary_file, ...group.duplicate_files]
                    
                    return (
                      <div 
                        key={groupKey} 
                        style={{ 
                          marginBottom: '8px',
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Recommended Action Banner (disabled due to read-only scopes) */}
                        {isExpanded && group.duplicate_files.length > 0 && (
                          <div style={{
                            padding: '12px 16px',
                            backgroundColor: '#f5f5f5',
                            borderBottom: '1px solid #e0e0e0',
                            color: '#777',
                            fontSize: '12px'
                          }}>
                            Deletion actions are disabled with current read-only scopes. Upgrade scopes to enable.
                          </div>
                        )}

                        {/* Cluster Header - Looks like a folder/file */}
                        <div 
                          onClick={() => toggleGroup(groupKey)}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            userSelect: 'none',
                            backgroundColor: isExpanded ? '#f5f5f5' : '#fff',
                            transition: 'background-color 0.2s',
                            borderLeft: '4px solid #d32f2f'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isExpanded ? '#f5f5f5' : '#fff'}
                        >
                          <span style={{ fontSize: '20px', marginRight: '12px', width: '24px' }}>
                            {isExpanded ? '📂' : '📁'}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                              Cluster {idx + 1} - {allFiles.length} files
                            </div>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                              Identical content • Click to expand chain
                            </div>
                          </div>
                          <span style={{ fontSize: '12px', color: '#999', marginRight: '8px' }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>

                        {/* Chain of Files - Horizontal */}
                        {isExpanded && (
                          <div style={{ 
                            padding: '20px', 
                            backgroundColor: '#fafafa',
                            overflowX: 'auto',
                            overflowY: 'visible'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              gap: '0',
                              minWidth: 'fit-content'
                            }}>
                              {allFiles.map((file, fIdx) => {
                                const isPrimary = fIdx === 0
                                const isDeleting = deletingFiles.has(file.id)
                                const isLast = fIdx === allFiles.length - 1
                                
                                return (
                                  <div key={file.id || fIdx} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    position: 'relative'
                                  }}>
                                    {/* File Card */}
                                    <div 
                                      style={{
                                        width: '220px',
                                        padding: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        backgroundColor: isPrimary ? '#e8f5e9' : '#fff',
                                        borderRadius: '8px',
                                        border: isPrimary ? '2px solid #4caf50' : '1px solid #e0e0e0',
                                        boxShadow: isPrimary ? '0 2px 8px rgba(76, 175, 80, 0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
                                        position: 'relative',
                                        zIndex: 2,
                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                        e.currentTarget.style.boxShadow = isPrimary 
                                          ? '0 4px 12px rgba(76, 175, 80, 0.3)' 
                                          : '0 2px 6px rgba(0,0,0,0.15)'
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = isPrimary 
                                          ? '0 2px 8px rgba(76, 175, 80, 0.2)' 
                                          : '0 1px 3px rgba(0,0,0,0.1)'
                                      }}
                                    >
                                      {/* File Header */}
                                      <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        marginBottom: '12px',
                                        gap: '8px'
                                      }}>
                                        <span style={{ fontSize: '24px' }}>
                                          {isPrimary ? '⭐' : '📄'}
                                        </span>
                                        {isPrimary && (
                                          <span style={{ 
                                            padding: '2px 8px', 
                                            backgroundColor: '#4caf50', 
                                            color: 'white', 
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase'
                                          }}>
                                            Primary
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* File Name */}
                                      <div style={{ 
                                        marginBottom: '10px',
                                        minHeight: '40px'
                                      }}>
                                        <strong style={{ 
                                          fontSize: '13px', 
                                          color: '#333',
                                          lineHeight: '1.4',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                          wordBreak: 'break-word'
                                        }}>
                                          {file.name}
                                        </strong>
                                      </div>
                                      
                                      {/* File Details */}
                                      <div style={{ 
                                        fontSize: '11px', 
                                        color: '#666',
                                        marginBottom: '12px',
                                        lineHeight: '1.6'
                                      }}>
                                        <div style={{ marginBottom: '4px' }}>
                                          <span style={{ marginRight: '4px' }}>📅</span>
                                          {formatDate(file.last_modified)}
                                        </div>
                                        <div>
                                          <span style={{ marginRight: '4px' }}>📦</span>
                                          {formatBytes(file.size || 0)}
                                        </div>
                                      </div>
                                      
                                      {/* Delete buttons */}
                                      {isPrimary ? (
                                        <button
                                          disabled
                                          style={{
                                            width: '100%',
                                            padding: '8px',
                                            fontSize: '12px',
                                            backgroundColor: '#e0e0e0',
                                            color: '#999',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'not-allowed',
                                            fontWeight: '600',
                                            opacity: 0.5
                                          }}
                                        >
                                          🔒 Keep (Primary)
                                        </button>
                                      ) : (
                                        <div style={{ width: '100%', padding: '8px 0', color: '#9c9c9c', fontSize: '12px' }}>
                                          Deletion disabled (read-only scopes). Use drive.full access to enable.
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Chain Connector Arrow */}
                                    {!isLast && (
                                      <div style={{
                                        width: '40px',
                                        height: '2px',
                                        backgroundColor: '#d0d0d0',
                                        position: 'relative',
                                        margin: '0 4px',
                                        zIndex: 1
                                      }}>
                                        <div style={{
                                          position: 'absolute',
                                          right: '-6px',
                                          top: '-4px',
                                          width: 0,
                                          height: 0,
                                          borderTop: '5px solid transparent',
                                          borderBottom: '5px solid transparent',
                                          borderLeft: '8px solid #d0d0d0'
                                        }} />
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Superset/Subset Duplicates */}
              {results.superset_subset_duplicates && results.superset_subset_duplicates.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ marginBottom: '15px', color: '#9c27b0', fontSize: '14px', fontWeight: '600' }}>
                    🔵 SUPERSET/SUBSET ({results.superset_subset_duplicates.length})
                  </h3>
                  {results.superset_subset_duplicates.map((group, idx) => {
                    const groupKey = `superset-${idx}`
                    const isExpanded = expandedGroups.has(groupKey)
                    const allFiles = [group.primary_file, ...group.duplicate_files]
                    const containment = group.containment_score ? (group.containment_score * 100).toFixed(1) : 'N/A'
                    
                    return (
                      <div 
                        key={groupKey} 
                        style={{ 
                          marginBottom: '8px',
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Recommended Action Banner (disabled due to read-only scopes) */}
                        {isExpanded && group.duplicate_files.length > 0 && (
                          <div style={{
                            padding: '12px 16px',
                            backgroundColor: '#f5f5f5',
                            borderBottom: '1px solid #e0e0e0',
                            color: '#777',
                            fontSize: '12px'
                          }}>
                            Deletion actions are disabled with current read-only scopes. Upgrade scopes to enable.
                          </div>
                        )}

                        {/* Cluster Header */}
                        <div 
                          onClick={() => toggleGroup(groupKey)}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            userSelect: 'none',
                            backgroundColor: isExpanded ? '#f5f5f5' : '#fff',
                            transition: 'background-color 0.2s',
                            borderLeft: '4px solid #9c27b0'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isExpanded ? '#f5f5f5' : '#fff'}
                        >
                          <span style={{ fontSize: '20px', marginRight: '12px', width: '24px' }}>
                            {isExpanded ? '📂' : '📁'}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                              Cluster {idx + 1} - {allFiles.length} files
                            </div>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                              {containment}% containment • Smaller file content in larger file
                            </div>
                          </div>
                          <span style={{ fontSize: '12px', color: '#999', marginRight: '8px' }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>

                        {/* Chain of Files - Horizontal (same as exact duplicates) */}
                        {isExpanded && (
                          <div style={{ 
                            padding: '20px', 
                            backgroundColor: '#fafafa',
                            overflowX: 'auto',
                            overflowY: 'visible'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              gap: '0',
                              minWidth: 'fit-content'
                            }}>
                              {allFiles.map((file, fIdx) => {
                                const isPrimary = fIdx === 0
                                const isDeleting = deletingFiles.has(file.id)
                                const isLast = fIdx === allFiles.length - 1
                                
                                return (
                                  <div key={file.id || fIdx} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    position: 'relative'
                                  }}>
                                    {/* File Card (same structure as exact duplicates) */}
                                    <div 
                                      style={{
                                        width: '220px',
                                        padding: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        backgroundColor: isPrimary ? '#e8f5e9' : '#fff',
                                        borderRadius: '8px',
                                        border: isPrimary ? '2px solid #4caf50' : '1px solid #e0e0e0',
                                        boxShadow: isPrimary ? '0 2px 8px rgba(76, 175, 80, 0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
                                        position: 'relative',
                                        zIndex: 2,
                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                      }}
                                    >
                                      {/* File content same as exact duplicates */}
                                      <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        marginBottom: '12px',
                                        gap: '8px'
                                      }}>
                                        <span style={{ fontSize: '24px' }}>
                                          {isPrimary ? '⭐' : '📄'}
                                        </span>
                                        {isPrimary && (
                                          <span style={{ 
                                            padding: '2px 8px', 
                                            backgroundColor: '#4caf50', 
                                            color: 'white', 
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase'
                                          }}>
                                            Primary
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ marginBottom: '10px', minHeight: '40px' }}>
                                        <strong style={{ 
                                          fontSize: '13px', 
                                          color: '#333',
                                          lineHeight: '1.4',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                          wordBreak: 'break-word'
                                        }}>
                                          {file.name}
                                        </strong>
                                      </div>
                                      <div style={{ 
                                        fontSize: '11px', 
                                        color: '#666',
                                        marginBottom: '12px',
                                        lineHeight: '1.6'
                                      }}>
                                        <div style={{ marginBottom: '4px' }}>
                                          <span style={{ marginRight: '4px' }}>📅</span>
                                          {formatDate(file.last_modified)}
                                        </div>
                                        <div>
                                          <span style={{ marginRight: '4px' }}>📦</span>
                                          {formatBytes(file.size || 0)}
                                        </div>
                                      </div>
                                      
                                      {/* Delete disabled (read-only scopes) */}
                                      {isPrimary ? (
                                        <button disabled style={{
                                          width: '100%',
                                          padding: '8px',
                                          fontSize: '12px',
                                          backgroundColor: '#e0e0e0',
                                          color: '#999',
                                          border: 'none',
                                          borderRadius: '6px',
                                          cursor: 'not-allowed',
                                          fontWeight: '600',
                                          opacity: 0.5
                                        }}>
                                          🔒 Keep (Primary)
                                        </button>
                                      ) : (
                                        <div style={{ width: '100%', padding: '8px 0', color: '#9c9c9c', fontSize: '12px' }}>
                                          Deletion disabled (read-only scopes). Use drive.full access to enable.
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Chain Connector Arrow */}
                                    {!isLast && (
                                      <div style={{
                                        width: '40px',
                                        height: '2px',
                                        backgroundColor: '#d0d0d0',
                                        position: 'relative',
                                        margin: '0 4px',
                                        zIndex: 1
                                      }}>
                                        <div style={{
                                          position: 'absolute',
                                          right: '-6px',
                                          top: '-4px',
                                          width: 0,
                                          height: 0,
                                          borderTop: '5px solid transparent',
                                          borderBottom: '5px solid transparent',
                                          borderLeft: '8px solid #d0d0d0'
                                        }} />
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Near Duplicates */}
              {results.near_duplicates && results.near_duplicates.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ marginBottom: '15px', color: '#ff9800', fontSize: '14px', fontWeight: '600' }}>
                    🟡 NEAR DUPLICATES ({results.near_duplicates.length})
                  </h3>
                  {results.near_duplicates.map((group, idx) => {
                    const groupKey = `near-${idx}`
                    const isExpanded = expandedGroups.has(groupKey)
                    const allFiles = [group.primary_file, ...group.duplicate_files]
                    const similarity = group.similarity_score ? (group.similarity_score * 100).toFixed(1) : 'N/A'
                    
                    return (
                      <div 
                        key={groupKey} 
                        style={{ 
                          marginBottom: '8px',
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Recommended Action Banner */}
                        {isExpanded && group.duplicate_files.length > 0 && (
                          <div style={{
                            padding: '12px 16px',
                            backgroundColor: '#fff3e0',
                            borderBottom: '1px solid #ffe0b2',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <strong style={{ fontSize: '13px', color: '#f57c00' }}>
                                💡 Recommended Action:
                              </strong>
                              <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                                Delete {group.duplicate_files.length} of {allFiles.length} files, keep PRIMARY
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <span style={{ fontSize: '12px', color: '#777' }}>
                                Actions disabled (read-only scopes)
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Cluster Header - Looks like a folder/file */}
                        <div 
                          onClick={() => toggleGroup(groupKey)}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            userSelect: 'none',
                            backgroundColor: isExpanded ? '#f5f5f5' : '#fff',
                            transition: 'background-color 0.2s',
                            borderLeft: '4px solid #ff9800'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isExpanded ? '#f5f5f5' : '#fff'}
                        >
                          <span style={{ fontSize: '20px', marginRight: '12px', width: '24px' }}>
                            {isExpanded ? '📂' : '📁'}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                              Cluster {idx + 1} - {allFiles.length} files
                            </div>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                              {similarity}% similar • Click to expand chain
                            </div>
                          </div>
                          <span style={{ fontSize: '12px', color: '#999', marginRight: '8px' }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>

                        {/* Chain of Files - Horizontal */}
                        {isExpanded && (
                          <div style={{ 
                            padding: '20px', 
                            backgroundColor: '#fafafa',
                            overflowX: 'auto',
                            overflowY: 'visible'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              gap: '0',
                              minWidth: 'fit-content'
                            }}>
                              {allFiles.map((file, fIdx) => {
                                const isPrimary = fIdx === 0
                                const isDeleting = deletingFiles.has(file.id)
                                const isLast = fIdx === allFiles.length - 1
                                
                                return (
                                  <div key={file.id || fIdx} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    position: 'relative'
                                  }}>
                                    {/* File Card */}
                                    <div 
                                      style={{
                                        width: '220px',
                                        padding: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        backgroundColor: isPrimary ? '#e8f5e9' : '#fff',
                                        borderRadius: '8px',
                                        border: isPrimary ? '2px solid #4caf50' : '1px solid #e0e0e0',
                                        boxShadow: isPrimary ? '0 2px 8px rgba(76, 175, 80, 0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
                                        position: 'relative',
                                        zIndex: 2,
                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                        e.currentTarget.style.boxShadow = isPrimary 
                                          ? '0 4px 12px rgba(76, 175, 80, 0.3)' 
                                          : '0 2px 6px rgba(0,0,0,0.15)'
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = isPrimary 
                                          ? '0 2px 8px rgba(76, 175, 80, 0.2)' 
                                          : '0 1px 3px rgba(0,0,0,0.1)'
                                      }}
                                    >
                                      {/* File Header */}
                                      <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        marginBottom: '12px',
                                        gap: '8px'
                                      }}>
                                        <span style={{ fontSize: '24px' }}>
                                          {isPrimary ? '⭐' : '📄'}
                                        </span>
                                        {isPrimary && (
                                          <span style={{ 
                                            padding: '2px 8px', 
                                            backgroundColor: '#4caf50', 
                                            color: 'white', 
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase'
                                          }}>
                                            Primary
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* File Name */}
                                      <div style={{ 
                                        marginBottom: '10px',
                                        minHeight: '40px'
                                      }}>
                                        <strong style={{ 
                                          fontSize: '13px', 
                                          color: '#333',
                                          lineHeight: '1.4',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                          wordBreak: 'break-word'
                                        }}>
                                          {file.name}
                                        </strong>
                                      </div>
                                      
                                      {/* File Details */}
                                      <div style={{ 
                                        fontSize: '11px', 
                                        color: '#666',
                                        marginBottom: '12px',
                                        lineHeight: '1.6'
                                      }}>
                                        <div style={{ marginBottom: '4px' }}>
                                          <span style={{ marginRight: '4px' }}>📅</span>
                                          {formatDate(file.last_modified)}
                                        </div>
                                        <div>
                                          <span style={{ marginRight: '4px' }}>📦</span>
                                          {formatBytes(file.size || 0)}
                                        </div>
                                      </div>
                                      
                                      {/* Delete buttons */}
                                      {isPrimary ? (
                                        <button
                                          disabled
                                          style={{
                                            width: '100%',
                                            padding: '8px',
                                            fontSize: '12px',
                                            backgroundColor: '#e0e0e0',
                                            color: '#999',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'not-allowed',
                                            fontWeight: '600',
                                            opacity: 0.5
                                          }}
                                        >
                                          🔒 Keep (Primary)
                                        </button>
                                      ) : (
                                        <div style={{ width: '100%', padding: '8px 0', color: '#9c9c9c', fontSize: '12px' }}>
                                          Deletion disabled (read-only scopes). Use drive.full access to enable.
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Chain Connector Arrow */}
                                    {!isLast && (
                                      <div style={{
                                        width: '40px',
                                        height: '2px',
                                        backgroundColor: '#d0d0d0',
                                        position: 'relative',
                                        margin: '0 4px',
                                        zIndex: 1
                                      }}>
                                        <div style={{
                                          position: 'absolute',
                                          right: '-6px',
                                          top: '-4px',
                                          width: 0,
                                          height: 0,
                                          borderTop: '5px solid transparent',
                                          borderBottom: '5px solid transparent',
                                          borderLeft: '8px solid #d0d0d0'
                                        }} />
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {results.total_duplicate_groups === 0 && (
            <div style={{ 
              padding: '64px 32px', 
              textAlign: 'center',
              backgroundColor: colors.surface,
              borderRadius: '16px',
              boxShadow: `0 2px 8px ${colors.shadow}`,
              border: `1px solid ${colors.surfaceVariant}`
            }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: '600',
                color: colors.onSurface,
                marginBottom: '12px'
              }}>
                No Duplicates Found!
              </h3>
              <p style={{ 
                fontSize: '16px', 
                color: colors.onSurfaceVariant,
                lineHeight: '1.6',
                margin: 0
              }}>
                Your files are clean. All files in the selected folders are unique.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
