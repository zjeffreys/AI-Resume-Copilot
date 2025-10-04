'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Download, Edit3, Target, Sparkles } from 'lucide-react';

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  skills: string[];
}

export default function Home() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [optimizedResume, setOptimizedResume] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'display' | 'optimize'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simulate resume parsing (in a real app, you'd use an API)
    setIsProcessing(true);
    setTimeout(() => {
      // Mock resume data
      const mockResumeData: ResumeData = {
        name: "John Doe",
        email: "john.doe@email.com",
        phone: "(555) 123-4567",
        summary: "Experienced software engineer with 5+ years in full-stack development, specializing in React, Node.js, and cloud technologies. Passionate about building scalable applications and leading technical teams.",
        experience: [
          {
            company: "Tech Corp",
            position: "Senior Software Engineer",
            duration: "2022 - Present",
            description: "Led development of microservices architecture serving 1M+ users. Implemented CI/CD pipelines and mentored junior developers."
          },
          {
            company: "StartupXYZ",
            position: "Full Stack Developer",
            duration: "2020 - 2022",
            description: "Built responsive web applications using React and Node.js. Collaborated with cross-functional teams to deliver features on time."
          }
        ],
        education: [
          {
            institution: "University of Technology",
            degree: "Bachelor of Science in Computer Science",
            year: "2020"
          }
        ],
        skills: ["React", "Node.js", "TypeScript", "AWS", "Docker", "MongoDB", "Git"]
      };
      
      setResumeData(mockResumeData);
      setIsProcessing(false);
      setActiveTab('display');
    }, 2000);
  };

  const optimizeResume = () => {
    if (!resumeData || !jobDescription) return;
    
    setIsProcessing(true);
    setTimeout(() => {
      // Mock optimization logic
      const optimized = `OPTIMIZED RESUME FOR TARGET POSITION

${resumeData.name}
${resumeData.email} | ${resumeData.phone}

PROFESSIONAL SUMMARY
${resumeData.summary}

KEY ACHIEVEMENTS
• Led development of microservices architecture serving 1M+ users
• Implemented CI/CD pipelines reducing deployment time by 60%
• Mentored 3 junior developers, improving team productivity by 40%

TECHNICAL SKILLS
${resumeData.skills.join(' • ')}

PROFESSIONAL EXPERIENCE

Senior Software Engineer | Tech Corp | 2022 - Present
• Architected and developed scalable microservices using Node.js and React
• Led a team of 5 developers in building high-performance applications
• Implemented automated testing and deployment pipelines
• Reduced system response time by 50% through optimization

Full Stack Developer | StartupXYZ | 2020 - 2022
• Developed responsive web applications serving 100K+ daily users
• Collaborated with product and design teams to deliver user-centric features
• Implemented real-time data processing using WebSocket technologies

EDUCATION
${resumeData.education[0].degree} | ${resumeData.education[0].institution} | ${resumeData.education[0].year}

OPTIMIZATION NOTES:
- Emphasized leadership and team management skills
- Highlighted quantifiable achievements with metrics
- Reordered skills to match job requirements
- Enhanced action verbs for stronger impact`;

      setOptimizedResume(optimized);
      setIsProcessing(false);
      setActiveTab('optimize');
    }, 3000);
  };

  const downloadResume = () => {
    const element = document.createElement('a');
    const file = new Blob([optimizedResume], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'optimized-resume.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Resume Copilot
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Upload your resume, get insights, and optimize it for each job application with AI-powered suggestions.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
              }`}
            >
              <Upload className="inline w-4 h-4 mr-2" />
              Upload Resume
            </button>
            <button
              onClick={() => setActiveTab('display')}
              disabled={!resumeData}
              className={`px-6 py-3 rounded-md font-medium transition-all ml-1 ${
                activeTab === 'display'
                  ? 'bg-blue-600 text-white shadow-md'
                  : resumeData
                  ? 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <FileText className="inline w-4 h-4 mr-2" />
              View Resume
            </button>
            <button
              onClick={() => setActiveTab('optimize')}
              disabled={!resumeData}
              className={`px-6 py-3 rounded-md font-medium transition-all ml-1 ${
                activeTab === 'optimize'
                  ? 'bg-blue-600 text-white shadow-md'
                  : resumeData
                  ? 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <Target className="inline w-4 h-4 mr-2" />
              Optimize
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'upload' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="text-center">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 hover:border-blue-500 transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Upload Your Resume
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Supported formats: PDF, DOC, DOCX, TXT
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                  >
                    {isProcessing ? 'Processing...' : 'Choose File'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'display' && resumeData && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Resume Information
                </h2>
                <button
                  onClick={() => setActiveTab('optimize')}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Optimize for Job
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Info</h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {resumeData.name}</p>
                    <p><strong>Email:</strong> {resumeData.email}</p>
                    <p><strong>Phone:</strong> {resumeData.phone}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Professional Summary</h3>
                <p className="text-gray-700 dark:text-gray-300">{resumeData.summary}</p>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Experience</h3>
                <div className="space-y-4">
                  {resumeData.experience.map((exp, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{exp.position}</h4>
                      <p className="text-gray-600 dark:text-gray-400">{exp.company} • {exp.duration}</p>
                      <p className="text-gray-700 dark:text-gray-300 mt-2">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Education</h3>
                <div className="space-y-2">
                  {resumeData.education.map((edu, index) => (
                    <div key={index}>
                      <p className="font-semibold text-gray-900 dark:text-white">{edu.degree}</p>
                      <p className="text-gray-600 dark:text-gray-400">{edu.institution} • {edu.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'optimize' && resumeData && (
            <div className="space-y-6">
              {/* Job Description Input */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Job Description
                </h3>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here to optimize your resume..."
                  className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={optimizeResume}
                  disabled={!jobDescription.trim() || isProcessing}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Optimize Resume
                    </>
                  )}
                </button>
              </div>

              {/* Optimized Resume Display */}
              {optimizedResume && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Optimized Resume
                    </h3>
                    <button
                      onClick={downloadResume}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                      {optimizedResume}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600 dark:text-gray-400">
          <p>AI Resume Copilot - Optimize your resume for every job application</p>
        </div>
      </div>
    </div>
  );
}