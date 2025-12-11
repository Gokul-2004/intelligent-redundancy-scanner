"""Google Drive API client"""
import httpx
from typing import List, Dict, Optional


class GoogleDriveClient:
    """Client for Google Drive API"""
    
    BASE_URL = "https://www.googleapis.com/drive/v3"
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    
    async def _request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """Make API request"""
        url = f"{self.BASE_URL}{endpoint}"
        
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method,
                url,
                headers=self.headers,
                **kwargs
            )
            if response.status_code == 401:
                raise httpx.HTTPStatusError(
                    "Token expired or invalid. Please sign in again.",
                    request=response.request,
                    response=response
                )
            elif response.status_code >= 400:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = error_json.get("error", {}).get("message", error_detail)
                except:
                    pass
                raise httpx.HTTPStatusError(
                    f"Google Drive API error: {response.status_code} - {error_detail}",
                    request=response.request,
                    response=response
                )
            
            # DELETE requests return 204 No Content (empty body)
            if method == "DELETE" or response.status_code == 204:
                return {}
            
            # Try to parse JSON, return empty dict if fails
            try:
                return response.json()
            except:
                return {}
    
    async def list_all_files(self, folder_ids: Optional[List[str]] = None, include_subfolders: bool = True) -> List[Dict]:
        """
        List all files from specified folders in Google Drive
        
        Args:
            folder_ids: List of folder IDs to scan. If None, scans entire Drive (legacy behavior)
            include_subfolders: If True, recursively scans all subfolders
        """
        all_files = []
        folders_to_scan = set(folder_ids or [])
        scanned_folders = set()
        
        print("Listing files from Google Drive...")
        if folder_ids:
            print(f"Scanning {len(folder_ids)} folder(s)")
        else:
            print("Scanning entire Drive (no folders specified)")
        
        # Recursively scan folders
        while folders_to_scan:
            current_folder_id = folders_to_scan.pop()
            if current_folder_id in scanned_folders:
                continue
            
            scanned_folders.add(current_folder_id)
            print(f"\n📁 Scanning folder: {current_folder_id}")
            
            # Get files in this folder
            files_in_folder = await self._list_files_in_folder(current_folder_id)
            all_files.extend(files_in_folder)
            
            # If including subfolders, find and add subfolders to scan queue
            if include_subfolders:
                subfolders = await self._list_subfolders(current_folder_id)
                for subfolder_id in subfolders:
                    if subfolder_id not in scanned_folders:
                        folders_to_scan.add(subfolder_id)
                        print(f"  📁 Found subfolder: {subfolder_id} (will scan)")
        
        print(f"\nTotal files found: {len(all_files)}")
        return all_files
    
    async def _list_files_in_folder(self, folder_id: str) -> List[Dict]:
        """List all files (non-folders) in a specific folder"""
        files = []
        page_token = None
        
        while True:
            try:
                # Query: files in this folder, not trashed, not folders
                query = f"'{folder_id}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'"
                
                params = {
                    "q": query,
                    "fields": "nextPageToken, files(id, name, size, mimeType, modifiedTime, webViewLink)",
                    "pageSize": 1000,
                }
                
                if page_token:
                    params["pageToken"] = page_token
                
                result = await self._request("GET", "/files", params=params)
                page_files = result.get("files", [])
                
                for file in page_files:
                    # Only process files that have a size (can be downloaded)
                    if file.get("size"):
                        files.append({
                            "id": file["id"],
                            "name": file["name"],
                            "size": int(file.get("size", 0)),
                            "mime_type": file.get("mimeType", ""),
                            "last_modified": file.get("modifiedTime"),
                            "web_url": file.get("webViewLink"),
                            "source": "Google Drive"
                        })
                        print(f"    ✅ File: {file['name']} ({file.get('size', 0)} bytes)")
                    else:
                        print(f"    ⏭️  Skipping: {file['name']} (Google Workspace file)")
                
                page_token = result.get("nextPageToken")
                if not page_token:
                    break
                    
            except Exception as e:
                print(f"Error listing files in folder {folder_id}: {e}")
                break
        
        return files
    
    async def _list_subfolders(self, folder_id: str) -> List[str]:
        """List all subfolders in a specific folder"""
        subfolder_ids = []
        page_token = None
        
        while True:
            try:
                # Query: folders in this folder, not trashed
                query = f"'{folder_id}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'"
                
                params = {
                    "q": query,
                    "fields": "nextPageToken, files(id, name)",
                    "pageSize": 1000,
                }
                
                if page_token:
                    params["pageToken"] = page_token
                
                result = await self._request("GET", "/files", params=params)
                folders = result.get("files", [])
                
                for folder in folders:
                    subfolder_ids.append(folder["id"])
                
                page_token = result.get("nextPageToken")
                if not page_token:
                    break
                    
            except Exception as e:
                print(f"Error listing subfolders in folder {folder_id}: {e}")
                break
        
        return subfolder_ids
    
    async def get_file_content(self, file_id: str) -> bytes:
        """Download file content"""
        url = f"{self.BASE_URL}/files/{file_id}?alt=media"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code == 401:
                raise httpx.HTTPStatusError(
                    "Token expired or invalid",
                    request=response.request,
                    response=response
                )
            response.raise_for_status()
            return response.content
    
    async def delete_file(self, file_id: str, permanent: bool = False) -> None:
        """
        Delete a file (soft delete to trash by default, or permanent)
        
        Args:
            file_id: ID of file to delete
            permanent: If True, permanently delete. If False, move to trash (default)
        """
        if permanent:
            # Permanent deletion
            await self._request("DELETE", f"/files/{file_id}")
        else:
            # Soft delete: move to trash
            await self._request("PATCH", f"/files/{file_id}", json={"trashed": True})
    
    async def restore_file(self, file_id: str) -> None:
        """Restore a file from trash"""
        await self._request("PATCH", f"/files/{file_id}", json={"trashed": False})

