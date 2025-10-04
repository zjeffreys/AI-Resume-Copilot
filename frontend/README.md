# AI Resume Copilot - Frontend

A Next.js application that helps users format and optimize their resumes for specific job applications using AI-powered suggestions.

## Features

- **Resume Upload**: Upload resume files in various formats (PDF, DOC, DOCX, TXT)
- **Resume Parsing**: Automatically extract and display resume information
- **Job-Specific Optimization**: Optimize resume content based on job descriptions
- **Modern UI**: Clean, responsive design with dark mode support
- **Download Optimized Resume**: Export the optimized resume as a text file

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Upload Resume**: Click "Choose File" to upload your resume
2. **View Resume**: Review the parsed resume information
3. **Optimize**: Paste a job description and click "Optimize Resume"
4. **Download**: Download the optimized resume for your application

## Technology Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Hooks** - State management

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main application page
└── components/          # Reusable components (future)
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding Features

The application is structured to easily add new features:

- Resume parsing can be enhanced with real API integration
- Additional optimization algorithms can be added
- More resume formats can be supported
- Export options can be expanded (PDF, DOCX, etc.)

## Future Enhancements

- Real AI integration for resume optimization
- Multiple resume templates
- ATS-friendly formatting
- Resume scoring and feedback
- Integration with job boards
- User accounts and resume storage