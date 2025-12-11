"""Scan endpoints - stateless, no database"""
from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel
from typing import Optional
import asyncio

from app.scanner.google_drive_client import GoogleDriveClient
from app.scanner.hasher import compute_sha256_optimized
from app.scanner.duplicate_finder import find_all_duplicates
from app.scanner.text_extractor import extract_text_from_file

router = APIRouter()


class ScanRequest(BaseModel):
    google_token: str
    folder_ids: list[str] = []  # List of folder IDs to scan
    include_subfolders: bool = True  # Whether to recursively scan subfolders


@router.get("/test-token")
async def test_token(google_token: str):
    """Test if token works and can access Google Drive"""
    try:
        drive = GoogleDriveClient(google_token)
        
        # Test: List files (first page)
        try:
            result = await drive._request("GET", "/files", params={
                "q": "trashed=false",
                "fields": "files(id, name, size, mimeType)",
                "pageSize": 10
            })
            files = result.get("files", [])
            
            return {
                "success": True,
                "files_found": len(files),
                "files": [{"name": f["name"], "size": f.get("size", 0), "mime_type": f.get("mimeType")} for f in files]
            }
        except Exception as e:
            return {"error": f"Cannot access Google Drive: {str(e)}"}
            
    except Exception as e:
        return {"error": f"Test failed: {str(e)}"}


@router.post("/scan")
async def scan_files(request: ScanRequest):
    """
    Scan Google Drive files and find duplicates - all in memory, no database
    
    Returns results immediately
    """
    try:
        # Initialize Google Drive client
        drive = GoogleDriveClient(request.google_token)
        
        # Get files from selected folders
        print("=" * 50)
        print("Starting Google Drive scan...")
        print(f"Token preview: {request.google_token[:20]}...")
        print(f"Selected folders: {request.folder_ids}")
        print(f"Include subfolders: {request.include_subfolders}")
        
        if not request.folder_ids:
            raise HTTPException(status_code=400, detail="No folders selected. Please select at least one folder to scan.")
        
        files = await drive.list_all_files(
            folder_ids=request.folder_ids,
            include_subfolders=request.include_subfolders
        )
        print(f"Found {len(files)} files total")
        print("=" * 50)
        
        if len(files) == 0:
            return {
                "status": "completed",
                "total_files": 0,
                "exact_duplicates": [],
                "near_duplicates": [],
                "total_duplicate_groups": 0,
                "total_duplicate_files": 0,
                "total_storage_savings_bytes": 0,
                "message": "No files found. Make sure you have files in your Google Drive."
            }
        
        # Process files: download, hash, extract text
        processed_files = []
        errors = []
        
        print(f"Processing {len(files)} files...")
        for i, file in enumerate(files):
            try:
                print(f"Processing file {i+1}/{len(files)}: {file.get('name', 'Unknown')} ({file.get('size', 0)} bytes)")
                
                # Download file content
                content = await drive.get_file_content(file["id"])
                
                # Compute optimized hash (faster for large files)
                file["content_hash"] = compute_sha256_optimized(content)
                
                # Extract text for content-based duplicate detection
                extracted_text = extract_text_from_file(
                    content,
                    file.get("mime_type", ""),
                    file.get("name", "")
                )
                
                if extracted_text:
                    file["extracted_text"] = extracted_text
                    print(f"  ✅ Extracted {len(extracted_text)} characters of text")
                else:
                    file["extracted_text"] = None
                    print(f"  ⏭️  No text extractable (binary/image file)")
                
                # Don't store full content in memory (save space)
                # Only keep hash and extracted text
                del content
                
                processed_files.append(file)
                
            except Exception as e:
                # Skip files we can't access
                error_msg = f"Error processing {file.get('name', 'Unknown')}: {str(e)}"
                print(error_msg)
                errors.append({
                    "file_name": file.get("name", "Unknown"),
                    "error": str(e)
                })
                continue
        
        print(f"Successfully processed {len(processed_files)} files")
        if errors:
            print(f"Errors processing {len(errors)} files")
        
        # Find duplicates
        results = find_all_duplicates(processed_files)
        
        return {
            "status": "completed",
            **results,
            "files_processed": len(processed_files),
            "files_failed": len(errors),
            "errors": errors[:10] if errors else []  # Return first 10 errors
        }
        
    except Exception as e:
        import traceback
        error_detail = str(e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Scan failed: {error_detail}")


@router.post("/approve")
async def approve_deletion(
    google_token: str = Body(...),
    group_id: str = Body(...),
    file_ids: list[str] = Body(...),
    action: str = Body(default="trash"),  # "trash" (soft delete) or "delete" (permanent)
    permanent: bool = Body(default=False)  # If True, permanent delete; if False, move to trash
):
    """
    Approve deletion of duplicate files
    
    By default, moves files to trash (soft delete) for safety.
    Set permanent=True for permanent deletion.
    """
    try:
        print(f"Delete request: {len(file_ids)} files, permanent={permanent}")
        drive = GoogleDriveClient(google_token)
        
        deleted_files = []
        errors = []
        delete_type = "permanently deleted" if permanent else "moved to trash"
        
        for file_id in file_ids:
            try:
                print(f"{'Permanently deleting' if permanent else 'Moving to trash'} file: {file_id}")
                await drive.delete_file(file_id, permanent=permanent)
                deleted_files.append(file_id)
                print(f"Successfully {delete_type}: {file_id}")
            except Exception as e:
                error_msg = str(e)
                print(f"Error {delete_type} {file_id}: {error_msg}")
                errors.append({"file_id": file_id, "error": error_msg})
        
        if errors:
            print(f"Deletion completed with {len(errors)} errors")
        else:
            print(f"All {len(deleted_files)} files {delete_type} successfully")
        
        return {
            "status": "completed",
            "deleted_files": deleted_files,
            "errors": errors,
            "permanent": permanent,
            "message": f"{len(deleted_files)} file(s) {delete_type}"
        }
        
    except Exception as e:
        import traceback
        error_detail = str(e)
        traceback.print_exc()
        print(f"Deletion failed: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Deletion failed: {error_detail}")

