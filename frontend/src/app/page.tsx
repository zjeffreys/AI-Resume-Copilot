'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Download, Target, Sparkles } from 'lucide-react';

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  github_profile: string;
  linkedin_profile: string;
  website: string;
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
    gpa?: string;
    relevant_coursework?: string;
  }>;
  skills: string[];
  publications: Array<{
    title: string;
    journal: string;
    year: string;
    authors: string;
    url?: string;
  }>;
  projects: Array<{
    name: string;
    description: string[];
    technologies: string;
    url?: string;
    duration?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    year: string;
    expiry?: string;
  }>;
  languages: string[];
  volunteer_experience: Array<{
    position: string;
    organization: string;
    duration: string;
    description: string[];
  }>;
  awards: string[];
  references: Array<{
    name: string;
    title: string;
    company: string;
    contact: string;
  }>;
}

interface ATSScore {
  overall_score: number;
  keyword_match_score: number;
  experience_relevance: number;
  education_fit: number;
  skills_alignment: number;
}

interface ATSInsight {
  category: string;
  title: string;
  description: string;
  impact: string;
}

interface ATSRecommendation {
  title: string;
  description: string;
  priority: string;
  effort: string;
}

interface ATSAnalysisResponse {
  success: boolean;
  score: ATSScore;
  insights: ATSInsight[];
  recommendations: ATSRecommendation[];
  matched_keywords: string[];
  missing_keywords: string[];
  experience_gaps: string[];
  strengths: string[];
  message: string;
}

