import numpy as np
from langchain.schema.retriever import BaseRetriever
from langchain.schema import Document
from rank_bm25 import BM25Okapi

class HybridRetriever(BaseRetriever):
    """Custom retriever combining vector search and BM25."""
    
    def __init__(self, vectorstore, texts, embeddings):
        super().__init__()
        self.vectorstore = vectorstore
        self.bm25 = BM25Okapi([text.split() for text in texts])
        self.texts = texts
        self.embeddings = embeddings
    
    def _get_relevant_documents(self, query: str):
        """Get documents relevant to a query."""
        return self.get_relevant_documents(query, k=3)
    
    async def _aget_relevant_documents(self, query: str):
        """Async version - not implemented."""
        return self._get_relevant_documents(query)
    
    def get_relevant_documents(self, query, k=3):
        # Vector similarity search
        vector_docs = self.vectorstore.similarity_search(query, k=k*2)

        bm25_scores = self.bm25.get_scores(query.split())
        bm25_indices = np.argsort(bm25_scores)[::-1][:k*2]
        
        all_docs = []
        doc_set = set()
        
        for doc in vector_docs:
            if doc.page_content not in doc_set:
                all_docs.append((doc, 'vector'))
                doc_set.add(doc.page_content)
        

        for idx in bm25_indices:
            if idx < len(self.texts) and self.texts[idx] not in doc_set:
                doc = Document(page_content=self.texts[idx])
                all_docs.append((doc, 'bm25'))
                doc_set.add(self.texts[idx])
        

        scored_docs = []
        for doc, source in all_docs:
            vector_score = 0.5
            bm25_score = 0.5
            
            if source == 'vector':
                vector_score = 1.0
            if doc.page_content in self.texts:
                text_idx = self.texts.index(doc.page_content)
                raw_bm25_scores = self.bm25.get_scores(query.split())
                bm25_score = raw_bm25_scores[text_idx]
                min_score = np.min(raw_bm25_scores)
                max_score = np.max(raw_bm25_scores)
                if max_score - min_score > 1e-8:
                    bm25_score = (bm25_score - min_score) / (max_score - min_score)
                else:
                    bm25_score = 0.5
            
            hybrid_score = 0.7 * vector_score + 0.3 * bm25_score
            scored_docs.append((doc, hybrid_score))
        
        scored_docs.sort(key=lambda x: x[1], reverse=True)
        return [doc for doc, score in scored_docs[:k]]