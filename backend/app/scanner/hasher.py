"""Content hashing - optimized for large files"""
import hashlib
from typing import Optional


def compute_sha256(content: bytes) -> str:
    """Compute SHA-256 hash of content"""
    return hashlib.sha256(content).hexdigest()


def compute_sha256_optimized(content: bytes, max_size: int = 10 * 1024 * 1024) -> str:
    """
    Compute SHA-256 hash, optimized for large files
    
    For files larger than max_size, hash first chunk + last chunk + size
    This is faster but less accurate (may miss some duplicates)
    
    Args:
        content: File content as bytes
        max_size: Maximum size to hash fully (default 10MB)
    
    Returns:
        SHA-256 hash
    """
    size = len(content)
    
    # For small files, hash everything
    if size <= max_size:
        return compute_sha256(content)
    
    # For large files, hash first chunk + last chunk + size
    # This catches most duplicates while being much faster
    chunk_size = 1024 * 1024  # 1MB chunks
    sha256 = hashlib.sha256()
    
    # Hash first chunk
    sha256.update(content[:chunk_size])
    
    # Hash last chunk
    if size > chunk_size:
        sha256.update(content[-chunk_size:])
    
    # Include file size in hash to differentiate files with same start/end
    sha256.update(str(size).encode())
    
    return sha256.hexdigest()


async def hash_file_content(content: bytes) -> str:
    """Hash file content (async wrapper)"""
    return compute_sha256_optimized(content)


def hash_file_stream(stream) -> str:
    """Hash file content from stream (for large files)"""
    sha256 = hashlib.sha256()
    
    # Read in chunks
    while True:
        chunk = stream.read(8192)  # 8KB chunks
        if not chunk:
            break
        sha256.update(chunk)
    
    return sha256.hexdigest()