export default function Home() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [optimizedResume, setOptimizedResume] = useState<string>('');
  const [atsAnalysis, setAtsAnalysis] = useState<ATSAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'display'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'docx'].includes(fileExtension || '')) {
      alert('Please upload a PDF or DOCX file.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Call the backend parsing API
      const response = await fetch('http://localhost:8000/parse-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to parse resume';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // If we can't parse the error response, use default message
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.success) {
        setResumeData(result.data);
        setActiveTab('display');
      } else {
        throw new Error(result.message || 'Failed to parse resume');
      }
    } catch (error) {
      console.error('Error parsing resume:', error);
      
      // Get error message from error object
      let errorMessage = 'Failed to parse resume. Please try again or check if the file is a valid resume.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`Resume parsing failed: ${errorMessage}`);
      
      // Clear any existing resume data on error
      setResumeData(null);
      
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeWithATS = async () => {
    if (!resumeData || !jobDescription) {
      alert('Please upload a resume and provide a job description first.');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch('http://localhost:8000/analyze-ats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_data: resumeData,
          job_description: jobDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze resume with ATS');
      }

      const result = await response.json();
      setAtsAnalysis(result);
    } catch (error) {
      console.error('Error analyzing resume with ATS:', error);
      alert('Failed to analyze resume with ATS. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
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
    }, 3000);
  };

  const generateResumeText = (data: ResumeData) => {
    let resumeText = `${data.name.toUpperCase()}\n`;
    
    // Contact information
    resumeText += data.email;
    if (data.phone) resumeText += ` | ${data.phone}`;
    if (data.location) resumeText += ` | ${data.location}`;
    resumeText += '\n';
    
    // Social profiles
    if (data.github_profile || data.linkedin_profile || data.website) {
      const social = [];
      if (data.github_profile) social.push(`GitHub: ${data.github_profile}`);
      if (data.linkedin_profile) social.push(`LinkedIn: ${data.linkedin_profile}`);
      if (data.website) social.push(`Website: ${data.website}`);
      resumeText += social.join(' • ') + '\n';
    }
    
    resumeText += '\nPROFESSIONAL SUMMARY\n';
    resumeText += `${data.summary}\n\n`;
    
    resumeText += `TECHNICAL SKILLS\n`;
    resumeText += `${data.skills.join(' • ')}\n\n`;
    
    resumeText += `PROFESSIONAL EXPERIENCE\n`;
    data.experience.forEach(exp => {
      resumeText += `${exp.position} | ${exp.company} | ${exp.duration}\n`;
      exp.description.forEach(bullet => {
        resumeText += `• ${bullet}\n`;
      });
      resumeText += `\n`;
    });
    
    resumeText += `EDUCATION\n`;
    data.education.forEach(edu => {
      resumeText += `${edu.degree} | ${edu.institution} | ${edu.year}`;
      if (edu.gpa) resumeText += ` | GPA: ${edu.gpa}`;
      resumeText += '\n';
      if (edu.relevant_coursework) resumeText += `Relevant Coursework: ${edu.relevant_coursework}\n`;
    });
    
    // Projects
    if (data.projects && data.projects.length > 0) {
      resumeText += '\nPROJECTS\n';
      data.projects.forEach(project => {
        resumeText += `${project.name}`;
        if (project.duration) resumeText += ` (${project.duration})`;
        resumeText += '\n';
        project.description.forEach(bullet => {
          resumeText += `• ${bullet}\n`;
        });
        resumeText += `Technologies: ${project.technologies}\n`;
        if (project.url) resumeText += `URL: ${project.url}\n`;
        resumeText += '\n';
      });
    }
    
    // Publications
    if (data.publications && data.publications.length > 0) {
      resumeText += '\nPUBLICATIONS\n';
      data.publications.forEach(pub => {
        resumeText += `${pub.title} - ${pub.journal} (${pub.year})\n`;
        resumeText += `Authors: ${pub.authors}\n`;
        if (pub.url) resumeText += `URL: ${pub.url}\n`;
        resumeText += '\n';
      });
    }
    
    // Certifications
    if (data.certifications && data.certifications.length > 0) {
      resumeText += '\nCERTIFICATIONS\n';
      data.certifications.forEach(cert => {
        resumeText += `${cert.name} - ${cert.issuer} (${cert.year})`;
        if (cert.expiry) resumeText += ` | Expires: ${cert.expiry}`;
        resumeText += '\n';
      });
    }
    
    // Volunteer Experience
    if (data.volunteer_experience && data.volunteer_experience.length > 0) {
      resumeText += '\nVOLUNTEER EXPERIENCE\n';
      data.volunteer_experience.forEach(vol => {
        resumeText += `${vol.position} - ${vol.organization} (${vol.duration})\n`;
        vol.description.forEach(bullet => {
          resumeText += `• ${bullet}\n`;
        });
        resumeText += `\n`;
      });
    }
    
    // Awards
    if (data.awards && data.awards.length > 0) {
      resumeText += '\nAWARDS & HONORS\n';
      data.awards.forEach(award => {
        resumeText += `• ${award}\n`;
      });
    }
    
    // Languages
    if (data.languages && data.languages.length > 0) {
      resumeText += '\nLANGUAGES\n';
      resumeText += data.languages.join(' • ') + '\n';
    }
    
    // References
    if (data.references && data.references.length > 0) {
      resumeText += '\nREFERENCES\n';
      data.references.forEach(ref => {
        resumeText += `${ref.name}, ${ref.title} at ${ref.company}\n`;
        resumeText += `${ref.contact}\n\n`;
      });
    }
    
    return resumeText;
  };

  const downloadAsPDF = async (data: ResumeData) => {
    try {
      const response = await fetch('http://localhost:8000/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.name.replace(' ', '_')}_resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const downloadAsDOCX = async (data: ResumeData) => {
    try {
      const response = await fetch('http://localhost:8000/generate-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate DOCX');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.name.replace(' ', '_')}_resume.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading DOCX:', error);
      alert('Failed to generate DOCX. Please try again.');
    }
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Resume Copilot
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Upload your resume, get insights, and optimize it for each job application with AI-powered suggestions.
          </p>
        </div>

        {/* Two Panel Layout */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Panel - Resume Area */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FileText className="w-6 h-6 mr-2" />
                  Resume
                </h2>
                {resumeData && (
                  <button
                    onClick={() => setActiveTab(activeTab === 'display' ? 'upload' : 'display')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
                  >
                    {activeTab === 'display' ? <Upload className="w-4 h-4 mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                    {activeTab === 'display' ? 'Upload New' : 'View Resume'}
                  </button>
                )}
              </div>

              {activeTab === 'upload' || !resumeData ? (
                <div className="text-center">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 hover:border-blue-500 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Upload Your Resume
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Upload your PDF or DOCX resume and we&apos;ll automatically extract and populate your information
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx"
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
              ) : (
                <div className="bg-white dark:bg-gray-50 p-8 rounded-lg shadow-sm border">
                  {/* Download Buttons */}
                  <div className="flex justify-end gap-3 mb-4">
                    <button
                      onClick={() => {
                        const resumeText = generateResumeText(resumeData);
                        const element = document.createElement('a');
                        const file = new Blob([resumeText], { type: 'text/plain' });
                        element.href = URL.createObjectURL(file);
                        element.download = `${resumeData.name.replace(' ', '-')}-resume.txt`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      TXT
                    </button>
                    <button
                      onClick={() => downloadAsPDF(resumeData)}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </button>
                    <button
                      onClick={() => downloadAsDOCX(resumeData)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      DOCX
                    </button>
                  </div>

                  {/* Header */}
                  <div className="text-center mb-8 border-b border-gray-200 dark:border-gray-300 pb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900 mb-3">{resumeData.name.toUpperCase()}</h1>
                    <div className="text-gray-700 dark:text-gray-700 text-lg">
                      <div className="flex justify-center items-center gap-2 flex-wrap">
                        {resumeData.location && <span>{resumeData.location}</span>}
                        {resumeData.location && resumeData.phone && <span>•</span>}
                        {resumeData.phone && <span>{resumeData.phone}</span>}
                        {resumeData.phone && resumeData.email && <span>•</span>}
                        {resumeData.email && <span>{resumeData.email}</span>}
                        {resumeData.email && resumeData.linkedin_profile && <span>•</span>}
                        {resumeData.linkedin_profile && (
                          <a href={resumeData.linkedin_profile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            {resumeData.linkedin_profile}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Professional Summary */}
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-900 mb-3 border-b border-gray-900 dark:border-gray-900 pb-1 uppercase tracking-wide">
                      SUMMARY
                    </h2>
                    <p className="text-gray-800 dark:text-gray-800 leading-relaxed">
                      {resumeData.summary}
                    </p>
                  </div>

                  {/* Skills & Other */}
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-900 mb-3 border-b border-gray-900 dark:border-gray-900 pb-1 uppercase tracking-wide">
                      SKILLS & OTHER
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <span className="font-bold text-gray-900 dark:text-gray-900">Skills: </span>
                        <span className="text-gray-800 dark:text-gray-800">{resumeData.skills.join(', ')}</span>
                      </div>
                      {resumeData.volunteer_experience && resumeData.volunteer_experience.length > 0 && (
                        <div>
                          <span className="font-bold text-gray-900 dark:text-gray-900">Volunteering: </span>
                          <span className="text-gray-800 dark:text-gray-800">
                            {resumeData.volunteer_experience.map(vol => 
                              `${vol.position} at ${vol.organization} (${vol.duration})`
                            ).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-900 mb-3 border-b border-gray-900 dark:border-gray-900 pb-1 uppercase tracking-wide">
                      PROFESSIONAL EXPERIENCE
                    </h2>
                    <div className="space-y-6">
                      {resumeData.experience.map((exp, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <span className="font-bold text-gray-900 dark:text-gray-900">{exp.company}</span>
                              <span className="text-gray-800 dark:text-gray-800 ml-1">{resumeData.location}</span>
                            </div>
                            <span className="text-gray-700 dark:text-gray-700 font-medium">{exp.duration}</span>
                          </div>
                          <p className="text-gray-800 dark:text-gray-800 mb-2 ml-4">{exp.position}</p>
                          <ul className="text-gray-800 dark:text-gray-800 leading-relaxed list-disc list-inside ml-4">
                            {exp.description.map((bullet, bulletIndex) => (
                              <li key={bulletIndex} className="mb-1">{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-900 mb-3 border-b border-gray-900 dark:border-gray-900 pb-1 uppercase tracking-wide">
                      EDUCATION
                    </h2>
                    <div className="space-y-4">
                      {resumeData.education.map((edu, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <span className="font-bold text-gray-900 dark:text-gray-900">{edu.institution}</span>
                              <span className="text-gray-800 dark:text-gray-800 ml-1">{resumeData.location}</span>
                            </div>
                            <span className="text-gray-700 dark:text-gray-700 font-medium">{edu.year}</span>
                          </div>
                          <p className="text-gray-800 dark:text-gray-800 mb-2 ml-4">{edu.degree}</p>
                          {(edu.gpa || edu.relevant_coursework) && (
                            <ul className="text-gray-800 dark:text-gray-800 leading-relaxed list-disc list-inside ml-4">
                              {edu.gpa && <li className="mb-1">Awards: {edu.gpa}</li>}
                              {edu.relevant_coursework && <li className="mb-1">{edu.relevant_coursework}</li>}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>


                  {/* Projects (including Publications) */}
                  {(resumeData.projects && resumeData.projects.length > 0) || (resumeData.publications && resumeData.publications.length > 0) ? (
                    <div className="mb-8">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-900 mb-3 border-b border-gray-900 dark:border-gray-900 pb-1 uppercase tracking-wide">
                        PROJECTS
                      </h2>
                      <div className="space-y-4">
                        {/* Regular Projects with corresponding publications */}
                        {resumeData.projects && resumeData.projects.map((project, index) => {
                          // Check if there's a corresponding publication for this project
                          const correspondingPub = resumeData.publications?.find(pub => 
                            pub.title.toLowerCase() === project.name.toLowerCase()
                          );
                          
                          return (
                            <div key={index}>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-base font-bold text-gray-900 dark:text-gray-900">{project.name}</h3>
                                <span className="text-gray-700 dark:text-gray-700 text-sm">{project.duration}</span>
                              </div>
                              <ul className="list-disc list-inside space-y-1 ml-4">
                                {project.description.map((bullet, bulletIndex) => (
                                  <li key={bulletIndex} className="text-gray-800 dark:text-gray-800 text-sm">
                                    {bullet}
                                  </li>
                                ))}
                                {/* Add publication details if found */}
                                {correspondingPub && (
                                  <>
                                    {correspondingPub.journal && (
                                      <li className="text-gray-800 dark:text-gray-800 text-sm">
                                        Published in: {correspondingPub.journal} ({correspondingPub.year})
                                      </li>
                                    )}
                                  </>
                                )}
                              </ul>
                              <div className="ml-4 mt-2">
                                {project.url && (
                                  <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm mr-4">
                                    View Project →
                                  </a>
                                )}
                                {correspondingPub?.url && (
                                  <a href={correspondingPub.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                                    View Publication →
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Standalone Publications (those without corresponding projects) */}
                        {resumeData.publications && resumeData.publications
                          .filter(pub => !resumeData.projects?.some(project => 
                            project.name.toLowerCase() === pub.title.toLowerCase()
                          ))
                          .map((pub, index) => (
                            <div key={`pub-${index}`}>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-base font-bold text-gray-900 dark:text-gray-900">{pub.title} (Publication)</h3>
                                <span className="text-gray-700 dark:text-gray-700 text-sm">{pub.year}</span>
                              </div>
                              <p className="text-gray-800 dark:text-gray-800 text-sm mb-1">{pub.journal}</p>
                              {pub.url && (
                                <a href={pub.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                                  View Publication →
                                </a>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Certifications */}
                  {resumeData.certifications && resumeData.certifications.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-900 mb-3 border-b-2 border-gray-300 dark:border-gray-400 pb-1">
                        CERTIFICATIONS
                      </h2>
                      <div className="space-y-2">
                        {resumeData.certifications.map((cert, index) => (
                          <div key={index}>
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-900">{cert.name}</h3>
                              <span className="text-gray-700 dark:text-gray-700 font-medium">{cert.year}</span>
                            </div>
                            <p className="text-gray-800 dark:text-gray-800">{cert.issuer}</p>
                            {cert.expiry && <p className="text-gray-700 dark:text-gray-700 text-sm">Expires: {cert.expiry}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}


                  {/* Awards */}
                  {resumeData.awards && resumeData.awards.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-900 mb-3 border-b-2 border-gray-300 dark:border-gray-400 pb-1">
                        AWARDS & HONORS
                      </h2>
                      <div className="space-y-1">
                        {resumeData.awards.map((award, index) => (
                          <p key={index} className="text-gray-800 dark:text-gray-800">• {award}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {resumeData.languages && resumeData.languages.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-900 mb-3 border-b-2 border-gray-300 dark:border-gray-400 pb-1">
                        LANGUAGES
                      </h2>
                      <p className="text-gray-800 dark:text-gray-800">{resumeData.languages.join(' • ')}</p>
                    </div>
                  )}

                  {/* References */}
                  {resumeData.references && resumeData.references.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-900 mb-3 border-b-2 border-gray-300 dark:border-gray-400 pb-1">
                        REFERENCES
                      </h2>
                      <div className="space-y-3">
                        {resumeData.references.map((ref, index) => (
                          <div key={index}>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-900">{ref.name}</h3>
                            <p className="text-gray-800 dark:text-gray-800">{ref.title} at {ref.company}</p>
                            <p className="text-gray-700 dark:text-gray-700 text-sm">{ref.contact}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Optimized Resume Display */}
            {optimizedResume && (
              <div className="bg-white dark:bg-gray-50 rounded-xl shadow-lg p-6 border">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-900">
                    Optimized Resume
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={downloadResume}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center text-sm"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      TXT
                    </button>
                    <button
                      onClick={() => {
                        // Create a mock resume data for optimized resume
                        const optimizedData = { ...resumeData! };
                        downloadAsPDF(optimizedData);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center text-sm"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </button>
                    <button
                      onClick={() => {
                        // Create a mock resume data for optimized resume
                        const optimizedData = { ...resumeData! };
                        downloadAsDOCX(optimizedData);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors flex items-center text-sm"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      DOCX
                    </button>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-50 p-6 rounded-lg border max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-900 font-mono leading-relaxed">
                    {optimizedResume}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Job Description */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Target className="w-6 h-6 mr-2" />
                Job Description
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Paste the job description here
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Copy and paste the job description from the job posting..."
                    className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <button
                  onClick={analyzeWithATS}
                  disabled={!resumeData || !jobDescription.trim() || isAnalyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center mb-3"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing with ATS...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Analyze Resume with ATS
                    </>
                  )}
                </button>

                <button
                  onClick={optimizeResume}
                  disabled={!resumeData || !jobDescription.trim() || isProcessing}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Optimizing Resume...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Optimize Resume for This Job
                    </>
                  )}
                </button>
              </div>

              {/* ATS Analysis Results */}
              {atsAnalysis && (
                <div className="mt-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Target className="w-5 h-5 mr-2" />
                        ATS Analysis Results
                      </h3>
                      <button
                        onClick={() => setAtsAnalysis(null)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Overall Score */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Overall ATS Score</h4>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            atsAnalysis.score.overall_score >= 90 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : atsAnalysis.score.overall_score >= 80
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              : atsAnalysis.score.overall_score >= 70
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {atsAnalysis.score.overall_score >= 90 ? 'Excellent' : 
                             atsAnalysis.score.overall_score >= 80 ? 'Very Good' : 
                             atsAnalysis.score.overall_score >= 70 ? 'Good' : 'Needs Improvement'}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div className={`text-center p-3 rounded-lg border ${
                            atsAnalysis.score.overall_score >= 90 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : atsAnalysis.score.overall_score >= 80
                              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                              : atsAnalysis.score.overall_score >= 70
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          }`}>
                            <div className={`text-2xl font-bold ${
                              atsAnalysis.score.overall_score >= 90 
                                ? 'text-green-600 dark:text-green-400'
                                : atsAnalysis.score.overall_score >= 80
                                ? 'text-orange-600 dark:text-orange-400'
                                : atsAnalysis.score.overall_score >= 70
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>{atsAnalysis.score.overall_score}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Overall</div>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${
                            atsAnalysis.score.keyword_match_score >= 90 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : atsAnalysis.score.keyword_match_score >= 80
                              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                              : atsAnalysis.score.keyword_match_score >= 70
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          }`}>
                            <div className={`text-2xl font-bold ${
                              atsAnalysis.score.keyword_match_score >= 90 
                                ? 'text-green-600 dark:text-green-400'
                                : atsAnalysis.score.keyword_match_score >= 80
                                ? 'text-orange-600 dark:text-orange-400'
                                : atsAnalysis.score.keyword_match_score >= 70
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>{atsAnalysis.score.keyword_match_score}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Keywords</div>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${
                            atsAnalysis.score.experience_relevance >= 90 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : atsAnalysis.score.experience_relevance >= 80
                              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                              : atsAnalysis.score.experience_relevance >= 70
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          }`}>
                            <div className={`text-2xl font-bold ${
                              atsAnalysis.score.experience_relevance >= 90 
                                ? 'text-green-600 dark:text-green-400'
                                : atsAnalysis.score.experience_relevance >= 80
                                ? 'text-orange-600 dark:text-orange-400'
                                : atsAnalysis.score.experience_relevance >= 70
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>{atsAnalysis.score.experience_relevance}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Experience</div>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${
                            atsAnalysis.score.education_fit >= 90 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : atsAnalysis.score.education_fit >= 80
                              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                              : atsAnalysis.score.education_fit >= 70
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          }`}>
                            <div className={`text-2xl font-bold ${
                              atsAnalysis.score.education_fit >= 90 
                                ? 'text-green-600 dark:text-green-400'
                                : atsAnalysis.score.education_fit >= 80
                                ? 'text-orange-600 dark:text-orange-400'
                                : atsAnalysis.score.education_fit >= 70
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>{atsAnalysis.score.education_fit}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Education</div>
                          </div>
                          <div className={`text-center p-3 rounded-lg border ${
                            atsAnalysis.score.skills_alignment >= 90 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : atsAnalysis.score.skills_alignment >= 80
                              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                              : atsAnalysis.score.skills_alignment >= 70
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          }`}>
                            <div className={`text-2xl font-bold ${
                              atsAnalysis.score.skills_alignment >= 90 
                                ? 'text-green-600 dark:text-green-400'
                                : atsAnalysis.score.skills_alignment >= 80
                                ? 'text-orange-600 dark:text-orange-400'
                                : atsAnalysis.score.skills_alignment >= 70
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>{atsAnalysis.score.skills_alignment}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Skills</div>
                          </div>
                        </div>
                      </div>

                      {/* Keywords Analysis */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                          <div className="flex items-center mb-2">
                            <div className="bg-green-500 rounded-full p-1 mr-2">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <h4 className="text-sm font-semibold text-green-700 dark:text-green-300">
                              Matched ({atsAnalysis.matched_keywords.length})
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {atsAnalysis.matched_keywords.map((keyword, index) => (
                              <span key={index} className="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs font-medium">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-200 dark:border-red-800">
                          <div className="flex items-center mb-2">
                            <div className="bg-red-500 rounded-full p-1 mr-2">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <h4 className="text-sm font-semibold text-red-700 dark:text-red-300">
                              Missing ({atsAnalysis.missing_keywords.length})
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {atsAnalysis.missing_keywords.map((keyword, index) => (
                              <span key={index} className="bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded text-xs font-medium">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Top Insights */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Key Insights</h4>
                        <div className="space-y-3">
                          {atsAnalysis.insights.slice(0, 3).map((insight, index) => (
                            <div key={index} className={`p-3 rounded-lg border-l-4 ${
                              insight.category === 'strength' 
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                                : insight.category === 'weakness'
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="font-semibold text-gray-900 dark:text-white text-sm">{insight.title}</h5>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  insight.impact === 'high' 
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    : insight.impact === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                  {insight.impact} impact
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm">{insight.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Recommendations */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Top Recommendations</h4>
                        <div className="space-y-3">
                          {atsAnalysis.recommendations.slice(0, 2).map((rec, index) => (
                            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="font-semibold text-gray-900 dark:text-white text-sm">{rec.title}</h5>
                                <div className="flex gap-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    rec.priority === 'high' 
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                      : rec.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  }`}>
                                    {rec.priority}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    rec.effort === 'easy' 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : rec.effort === 'moderate'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    {rec.effort}
                                  </span>
                                </div>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm">{rec.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>


        {/* Footer */}
        <div className="text-center mt-12 text-gray-600 dark:text-gray-400">
          <p>AI Resume Copilot - Optimize your resume for every job application</p>
        </div>
      </div>
    </div>
  );
}