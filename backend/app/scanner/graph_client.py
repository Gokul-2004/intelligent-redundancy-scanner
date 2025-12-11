"""Microsoft Graph API client - no database needed"""
import httpx
from typing import List, Dict, Optional
import asyncio


class GraphClient:
    """Client for Microsoft Graph API"""
    
    BASE_URL = "https://graph.microsoft.com/v1.0"
    
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
                # Token might be expired or invalid
                error_detail = "Token expired or invalid. Get a fresh token from Graph Explorer."
                try:
                    error_json = response.json()
                    error_detail = error_json.get("error", {}).get("message", error_detail)
                except:
                    pass
                raise httpx.HTTPStatusError(
                    f"Graph API error: {response.status_code} - {error_detail}",
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
                    f"Graph API error: {response.status_code} - {error_detail}",
                    request=response.request,
                    response=response
                )
            return response.json()
    
    async def get_user_drive(self) -> Dict:
        """Get user's OneDrive"""
        result = await self._request("GET", "/me/drive")
        return result
    
    async def get_sites(self) -> List[Dict]:
        """Get SharePoint sites user has access to"""
        try:
            # Try to get sites - might fail if no permissions
            result = await self._request("GET", "/me/sites?$select=id,name,webUrl")
            return result.get("value", [])
        except Exception:
            # If user doesn't have Sites.Read.All, return empty list
            return []
    
    async def get_drives(self, site_id: str) -> List[Dict]:
        """Get document libraries for a site"""
        result = await self._request("GET", f"/sites/{site_id}/drives")
        return result.get("value", [])
    
    async def list_files(self, drive_id: str, folder_id: str = "root", recursive: bool = True) -> List[Dict]:
        """List files in a drive/folder"""
        files = []
        folders_to_process = [(drive_id, folder_id)]
        processed_folders = set()  # Avoid processing same folder twice
        max_depth = 10  # Prevent infinite loops
        depth = 0
        
        while folders_to_process and depth < max_depth:
            current_drive_id, current_folder_id = folders_to_process.pop(0)
            depth += 1
            
            # Skip if already processed
            folder_key = f"{current_drive_id}:{current_folder_id}"
            if folder_key in processed_folders:
                continue
            processed_folders.add(folder_key)
            
            # Handle "root" folder specially
            if current_folder_id == "root":
                endpoint = f"/drives/{current_drive_id}/root/children"
            else:
                endpoint = f"/drives/{current_drive_id}/items/{current_folder_id}/children"
            
            try:
                folder_name = "root" if current_folder_id == "root" else current_folder_id
                print(f"  Scanning folder: {folder_name} (depth {depth})")
                
                while endpoint:
                    result = await self._request("GET", endpoint)
                    items = result.get("value", [])
                    
                    print(f"    Found {len(items)} items in folder")
                    
                    if len(items) == 0:
                        print(f"    ⚠️ Empty folder or no access")
                    
                    for item in items:
                        if "file" in item:  # It's a file
                            files.append({
                                "id": item["id"],
                                "name": item["name"],
                                "size": item.get("size", 0),
                                "last_modified": item.get("lastModifiedDateTime"),
                                "web_url": item.get("webUrl"),
                                "drive_id": current_drive_id,
                                "path": item.get("parentReference", {}).get("path", "")
                            })
                            print(f"      ✅ File: {item['name']} ({item.get('size', 0)} bytes)")
                        elif "folder" in item and recursive:  # It's a folder
                            # Add folder to process list
                            folders_to_process.append((current_drive_id, item["id"]))
                            print(f"      📁 Folder: {item['name']} (will scan)")
                    
                    # Check for next page
                    next_link = result.get("@odata.nextLink", "")
                    if next_link:
                        # Handle full URL or relative path
                        if next_link.startswith("http"):
                            endpoint = next_link.replace(self.BASE_URL, "")
                        else:
                            endpoint = next_link
                    else:
                        endpoint = None
            except Exception as e:
                print(f"    ❌ Error listing files from folder {current_folder_id}: {e}")
                import traceback
                traceback.print_exc()
                continue
        
        print(f"  Total files found: {len(files)}")
        return files
    
    async def get_file_content(self, drive_id: str, file_id: str) -> bytes:
        """Download file content"""
        url = f"{self.BASE_URL}/drives/{drive_id}/items/{file_id}/content"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            return response.content
    
    async def get_file_metadata(self, drive_id: str, file_id: str) -> Dict:
        """Get file metadata"""
        return await self._request(
            "GET",
            f"/drives/{drive_id}/items/{file_id}?$select=id,name,size,lastModifiedDateTime,webUrl"
        )
    
    async def delete_file(self, drive_id: str, file_id: str) -> None:
        """Delete a file"""
        await self._request("DELETE", f"/drives/{drive_id}/items/{file_id}")
    
    async def list_all_files(self, site_id: Optional[str] = None) -> List[Dict]:
        """List all files from user's OneDrive and accessible SharePoint sites"""
        all_files = []
        
        # Start with user's OneDrive (most common case)
        try:
            print("Getting user's OneDrive...")
            drive = await self.get_user_drive()
            drive_id = drive["id"]
            drive_name = drive.get("name", "OneDrive")
            
            print(f"Listing files from {drive_name}...")
            files = await self.list_files(drive_id)
            
            # Add drive info to each file
            for file in files:
                file["drive_id"] = drive_id
                file["drive_name"] = drive_name
                file["source"] = "OneDrive"
            
            all_files.extend(files)
            print(f"Found {len(files)} files in OneDrive")
        except Exception as e:
            print(f"Error accessing OneDrive: {e}")
        
        # Try to get SharePoint sites (optional, might not have permissions)
        try:
            if site_id:
                sites = [{"id": site_id}]
            else:
                sites = await self.get_sites()
            
            if sites:
                print(f"Found {len(sites)} SharePoint sites")
                
                # Get files from each site
                for site in sites:
                    try:
                        drives = await self.get_drives(site["id"])
                        
                        for drive in drives:
                            files = await self.list_files(drive["id"])
                            # Add site/drive info to each file
                            for file in files:
                                file["site_id"] = site["id"]
                                file["site_name"] = site.get("name", "")
                                file["drive_name"] = drive.get("name", "")
                                file["source"] = "SharePoint"
                            
                            all_files.extend(files)
                            print(f"Found {len(files)} files in {drive.get('name', 'Unknown')}")
                    except Exception as e:
                        print(f"Error accessing site {site.get('name', site['id'])}: {e}")
                        continue
        except Exception as e:
            print(f"Error accessing SharePoint sites: {e}")
            # That's okay, user might not have Sites.Read.All permission
        
        print(f"Total files found: {len(all_files)}")
        return all_files

