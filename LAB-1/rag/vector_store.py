"""
MedAssist AI - Vector Store
RAG implementation with ChromaDB

VULNERABILITIES:
- RAG poisoning via document upload
- Data leakage through similarity search
- No access control on documents
"""

import os
import hashlib
from typing import List, Dict, Any, Optional

try:
    import chromadb
    from chromadb.config import Settings
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

from .embeddings import get_embeddings


class VectorStore:
    """
    Vector store for RAG functionality
    
    VULNERABILITIES:
    - No authentication on document uploads
    - Poisoned documents can influence all queries
    - Verbatim document chunks returned (data leakage)
    - No content filtering or sanitization
    """
    
    def __init__(self, persist_directory: str = "./rag/chroma_db"):
        self.persist_directory = persist_directory
        self.embedding_function = get_embeddings()
        self.collection_name = "medassist_knowledge"
        
        if CHROMA_AVAILABLE:
            self.client = chromadb.PersistentClient(path=persist_directory)
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "MedAssist medical knowledge base"}
            )
        else:
            # Fallback to simple in-memory store
            self.documents = []
            self.client = None
            self.collection = None
    
    def add_document(
        self, 
        content: str, 
        metadata: Dict = None,
        chunk_size: int = 500,
        chunk_overlap: int = 50
    ) -> str:
        """
        Add a document to the vector store
        
        VULNERABILITY: No content validation - allows RAG poisoning
        """
        # Generate document ID
        doc_id = hashlib.md5(content.encode()).hexdigest()[:12]
        
        # Chunk the document
        chunks = self._chunk_text(content, chunk_size, chunk_overlap)
        
        if metadata is None:
            metadata = {}
        
        if CHROMA_AVAILABLE and self.collection:
            # Add to ChromaDB
            for i, chunk in enumerate(chunks):
                chunk_id = f"{doc_id}_{i}"
                chunk_metadata = {
                    **metadata,
                    "chunk_id": chunk_id,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "doc_id": doc_id
                }
                
                self.collection.add(
                    documents=[chunk],
                    metadatas=[chunk_metadata],
                    ids=[chunk_id]
                )
        else:
            # Fallback storage
            for i, chunk in enumerate(chunks):
                self.documents.append({
                    "id": f"{doc_id}_{i}",
                    "content": chunk,
                    "metadata": {
                        **metadata,
                        "chunk_index": i,
                        "doc_id": doc_id
                    }
                })
        
        return doc_id
    
    def search(
        self, 
        query: str, 
        top_k: int = 5,
        filter_metadata: Dict = None
    ) -> List[Dict]:
        """
        Search the vector store
        
        VULNERABILITY: Returns raw document content (potential data leakage)
        """
        if CHROMA_AVAILABLE and self.collection:
            # Search ChromaDB
            results = self.collection.query(
                query_texts=[query],
                n_results=top_k,
                where=filter_metadata
            )
            
            # Format results
            formatted = []
            if results and results['documents']:
                for i, doc in enumerate(results['documents'][0]):
                    formatted.append({
                        "content": doc,  # VULNERABILITY: Raw content returned
                        "metadata": results['metadatas'][0][i] if results['metadatas'] else {},
                        "score": results['distances'][0][i] if results['distances'] else 0
                    })
            
            return formatted
        else:
            # Simple keyword search fallback
            query_lower = query.lower()
            results = []
            
            for doc in self.documents:
                if query_lower in doc["content"].lower():
                    results.append({
                        "content": doc["content"],
                        "metadata": doc["metadata"],
                        "score": doc["content"].lower().count(query_lower) / len(doc["content"])
                    })
            
            # Sort by score and return top_k
            results.sort(key=lambda x: x["score"], reverse=True)
            return results[:top_k]
    
    def delete_document(self, doc_id: str) -> bool:
        """
        Delete a document by ID
        VULNERABILITY: No authorization check
        """
        if CHROMA_AVAILABLE and self.collection:
            # Delete all chunks with this doc_id
            self.collection.delete(
                where={"doc_id": doc_id}
            )
            return True
        else:
            self.documents = [
                d for d in self.documents 
                if d["metadata"].get("doc_id") != doc_id
            ]
            return True
    
    def get_doc_count(self) -> int:
        """Get total document count"""
        if CHROMA_AVAILABLE and self.collection:
            return self.collection.count()
        return len(self.documents)
    
    def get_all_documents(self) -> List[Dict]:
        """
        Get all documents
        VULNERABILITY: Exposes entire knowledge base
        """
        if CHROMA_AVAILABLE and self.collection:
            results = self.collection.get()
            return [
                {
                    "id": results['ids'][i],
                    "content": results['documents'][i],
                    "metadata": results['metadatas'][i]
                }
                for i in range(len(results['ids']))
            ]
        return self.documents
    
    def _chunk_text(
        self, 
        text: str, 
        chunk_size: int, 
        overlap: int
    ) -> List[str]:
        """Split text into overlapping chunks"""
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)
                
                if break_point > chunk_size * 0.5:
                    chunk = chunk[:break_point + 1]
                    end = start + break_point + 1
            
            chunks.append(chunk.strip())
            start = end - overlap
        
        return [c for c in chunks if c]  # Remove empty chunks
    
    def initialize_with_defaults(self):
        """
        Initialize with default medical documents
        Loads documents from the documents folder
        """
        docs_path = os.path.join(os.path.dirname(__file__), "documents")
        
        if os.path.exists(docs_path):
            for filename in os.listdir(docs_path):
                filepath = os.path.join(docs_path, filename)
                
                if os.path.isfile(filepath):
                    with open(filepath, 'r') as f:
                        content = f.read()
                    
                    self.add_document(
                        content,
                        metadata={
                            "source": filename,
                            "type": "system_document"
                        }
                    )
