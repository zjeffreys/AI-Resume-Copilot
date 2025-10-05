# Backend Setup Guide

## Prerequisites
- Python 3.8 or higher
- OpenAI API key

## Installation

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_actual_openai_api_key_here
   ```

3. **Run the server:**
   ```bash
   python main.py
   ```

## Environment Variables

- `OPENAI_API_KEY` (required): Your OpenAI API key
- `OPENAI_MODEL` (optional): Model to use (default: gpt-3.5-turbo)
- `OPENAI_MAX_TOKENS` (optional): Maximum tokens for responses (default: 2000)
- `OPENAI_TEMPERATURE` (optional): Response creativity (default: 0.1)

## API Endpoints

- `POST /parse-resume`: Parse uploaded resume files (PDF/DOCX)
- `POST /generate-pdf`: Generate PDF from resume data
- `POST /generate-docx`: Generate DOCX from resume data
- `POST /extract-resume-text`: Extract raw text from resume files

## Features

- **Intelligent Resume Parsing**: Uses ChatGPT to accurately extract structured data from resumes
- **Fallback Parsing**: Falls back to regex patterns if ChatGPT is unavailable
- **PDF/DOCX Generation**: Creates professional PDF and DOCX files
- **Error Handling**: Comprehensive error handling with user-friendly messages
