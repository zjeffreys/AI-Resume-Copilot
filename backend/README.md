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

### POST /extract-resume-text
Extract text from uploaded resume file.

**Parameters:**
- `file`: Upload file (PDF or DOCX)

**Response:**
```json
{
  "filename": "resume.pdf",
  "file_type": "pdf",
  "text_content": "Extracted text content...",
  "success": true
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
