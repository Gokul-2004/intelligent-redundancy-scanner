"""Find duplicates - improved with content-based detection"""
from typing import List, Dict
from collections import defaultdict
from difflib import SequenceMatcher
from app.scanner.hasher import compute_sha256_optimized
from app.scanner.content_similarity import ContentSimilarity
from app.scanner.text_extractor import extract_text_from_file, normalize_text
from app.scanner.superset_detector import find_superset_subset_duplicates


# Initialize content similarity (loads model once)
_content_similarity = None

def get_content_similarity():
    """Get or create ContentSimilarity instance (singleton)"""
    global _content_similarity
    if _content_similarity is None:
        _content_similarity = ContentSimilarity()
    return _content_similarity


def find_exact_duplicates(files: List[Dict]) -> List[Dict]:
    """
    Find exact duplicates by content hash
    
    Args:
        files: List of file dicts with 'id', 'name', 'content_hash', 'size'
    
    Returns:
        List of duplicate groups
    """
    # Group files by hash
    hash_groups = defaultdict(list)
    
    for file in files:
        if file.get("content_hash"):
            hash_groups[file["content_hash"]].append(file)
    
    # Find groups with multiple files (duplicates)
    duplicate_groups = []
    
    for hash_value, file_list in hash_groups.items():
        if len(file_list) > 1:
            # Sort by name or date (first one is "primary")
            file_list.sort(key=lambda x: (
                x.get("last_modified", ""),
                x.get("name", "")
            ))
            
            duplicate_groups.append({
                "group_type": "exact",
                "primary_file": file_list[0],
                "duplicate_files": file_list[1:],
                "similarity_score": 1.0,  # Exact match
                "storage_savings_bytes": sum(f.get("size", 0) for f in file_list[1:])
            })
    
    return duplicate_groups


def calculate_filename_similarity(name1: str, name2: str) -> float:
    """Calculate filename similarity using multiple methods"""
    name1 = name1.lower().strip()
    name2 = name2.lower().strip()
    
    if not name1 or not name2:
        return 0.0
    
    # Character-level similarity
    char_sim = SequenceMatcher(None, name1, name2).ratio()
    
    # Word-level similarity
    words1 = set(name1.split())
    words2 = set(name2.split())
    
    if words1 and words2:
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        word_sim = intersection / union if union > 0 else 0.0
    else:
        word_sim = 0.0
    
    # Combined score
    return (char_sim * 0.4 + word_sim * 0.6)


def calculate_metadata_similarity(file1: Dict, file2: Dict) -> float:
    """Calculate similarity based on metadata (size, date)"""
    score = 0.0
    
    # Size similarity (within 10% = similar)
    size1 = file1.get("size", 0)
    size2 = file2.get("size", 0)
    
    if size1 > 0 and size2 > 0:
        size_ratio = min(size1, size2) / max(size1, size2)
        if size_ratio >= 0.9:  # Within 10%
            score += 0.5
        elif size_ratio >= 0.8:  # Within 20%
            score += 0.3
    
    # Date similarity (same day = similar)
    date1 = file1.get("last_modified", "")
    date2 = file2.get("last_modified", "")
    
    if date1 and date2:
        try:
            from datetime import datetime
            d1 = datetime.fromisoformat(date1.replace('Z', '+00:00'))
            d2 = datetime.fromisoformat(date2.replace('Z', '+00:00'))
            days_diff = abs((d1 - d2).days)
            
            if days_diff == 0:
                score += 0.3
            elif days_diff <= 7:
                score += 0.2
            elif days_diff <= 30:
                score += 0.1
        except:
            pass
    
    # File type similarity
    mime1 = file1.get("mime_type", "")
    mime2 = file2.get("mime_type", "")
    
    if mime1 and mime2 and mime1 == mime2:
        score += 0.2
    
    return min(score, 1.0)


