# Resume Text Extractor Backend

A simple FastAPI backend service that extracts text content from PDF and DOCX resume files.

## Features

- Extract text from PDF files
- Extract text from DOCX files
- RESTful API with automatic documentation
- CORS enabled for frontend integration
- Error handling for unsupported file types and processing errors

## Installation

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Interactive API docs: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## API Endpoints

### GET /
Health check endpoint.

### POST /parse-resume
Parse uploaded resume file and return structured data.

**Parameters:**
- `file`: Upload file (PDF or DOCX)

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-234-567-8900",
    "location": "New York, NY",
    "summary": "Experienced software engineer...",
    "experience": [...],
    "education": [...],
    "skills": [...]
  },
  "message": "Resume parsed successfully"
}
```

### POST /analyze-ats
Analyze resume against job description using ATS simulation.

**Parameters:**
- `resume_data`: Structured resume data
- `job_description`: Job description text

**Response:**
```json
{
  "success": true,
  "score": {
    "overall_score": 85,
    "keyword_match_score": 78,
    "experience_relevance": 90,
    "education_fit": 88,
    "skills_alignment": 82
  },
  "insights": [...],
  "recommendations": [...],
  "matched_keywords": [...],
  "missing_keywords": [...],
  "experience_gaps": [...],
  "strengths": [...],
  "message": "ATS analysis completed successfully"
}
```

## Supported File Types

- PDF (.pdf)
- Microsoft Word (.docx)

## Error Handling

The API returns appropriate HTTP status codes and error messages for:
- Unsupported file types
- File reading errors
- Text extraction errors
- Server errors
