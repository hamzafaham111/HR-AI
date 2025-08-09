# Embeddings & Vector Search Guide

This guide explains the embedding functionality in the AI Resume Analysis System and how to use it for intelligent candidate matching.

## 🧠 What Are Embeddings?

**Embeddings** are numerical representations of text that capture semantic meaning. They allow the system to:

- **Understand context**: "Python Developer" ≈ "Python Programmer" ≈ "Backend Developer with Python"
- **Find similar content**: Match resumes based on meaning, not just exact keywords
- **Rank candidates intelligently**: Score matches based on semantic similarity

## 🚀 How It Works

### 1. **Resume Processing**
When a resume is uploaded:
1. **Text Extraction**: PDF content is extracted
2. **AI Analysis**: OpenAI analyzes the resume content
3. **Embedding Generation**: Text is converted to a 1536-dimensional vector
4. **Vector Storage**: Embedding is stored in Qdrant vector database

### 2. **Job Matching**
When searching for candidates:
1. **Job Description**: Job requirements are converted to embedding
2. **Vector Search**: Qdrant finds similar resume embeddings
3. **Semantic Matching**: Candidates are ranked by semantic similarity
4. **Fallback**: If vector search fails, falls back to rule-based search

## 🔧 Setup Instructions

### Option 1: Docker (Recommended)

```bash
# Start Qdrant vector database
docker-compose up qdrant

# In another terminal, start the backend
cd backend
python main.py
```

### Option 2: Manual Setup

```bash
# Install Qdrant
# macOS
brew install qdrant

# Ubuntu
curl -L https://github.com/qdrant/qdrant/releases/latest/download/qdrant-x86_64-unknown-linux-gnu.tar.gz | tar xz
./qdrant

# Start the backend
cd backend
python main.py
```

### 3. Test the Setup

```bash
# Test embedding functionality
cd backend
python test_embeddings.py
```

## 📊 API Endpoints

### 1. **Semantic Search**
```http
POST /api/v1/resume-bank/semantic-search
Content-Type: application/json

{
  "query": "Python developer with React experience",
  "limit": 10,
  "score_threshold": 0.3
}
```

### 2. **Enhanced Candidate Search**
```http
POST /api/v1/resume-bank/find-candidates?use_semantic_search=true
Content-Type: application/json

{
  "title": "Senior Python Developer",
  "requirements": [
    {"skill": "Python", "level": "advanced"},
    {"skill": "React", "level": "intermediate"}
  ],
  "location": "San Francisco",
  "experience_level": "senior"
}
```

## 🎯 Usage Examples

### Frontend Integration

The frontend automatically uses semantic search when available:

```javascript
// In CreateJob.js - automatically uses semantic search
const response = await fetch('/api/v1/resume-bank/find-candidates?use_semantic_search=true', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(jobCriteria)
});

// Check search type in response
const data = await response.json();
console.log('Search type:', data.search_criteria.search_type); // 'semantic' or 'rule_based'
```

### Visual Indicators

The frontend shows search type:
- 🔍 **AI-Powered Search**: Semantic search with embeddings
- 📋 **Rule-Based Search**: Traditional keyword matching

## 🔍 Search Types Comparison

### Semantic Search (AI-Powered)
```python
# Job: "Python Developer"
# Finds: "Python Programmer", "Backend Developer", "Software Engineer with Python"
# Score: Based on semantic similarity (0.0 - 1.0)
```

### Rule-Based Search (Fallback)
```python
# Job: "Python Developer" 
# Finds: Only exact matches containing "Python"
# Score: Binary match (0 or 1)
```

## ⚙️ Configuration

### Environment Variables
```env
# OpenAI API (required for embeddings)
OPENAI_API_KEY=your-openai-api-key

# Qdrant Vector Database (optional - defaults to localhost)
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION_NAME=resumes
```

### Search Parameters
```python
# Adjustable parameters
score_threshold = 0.3  # Minimum similarity (0.0 - 1.0)
limit = 10            # Maximum results
vector_size = 1536    # OpenAI embedding dimensions
```

## 🧪 Testing

### Test Embedding Generation
```bash
cd backend
python test_embeddings.py
```

### Test Semantic Search
```bash
# Using curl
curl -X POST "http://localhost:8000/api/v1/resume-bank/semantic-search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Python developer with machine learning experience",
    "limit": 5,
    "score_threshold": 0.3
  }'
```

## 🔧 Troubleshooting

### Common Issues

1. **Qdrant Connection Failed**
   ```bash
   # Check if Qdrant is running
   curl http://localhost:6333/collections
   
   # Start Qdrant
   docker-compose up qdrant
   ```

2. **OpenAI API Error**
   ```bash
   # Check API key
   echo $OPENAI_API_KEY
   
   # Test API
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

3. **No Embeddings Generated**
   ```bash
   # Check logs
   tail -f backend/logs/app.log
   
   # Test embedding generation
   python test_embeddings.py
   ```

### Fallback Behavior

The system gracefully falls back to rule-based search if:
- Qdrant is unavailable
- OpenAI API fails
- Embedding generation fails

## 📈 Performance

### Vector Search Performance
- **Search Speed**: ~10-50ms per query
- **Storage**: ~6KB per resume embedding
- **Scalability**: Supports millions of resumes

### Memory Usage
- **Qdrant**: ~100MB base + 6KB per resume
- **Embedding Generation**: ~50MB per request

## 🔮 Future Enhancements

1. **Hybrid Search**: Combine semantic + rule-based results
2. **Custom Embeddings**: Train domain-specific models
3. **Multi-Modal**: Include image embeddings for resume layouts
4. **Real-time Updates**: Incremental embedding updates
5. **Advanced Filtering**: Filter by embedding clusters

## 📚 Technical Details

### Embedding Model
- **Model**: `text-embedding-ada-002`
- **Dimensions**: 1536
- **Max Input**: 8,000 tokens
- **Distance Metric**: Cosine similarity

### Vector Database
- **Database**: Qdrant
- **Collection**: `resumes`
- **Index Type**: HNSW (Hierarchical Navigable Small World)
- **Distance**: Cosine

### Storage Schema
```json
{
  "id": "analysis_id",
  "vector": [0.1, 0.2, ...], // 1536 dimensions
  "payload": {
    "analysis_id": "uuid",
    "filename": "resume.pdf",
    "summary": "Candidate summary",
    "expertise_count": 5,
    "strong_zones_count": 3,
    "upload_date": "2024-01-01T00:00:00Z"
  }
}
```

## 🎉 Benefits

1. **Better Matches**: Find candidates with similar skills even if keywords don't match exactly
2. **Context Understanding**: Understand job requirements semantically
3. **Scalable**: Handle large resume databases efficiently
4. **Intelligent Ranking**: Rank candidates by relevance, not just keyword frequency
5. **Future-Proof**: Easy to upgrade to newer embedding models

---

**Ready to use?** Start with `python test_embeddings.py` to verify everything is working! 