"""
MedAssist AI - RAG Module
Vector store and document management
"""

from .vector_store import VectorStore
from .embeddings import get_embeddings

__all__ = ['VectorStore', 'get_embeddings']