def find_near_duplicates_improved(files: List[Dict], threshold: float = 0.75) -> List[Dict]:
    """
    Find near-duplicates using multi-signal approach:
    - Filename similarity
    - Content similarity (if text extracted)
    - Metadata similarity (size, date, type)
    
    Args:
        files: List of file dicts with extracted text in 'extracted_text'
        threshold: Combined similarity threshold (0-1)
    
    Returns:
        List of duplicate groups
    """
    duplicate_groups = []
    processed = set()
    content_sim = get_content_similarity()
    
    # Filter files that have text content for content-based comparison
    files_with_text = [f for f in files if f.get("extracted_text")]
    files_without_text = [f for f in files if not f.get("extracted_text")]
    
    print(f"Files with extractable text: {len(files_with_text)}")
    print(f"Files without text (images, binaries): {len(files_without_text)}")
    
    # Process files with text (content-based)
    for i, file1 in enumerate(files_with_text):
        if file1["id"] in processed:
            continue
        
        similar_files = [file1]
        text1 = normalize_text(file1.get("extracted_text", ""))
        
        for file2 in files_with_text[i+1:]:
            if file2["id"] in processed:
                continue
            
            # Pre-filter: Quick metadata check to avoid expensive embedding computation
            metadata_sim = calculate_metadata_similarity(file1, file2)
            if metadata_sim < 0.3:  # Skip if metadata is very different
                continue
            
            # Use embeddings for filename similarity (better semantic matching)
            filename_sim = content_sim.calculate_filename_similarity_embedding(
                file1.get("name", ""),
                file2.get("name", "")
            )
            
            # Content similarity using embeddings
            text2 = normalize_text(file2.get("extracted_text", ""))
            content_sim_score = 0.0
            if text1 and text2:
                content_sim_score = content_sim.calculate_similarity(text1, text2)
            
            # Weighted combined score
            # Content is most important if available, otherwise rely on filename + metadata
            if content_sim_score > 0:
                combined_score = (
                    0.5 * content_sim_score +  # Content similarity (50%) - embeddings
                    0.3 * filename_sim +        # Filename (30%) - embeddings
                    0.2 * metadata_sim          # Metadata (20%)
                )
            else:
                # No content available, use filename + metadata
                combined_score = (
                    0.6 * filename_sim +        # Filename (60%) - embeddings
                    0.4 * metadata_sim           # Metadata (40%)
                )
            
            if combined_score >= threshold:
                similar_files.append(file2)
                processed.add(file2["id"])
        
        if len(similar_files) > 1:
            # Calculate average similarity for the group
            avg_similarity = 0.0
            for file2 in similar_files[1:]:
                filename_sim = calculate_filename_similarity(
                    similar_files[0].get("name", ""),
                    file2.get("name", "")
                )
                metadata_sim = calculate_metadata_similarity(similar_files[0], file2)
                
                text2 = normalize_text(file2.get("extracted_text", ""))
                content_sim_score = 0.0
                if text1 and text2:
                    content_sim_score = content_sim.calculate_similarity(text1, text2)
                
                if content_sim_score > 0:
                    score = 0.5 * content_sim_score + 0.3 * filename_sim + 0.2 * metadata_sim
                else:
                    score = 0.6 * filename_sim + 0.4 * metadata_sim
                
                avg_similarity += score
            
            avg_similarity = avg_similarity / len(similar_files[1:])
            
            duplicate_groups.append({
                "group_type": "near",
                "primary_file": similar_files[0],
                "duplicate_files": similar_files[1:],
                "similarity_score": avg_similarity,
                "storage_savings_bytes": sum(f.get("size", 0) for f in similar_files[1:]),
                "detection_method": "content-based" if text1 else "filename+metadata"
            })
            
            processed.add(file1["id"])
    
    # Process files without text (filename + metadata only)
    for i, file1 in enumerate(files_without_text):
        if file1["id"] in processed:
            continue
        
        similar_files = [file1]
        
        for file2 in files_without_text[i+1:]:
            if file2["id"] in processed:
                continue
            
            filename_sim = calculate_filename_similarity(
                file1.get("name", ""),
                file2.get("name", "")
            )
            metadata_sim = calculate_metadata_similarity(file1, file2)
            
            # For files without text, use higher threshold
            combined_score = 0.6 * filename_sim + 0.4 * metadata_sim
            
            if combined_score >= 0.85:  # Higher threshold for non-text files
                similar_files.append(file2)
                processed.add(file2["id"])
        
        if len(similar_files) > 1:
            duplicate_groups.append({
                "group_type": "near",
                "primary_file": similar_files[0],
                "duplicate_files": similar_files[1:],
                "similarity_score": 0.85,  # Approximate
                "storage_savings_bytes": sum(f.get("size", 0) for f in similar_files[1:]),
                "detection_method": "filename+metadata"
            })
            
            processed.add(file1["id"])
    
    return duplicate_groups


def find_all_duplicates(files: List[Dict]) -> Dict:
    """
    Find both exact and near duplicates with improved algorithms
    
    Returns:
        {
            "exact_duplicates": [...],
            "near_duplicates": [...],
            "total_files": int,
            "total_duplicate_groups": int,
            "total_duplicate_files": int,
            "total_storage_savings_bytes": int
        }
    """
    print("=" * 50)
    print("Finding duplicates...")
    
    # Find exact duplicates (by hash)
    print("Step 1: Finding exact duplicates (content hash)...")
    exact = find_exact_duplicates(files)
    print(f"  Found {len(exact)} exact duplicate groups")
    
    # Find superset/subset duplicates (advanced: smaller file contained in larger)
    print("Step 2: Finding superset/subset duplicates (smaller file in larger file)...")
    similarity_model = get_content_similarity()
    superset_subset = find_superset_subset_duplicates(files, similarity_model)
    print(f"  Found {len(superset_subset)} superset/subset groups")
    
    # Find near duplicates (improved algorithm)
    print("Step 3: Finding near duplicates (content + filename + metadata)...")
    near = find_near_duplicates_improved(files, threshold=0.75)
    print(f"  Found {len(near)} near-duplicate groups")
    
    # Remove files that are already in exact or superset/subset duplicates
    processed_file_ids = set()
    for group in exact + superset_subset:
        processed_file_ids.add(group["primary_file"]["id"])
        for dup in group["duplicate_files"]:
            processed_file_ids.add(dup["id"])
    
    # Filter out near duplicates that are already in other groups
    filtered_near = []
    for group in near:
        if group["primary_file"]["id"] not in processed_file_ids:
            # Check if any duplicates are already processed
            filtered_dups = [
                dup for dup in group["duplicate_files"]
                if dup["id"] not in processed_file_ids
            ]
            if filtered_dups:
                group["duplicate_files"] = filtered_dups
                group["storage_savings_bytes"] = sum(f.get("size", 0) for f in filtered_dups)
                filtered_near.append(group)
    
    print("=" * 50)
    
    all_groups = exact + superset_subset + filtered_near
    
    return {
        "exact_duplicates": exact,
        "superset_subset_duplicates": superset_subset,
        "near_duplicates": filtered_near,
        "total_files": len(files),
        "total_duplicate_groups": len(all_groups),
        "total_duplicate_files": sum(len(g["duplicate_files"]) for g in all_groups),
        "total_storage_savings_bytes": sum(g["storage_savings_bytes"] for g in all_groups)
    }
