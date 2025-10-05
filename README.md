# AI Resume Copilot 🚀

An intelligent resume optimization tool that uses AI to analyze your resume against job descriptions and provide actionable insights to help you land your dream job.

## ✨ Features

- **📄 Resume Upload**: Upload PDF or DOCX resumes with automatic parsing
- **🎯 ATS Analysis**: Get comprehensive ATS (Applicant Tracking System) analysis
- **📊 Score Breakdown**: Detailed scoring across keywords, experience, education, and skills
- **💡 Smart Insights**: AI-powered recommendations to improve your resume
- **📱 Professional Output**: Download optimized resumes in PDF, DOCX, or TXT formats
- **🔍 Keyword Analysis**: See matched vs missing keywords from job descriptions

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** - [Download here](https://www.python.org/downloads/)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/AI-Resume-Copilot.git
   cd AI-Resume-Copilot
   ```

2. **Create environment file**
   ```bash
   # Create .env file in the root directory
   touch .env
   ```

3. **Add your OpenAI API key**
   ```bash
   # Edit .env file and add your API key
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   ```

4. **Start the application**
   ```bash
   # Make the script executable and run it
   chmod +x start.sh
   ./start.sh
   ```

That's it! 🎉 The script will automatically:
- Create Python virtual environment
- Install all dependencies
- Start both frontend and backend services

## 🌐 Access the Application

Once running, open your browser and visit:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📖 How to Use

1. **Upload Your Resume**: Drag and drop or select your PDF/DOCX resume
2. **Paste Job Description**: Copy the job posting text into the right panel
3. **Analyze with ATS**: Click "Analyze Resume with ATS" to get detailed insights
4. **Review Results**: See your scores, matched/missing keywords, and recommendations
5. **Download Optimized Resume**: Use the download buttons to get your improved resume

## 🎯 ATS Analysis Features

### Score Breakdown
- **Overall Score**: Comprehensive assessment (0-100)
- **Keyword Match**: How well your resume matches job keywords
- **Experience Relevance**: Alignment with required experience
- **Education Fit**: Educational background assessment
- **Skills Alignment**: Technical and soft skills matching

### Color-Coded Results
- 🟢 **90-100**: Excellent match
- 🟠 **80-89**: Very good match
- 🟡 **70-79**: Good match
- 🔴 **Below 70**: Needs improvement

### Actionable Insights
- **Strengths**: What you're doing well
- **Weaknesses**: Areas for improvement
- **Recommendations**: Specific actions to boost your score
- **Keyword Analysis**: Missing vs matched keywords

## 🛠️ Manual Setup (Alternative)

If you prefer to set up manually:

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
AI-Resume-Copilot/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application
│   ├── config.py           # Configuration settings
│   ├── requirements.txt    # Python dependencies
│   └── venv/              # Virtual environment
├── frontend/               # Next.js frontend
│   ├── src/app/           # React components
│   ├── package.json       # Node.js dependencies
│   └── node_modules/      # Installed packages
├── .env                   # Environment variables (create this)
├── .env.example          # Environment template
├── start.sh              # One-command startup script
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
ALLOWED_ORIGINS=http://localhost:3000
```

### Backend Configuration

The backend uses `config.py` for application settings. You can customize:
- OpenAI model configurations
- Server settings
- CORS settings
- File upload limits

## 🚨 Troubleshooting

### Common Issues

**"OpenAI client initialization failed"**
- Make sure your `OPENAI_API_KEY` is set correctly in `.env`
- Verify your API key is valid and has credits

**"Port already in use"**
- Stop other services running on ports 3000 or 8000
- Or modify the ports in `start.sh`

**"Python/Node.js not found"**
- Install Python 3.8+ and Node.js 18+
- Make sure they're in your system PATH

**"Permission denied" on start.sh**
```bash
chmod +x start.sh
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/) and [Next.js](https://nextjs.org/)
- AI-powered by [OpenAI](https://openai.com/)
- UI components from [Tailwind CSS](https://tailwindcss.com/)

---

**Need help?** Open an issue on GitHub or check the [API documentation](http://localhost:8000/docs) when running locally.