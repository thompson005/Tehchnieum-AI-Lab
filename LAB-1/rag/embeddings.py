"""
MedAssist AI - Embeddings
Embedding functions for vector search
"""

from typing import List

try:
    from sentence_transformers import SentenceTransformer
    ST_AVAILABLE = True
except ImportError:
    ST_AVAILABLE = False


class SimpleEmbeddings:
    """
    Simple embedding function fallback
    Uses basic TF-IDF style vectors when sentence-transformers not available
    """
    
    def __init__(self):
        self.vocab = {}
        self.idf = {}
    
    def __call__(self, texts: List[str]) -> List[List[float]]:
        """Generate simple embeddings"""
        # Very basic bag-of-words style embedding
        all_words = set()
        for text in texts:
            words = text.lower().split()
            all_words.update(words)
        
        word_list = sorted(list(all_words))[:100]  # Limit vocab size
        
        embeddings = []
        for text in texts:
            words = text.lower().split()
            vec = [words.count(w) / (len(words) + 1) for w in word_list]
            # Pad to fixed size
            vec = vec + [0.0] * (100 - len(vec))
            embeddings.append(vec[:100])
        
        return embeddings


class SentenceTransformerEmbeddings:
    """
    Sentence transformer embeddings
    Uses all-MiniLM-L6-v2 by default
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
    
    def __call__(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using sentence transformers"""
        embeddings = self.model.encode(texts)
        return embeddings.tolist()


def get_embeddings(model_name: str = "all-MiniLM-L6-v2"):
    """
    Get embedding function
    Returns sentence transformer if available, otherwise simple fallback
    """
    if ST_AVAILABLE:
        return SentenceTransformerEmbeddings(model_name)
    else:
        print("[WARNING] sentence-transformers not installed, using simple embeddings")
        return SimpleEmbeddings()
