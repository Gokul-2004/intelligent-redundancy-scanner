"""Superset/Subset detection for documents where smaller file content is contained in larger file"""
from typing import List, Dict, Tuple
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from app.scanner.content_similarity import ContentSimilarity


def chunk_text(text: str, chunk_size: int = 5) -> List[str]:
    """
    Chunk text into smaller segments (sentences or fixed-size chunks)
    
    Args:
        text: Text to chunk
        chunk_size: Number of sentences per chunk (default: 5)
    
    Returns:
        List of text chunks
    """
    if not text or not text.strip():
        return []
    
    # Split by sentences (simple approach: split by periods, exclamation, question marks)
    import re
    sentences = re.split(r'[.!?]+\s+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if not sentences:
        # Fallback: split by newlines or fixed character length
        if '\n' in text:
            sentences = [s.strip() for s in text.split('\n') if s.strip()]
        else:
            # Fixed character chunks (500 chars)
            sentences = [text[i:i+500] for i in range(0, len(text), 500)]
    
    # Group sentences into chunks
    chunks = []
    for i in range(0, len(sentences), chunk_size):
        chunk = ' '.join(sentences[i:i+chunk_size])
        if chunk.strip():
            chunks.append(chunk.strip())
    
    return chunks if chunks else [text]  # Fallback to original text if no chunks


def calculate_containment_score(
    smaller_file_chunks: List[str],
    larger_file_chunks: List[str],
    similarity_model: ContentSimilarity,
    threshold: float = 0.98
) -> float:
    """
    Calculate asymmetric containment score: what % of smaller file is in larger file
    
    Args:
        smaller_file_chunks: Chunks from smaller file
        larger_file_chunks: Chunks from larger file
        similarity_model: ContentSimilarity instance for embeddings
        threshold: Minimum similarity to consider chunk "contained" (default: 0.98)
    
    Returns:
        Containment score between 0 and 1
    """
    if not smaller_file_chunks or not larger_file_chunks:
        return 0.0
    
    # Get embeddings for all chunks
    all_chunks = smaller_file_chunks + larger_file_chunks
    embeddings = similarity_model.compute_embeddings(all_chunks)
    
    if embeddings is None:
        # Fallback: use simple text similarity
        return _simple_containment_score(smaller_file_chunks, larger_file_chunks, threshold)
    
    # Split embeddings
    num_smaller = len(smaller_file_chunks)
    smaller_embeddings = embeddings[:num_smaller]
    larger_embeddings = embeddings[num_smaller:]
    
    # For each chunk in smaller file, find best match in larger file
    contained_count = 0
    
    for small_chunk_emb in smaller_embeddings:
        # Calculate similarity with all chunks in larger file
        similarities = cosine_similarity([small_chunk_emb], larger_embeddings)[0]
        max_similarity = float(np.max(similarities))
        
        if max_similarity >= threshold:
            contained_count += 1
    
    containment_score = contained_count / len(smaller_file_chunks) if smaller_file_chunks else 0.0
    return containment_score


def _simple_containment_score(
    smaller_chunks: List[str],
    larger_chunks: List[str],
    threshold: float = 0.98
) -> float:
    """Fallback containment score using simple text similarity"""
    from difflib import SequenceMatcher
    
    contained_count = 0
    
    for small_chunk in smaller_chunks:
        best_similarity = 0.0
        for large_chunk in larger_chunks:
            similarity = SequenceMatcher(None, small_chunk.lower(), large_chunk.lower()).ratio()
            best_similarity = max(best_similarity, similarity)
        
        if best_similarity >= threshold:
            contained_count += 1
    
    return contained_count / len(smaller_chunks) if smaller_chunks else 0.0


def find_superset_subset_duplicates(
    files: List[Dict],
    similarity_model: ContentSimilarity,
    containment_threshold: float = 0.95,
    size_ratio_threshold: float = 1.10
) -> List[Dict]:
    """
    Find superset/subset relationships where smaller file content is contained in larger file
    
    Args:
        files: List of files with 'extracted_text', 'size', 'last_modified', 'id', 'name'
        similarity_model: ContentSimilarity instance
        containment_threshold: Minimum containment score (default: 0.95 = 95%)
        size_ratio_threshold: Minimum size ratio for larger file (default: 1.10 = 10% larger)
    
    Returns:
        List of duplicate groups with superset/subset relationship
    """
    # Filter files with extracted text
    text_files = [f for f in files if f.get("extracted_text") and len(f.get("extracted_text", "").strip()) > 100]
    
    if len(text_files) < 2:
        return []
    
    duplicate_groups = []
    processed_pairs = set()
    
    # Compare all pairs
    for i in range(len(text_files)):
        for j in range(i + 1, len(text_files)):
            file1 = text_files[i]
            file2 = text_files[j]
            
            # Skip if already processed
            pair_key = tuple(sorted([file1["id"], file2["id"]]))
            if pair_key in processed_pairs:
                continue
            
            # Determine smaller and larger file
            size1 = file1.get("size", 0)
            size2 = file2.get("size", 0)
            date1 = file1.get("last_modified", "")
            date2 = file2.get("last_modified", "")
            
            if size1 < size2:
                smaller_file = file1
                larger_file = file2
            elif size2 < size1:
                smaller_file = file2
                larger_file = file1
            else:
                # Same size, skip (not superset/subset)
                continue
            
            # Check size difference (larger must be at least 10% bigger)
            size_ratio = larger_file.get("size", 0) / smaller_file.get("size", 1)
            if size_ratio < size_ratio_threshold:
                continue
            
            # Check date (larger file should be newer)
            if larger_file.get("last_modified", "") < smaller_file.get("last_modified", ""):
                continue  # Larger file is older, skip
            
            # Chunk the texts
            smaller_chunks = chunk_text(smaller_file.get("extracted_text", ""))
            larger_chunks = chunk_text(larger_file.get("extracted_text", ""))
            
            if not smaller_chunks or not larger_chunks:
                continue
            
            # Calculate containment score
            containment = calculate_containment_score(
                smaller_chunks,
                larger_chunks,
                similarity_model,
                threshold=0.98
            )
            
            # Check if superset/subset relationship
            if containment >= containment_threshold:
                # Group found: larger file is primary (superset), smaller is duplicate (subset)
                duplicate_groups.append({
                    "group_type": "superset_subset",
                    "primary_file": larger_file,  # Newer, larger file (superset)
                    "duplicate_files": [smaller_file],  # Older, smaller file (subset)
                    "similarity_score": float(containment),
                    "containment_score": float(containment),
                    "storage_savings_bytes": smaller_file.get("size", 0),
                    "relationship": "superset_subset"
                })
                
                processed_pairs.add(pair_key)
    
    return duplicate_groups

