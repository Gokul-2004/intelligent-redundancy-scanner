"""Content-based similarity using embeddings"""
from typing import List, Optional
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


# Try to import sentence-transformers, fallback to simple text similarity if not available
try:
    from sentence_transformers import SentenceTransformer
    EMBEDDINGS_AVAILABLE = True
except ImportError:
    EMBEDDINGS_AVAILABLE = False
    print("Warning: sentence-transformers not installed. Using simple text similarity instead.")


class ContentSimilarity:
    """Calculate content similarity between documents"""
    
    def __init__(self):
        self.model = None
        if EMBEDDINGS_AVAILABLE:
            try:
                # Use a lightweight model for embeddings
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                print("✅ Loaded sentence-transformers model for content similarity")
            except Exception as e:
                print(f"Warning: Could not load embeddings model: {e}")
                self.model = None
    
    def compute_embeddings(self, texts: List[str]) -> Optional[np.ndarray]:
        """Compute embeddings for a list of texts"""
        if not self.model:
            return None
        
        try:
            # Filter out empty texts
            valid_texts = [t for t in texts if t and t.strip()]
            if not valid_texts:
                return None
            
            embeddings = self.model.encode(valid_texts, show_progress_bar=False)
            return embeddings
        except Exception as e:
            print(f"Error computing embeddings: {e}")
            return None
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity between two texts
        
        Returns:
            Similarity score between 0 and 1
        """
        if not text1 or not text2:
            return 0.0
        
        # Use embeddings if available
        if self.model:
            try:
                embeddings = self.model.encode([text1, text2], show_progress_bar=False)
                similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
                return float(similarity)
            except Exception as e:
                print(f"Error in embedding similarity: {e}")
                # Fallback to simple similarity
                return self._simple_text_similarity(text1, text2)
        else:
            # Fallback to simple text similarity
            return self._simple_text_similarity(text1, text2)
    
    def _simple_text_similarity(self, text1: str, text2: str) -> float:
        """Simple text similarity using word overlap"""
        from difflib import SequenceMatcher
        
        # Normalize texts
        text1 = text1.lower().strip()
        text2 = text2.lower().strip()
        
        if not text1 or not text2:
            return 0.0
        
        # Use SequenceMatcher for character-level similarity
        similarity = SequenceMatcher(None, text1, text2).ratio()
        
        # Also calculate word-level similarity
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if not words1 or not words2:
            return similarity
        
        # Jaccard similarity (word overlap)
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        word_similarity = intersection / union if union > 0 else 0.0
        
        # Combine character and word similarity
        return (similarity * 0.4 + word_similarity * 0.6)
    
    def batch_similarity_matrix(self, texts: List[str]) -> Optional[np.ndarray]:
        """
        Calculate similarity matrix for a batch of texts
        
        Returns:
            NxN similarity matrix
        """
        if not texts or len(texts) < 2:
            return None
        
        # Use embeddings if available
        if self.model:
            embeddings = self.compute_embeddings(texts)
            if embeddings is not None:
                return cosine_similarity(embeddings)
        
        # Fallback: compute pairwise similarities
        n = len(texts)
        similarity_matrix = np.zeros((n, n))
        
        for i in range(n):
            for j in range(i, n):
                if i == j:
                    similarity_matrix[i][j] = 1.0
                else:
                    sim = self.calculate_similarity(texts[i], texts[j])
                    similarity_matrix[i][j] = sim
                    similarity_matrix[j][i] = sim
        
        return similarity_matrix
    
    def calculate_filename_similarity_embedding(self, name1: str, name2: str) -> float:
        """
        Calculate filename similarity using embeddings for better semantic matching
        
        Returns:
            Similarity score between 0 and 1
        """
        if not name1 or not name2:
            return 0.0
        
        # Use embeddings if available for semantic filename matching
        if self.model:
            try:
                embeddings = self.model.encode([name1, name2], show_progress_bar=False)
                similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
                return float(similarity)
            except Exception as e:
                print(f"Error in filename embedding similarity: {e}")
                # Fallback to simple similarity
                return self._simple_filename_similarity(name1, name2)
        else:
            return self._simple_filename_similarity(name1, name2)
    
    def _simple_filename_similarity(self, name1: str, name2: str) -> float:
        """Simple filename similarity fallback"""
        from difflib import SequenceMatcher
        
        name1 = name1.lower().strip()
        name2 = name2.lower().strip()
        
        if not name1 or not name2:
            return 0.0
        
        char_sim = SequenceMatcher(None, name1, name2).ratio()
        
        words1 = set(name1.split())
        words2 = set(name2.split())
        
        if words1 and words2:
            intersection = len(words1 & words2)
            union = len(words1 | words2)
            word_sim = intersection / union if union > 0 else 0.0
        else:
            word_sim = 0.0
        
        return (char_sim * 0.4 + word_sim * 0.6)

