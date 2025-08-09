# AI Resume Analysis System

A production-ready AI-powered resume analysis system that extracts expertise and identifies strong zones from uploaded resumes.

## 🚀 Features

- **Resume Upload**: Support for PDF files with drag-and-drop interface
- **AI Analysis**: Uses DeepSeek LLM for intelligent resume parsing and analysis
- **Vector Database**: Qdrant for storing and retrieving resume embeddings
- **Dashboard**: Interactive dashboard to view analysis history and compare resumes
- **API**: FastAPI backend with automatic documentation
- **Frontend**: Modern React.js interface with beautiful UI

## 🏗️ Architecture

```
├── backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Configuration and utilities
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   ├── requirements.txt    # Python dependencies
│   └── main.py            # FastAPI application entry point
├── frontend/               # React.js frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Helper functions
│   ├── package.json        # Node.js dependencies
│   └── public/             # Static assets
├── docker-compose.yml      # Docker setup for easy deployment
└── README.md              # This file
```

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **DeepSeek**: Advanced LLM for resume analysis
- **Qdrant**: Vector database for similarity search
- **PyPDF2**: PDF text extraction
- **Pydantic**: Data validation and serialization

### Frontend
- **React.js**: Modern UI library
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls
- **React Router**: Client-side routing
- **React Dropzone**: File upload component

## 🚀 Quick Start

### Option 1: Docker Setup (Recommended)

#### Prerequisites
- Docker and Docker Compose installed
- DeepSeek API key

#### 1. Clone and Setup
```bash
git clone <repository-url>
cd ai-resume-analysis
```

#### 2. Configure Environment
```bash
# Copy the setup script and run it
chmod +x setup.sh
./setup.sh
```

#### 3. Update API Key
Edit the `.env` file and add your DeepSeek API key:
```bash
DEEPSEEK_API_KEY=your_actual_deepseek_api_key_here
```

#### 4. Start Services
```bash
docker-compose up -d
```

#### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Option 2: Manual Setup

#### Prerequisites
- Python 3.8+
- Node.js 16+
- DeepSeek API key

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp env.example .env
# Edit .env and add your DeepSeek API key

# Start backend
uvicorn main:app --reload
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```

#### 3. Start Qdrant (Optional)
```bash
docker run -p 6333:6333 qdrant/qdrant:latest
```

## 📖 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```
DEEPSEEK_API_KEY=your_deepseek_api_key
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION_NAME=resumes
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
```

## 📝 Usage

1. **Upload Resume**: Drag and drop or select a PDF resume file
2. **AI Analysis**: The system automatically processes the resume using DeepSeek LLM
3. **View Results**: See expertise areas and strong zones in both structured and natural language formats
4. **Dashboard**: Access analysis history and compare multiple resumes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 