'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, FileText, Download, Target, Edit2, Save, X, Info, Trash2 } from 'lucide-react';

// API URL configuration - reads from environment variable or defaults to localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

interface SectionOptimizationResponse {
  success: boolean;
  optimized_section: Record<string, unknown>;
  explanation: string;
  changes_made: string[];
  message: string;
}

type EditingDataType = string | string[] | ResumeData[keyof ResumeData] | null;
type SectionDataType = string | string[] | unknown[] | null;

export default function Home() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [atsAnalysis, setAtsAnalysis] = useState<ATSAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'display'>('upload');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingDataType>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Optimization state
  const [optimizingSection, setOptimizingSection] = useState<string | null>(null);
  const [optimizingItemIndex, setOptimizingItemIndex] = useState<number | null>(null); // For individual item optimization
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<SectionOptimizationResponse | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [showATSInfoModal, setShowATSInfoModal] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const [previousSectionData, setPreviousSectionData] = useState<SectionDataType>(null);
  const [bulkOptimizationProgress, setBulkOptimizationProgress] = useState<{current: number, total: number} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });


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
      const response = await fetch(`${API_URL}/parse-resume`, {
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
      const response = await fetch(`${API_URL}/analyze-ats`, {
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

  const startEditing = (section: string, data: EditingDataType) => {
    setEditingSection(section);
    setEditingData(data);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditingData(null);
  };

  const saveEditing = () => {
    if (!resumeData || !editingSection || !editingData) return;

    const updatedResumeData = { ...resumeData };
    
    switch (editingSection) {
      case 'summary':
        updatedResumeData.summary = editingData;
        break;
      case 'skills':
        // Convert string to array when saving
        updatedResumeData.skills = typeof editingData === 'string' 
          ? editingData.split(',').map(s => s.trim()).filter(s => s)
          : editingData;
        break;
      case 'experience':
        // Process experience data to handle description strings
        const processedExperience = (editingData as ResumeData['experience']).map((exp) => ({
          ...exp,
          description: typeof exp.description === 'string' 
            ? exp.description.split('\n').filter((line: string) => line.trim())
            : exp.description
        }));
        updatedResumeData.experience = processedExperience;
        break;
      case 'education':
        updatedResumeData.education = editingData;
        break;
      case 'projects':
        // Process projects data to handle description strings
        const processedProjects = (editingData as ResumeData['projects']).map((project) => ({
          ...project,
          description: typeof project.description === 'string' 
            ? project.description.split('\n').filter((line: string) => line.trim())
            : project.description
        }));
        updatedResumeData.projects = processedProjects;
        break;
      case 'publications':
        updatedResumeData.publications = editingData;
        break;
      case 'certifications':
        updatedResumeData.certifications = editingData;
        break;
      case 'volunteer_experience':
        updatedResumeData.volunteer_experience = editingData;
        break;
      case 'awards':
        // Convert string to array when saving
        updatedResumeData.awards = typeof editingData === 'string' 
          ? editingData.split('\n').filter(line => line.trim())
          : editingData;
        break;
      case 'languages':
        // Convert string to array when saving
        updatedResumeData.languages = typeof editingData === 'string' 
          ? editingData.split(',').map(s => s.trim()).filter(s => s)
          : editingData;
        break;
      case 'references':
        updatedResumeData.references = editingData;
        break;
      case 'contact':
        updatedResumeData.name = editingData.name;
        updatedResumeData.email = editingData.email;
        updatedResumeData.phone = editingData.phone;
        updatedResumeData.location = editingData.location;
        updatedResumeData.github_profile = editingData.github_profile;
        updatedResumeData.linkedin_profile = editingData.linkedin_profile;
        updatedResumeData.website = editingData.website;
        break;
    }

    setResumeData(updatedResumeData);
    setEditingSection(null);
    setEditingData(null);
  };

  const startOptimization = (section: string, event: React.MouseEvent<HTMLButtonElement>, itemIndex?: number) => {
    if (!resumeData) return;
    
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Position popup so its top-left corner touches the top-right corner of the button
    setPopupPosition({
      top: rect.top,
      left: rect.right, // No gap - corner touching
    });
    
    // Store current section data for undo
    const currentData = resumeData[section as keyof ResumeData];
    setPreviousSectionData(currentData);
    
    setOptimizingSection(section);
    setOptimizingItemIndex(itemIndex ?? null);
    setCustomPrompt('');
    setOptimizationResult(null);
    setShowOptimizationModal(true);
  };

  const startBulkOptimization = (section: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!resumeData) return;
    
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Position popup so its top-left corner touches the top-right corner of the button
    setPopupPosition({
      top: rect.top,
      left: rect.right,
    });
    
    // Store current section data for undo
    const currentData = resumeData[section as keyof ResumeData];
    setPreviousSectionData(currentData);
    
    setOptimizingSection(section);
    setOptimizingItemIndex(null);
    setCustomPrompt('');
    setOptimizationResult(null);
    setShowOptimizationModal(true);
  };

  const cancelOptimization = () => {
    setOptimizingSection(null);
    setOptimizingItemIndex(null);
    setCustomPrompt('');
    setOptimizationResult(null);
    setShowOptimizationModal(false);
    setPreviousSectionData(null);
    setBulkOptimizationProgress(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (popupPosition && !isDragging) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - popupPosition.left,
        y: e.clientY - popupPosition.top,
      });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && popupPosition) {
      setPopupPosition({
        left: e.clientX - dragOffset.x,
        top: e.clientY - dragOffset.y,
      });
    }
  }, [isDragging, popupPosition, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const optimizeSection = async () => {
    if (!resumeData || !jobDescription || !optimizingSection) {
      alert('Please upload a resume and provide a job description first.');
      return;
    }

    // Check if this is bulk optimization
    const isBulkOptimization = optimizingItemIndex === null && 
      ['experience', 'education', 'projects', 'publications', 'certifications', 'volunteer_experience', 'references'].includes(optimizingSection);

    if (isBulkOptimization) {
      await optimizeBulkSection();
      return;
    }

    setIsOptimizing(true);
    
    try {
      // Get current section data and wrap in appropriate format for backend (expects dict)
      let sectionData: Record<string, unknown>;
      
      switch (optimizingSection) {
        case 'summary':
          // Wrap string in object for backend
          sectionData = { content: resumeData.summary };
          break;
        case 'skills':
          // Wrap array in object for backend
          sectionData = { skills: resumeData.skills };
          break;
        case 'experience':
          // For individual experience item
          if (optimizingItemIndex !== null) {
            sectionData = { experience: [resumeData.experience[optimizingItemIndex]] };
          } else {
            sectionData = { experience: resumeData.experience };
          }
          break;
        case 'education':
          if (optimizingItemIndex !== null) {
            sectionData = { education: [resumeData.education[optimizingItemIndex]] };
          } else {
            sectionData = { education: resumeData.education };
          }
          break;
        case 'projects':
          if (optimizingItemIndex !== null) {
            sectionData = { projects: [resumeData.projects[optimizingItemIndex]] };
          } else {
            sectionData = { projects: resumeData.projects };
          }
          break;
        case 'publications':
          if (optimizingItemIndex !== null) {
            sectionData = { publications: [resumeData.publications[optimizingItemIndex]] };
          } else {
            sectionData = { publications: resumeData.publications };
          }
          break;
        case 'certifications':
          if (optimizingItemIndex !== null) {
            sectionData = { certifications: [resumeData.certifications[optimizingItemIndex]] };
          } else {
            sectionData = { certifications: resumeData.certifications };
          }
          break;
        case 'volunteer_experience':
          if (optimizingItemIndex !== null) {
            sectionData = { volunteer_experience: [resumeData.volunteer_experience[optimizingItemIndex]] };
          } else {
            sectionData = { volunteer_experience: resumeData.volunteer_experience };
          }
          break;
        case 'awards':
          // Wrap array in object for backend
          sectionData = { awards: resumeData.awards };
          break;
        case 'languages':
          // Wrap array in object for backend
          sectionData = { languages: resumeData.languages };
          break;
        case 'references':
          if (optimizingItemIndex !== null) {
            sectionData = { references: [resumeData.references[optimizingItemIndex]] };
          } else {
            sectionData = { references: resumeData.references };
          }
          break;
        default:
          throw new Error('Invalid section');
      }

      const response = await fetch(`${API_URL}/optimize-section`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_data: resumeData,
          job_description: jobDescription,
          section: optimizingSection,
          section_data: sectionData,
          custom_prompt: customPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize section');
      }

      const result = await response.json();
      setOptimizationResult(result);
      
      // Auto-apply the optimization
      applyOptimizationWithResult(result, optimizingItemIndex);
    } catch (error) {
      console.error('Error optimizing section:', error);
      alert('Failed to optimize section. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const optimizeBulkSection = async () => {
    if (!resumeData || !jobDescription || !optimizingSection) return;
    
    setIsOptimizing(true);
    const sectionArray = resumeData[optimizingSection as keyof ResumeData] as unknown[];
    
    if (!Array.isArray(sectionArray)) {
      setIsOptimizing(false);
      return;
    }

    const totalItems = sectionArray.length;
    const optimizedItems: unknown[] = [];
    const allChanges: string[] = [];

    try {
      for (let i = 0; i < totalItems; i++) {
        setBulkOptimizationProgress({ current: i + 1, total: totalItems });
        
        let sectionData: Record<string, unknown>;
        switch (optimizingSection) {
          case 'experience':
            sectionData = { experience: [sectionArray[i]] };
            break;
          case 'education':
            sectionData = { education: [sectionArray[i]] };
            break;
          case 'projects':
            sectionData = { projects: [sectionArray[i]] };
            break;
          case 'publications':
            sectionData = { publications: [sectionArray[i]] };
            break;
          case 'certifications':
            sectionData = { certifications: [sectionArray[i]] };
            break;
          case 'volunteer_experience':
            sectionData = { volunteer_experience: [sectionArray[i]] };
            break;
          case 'references':
            sectionData = { references: [sectionArray[i]] };
            break;
          default:
            continue;
        }

        const response = await fetch(`${API_URL}/optimize-section`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resume_data: resumeData,
            job_description: jobDescription,
            section: optimizingSection,
            section_data: sectionData,
            custom_prompt: customPrompt,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const optimizedItem = result.optimized_section[optimizingSection][0];
          optimizedItems.push(optimizedItem);
          allChanges.push(...result.changes_made.map((change: string) => `Item ${i + 1}: ${change}`));
        } else {
          optimizedItems.push(sectionArray[i]); // Keep original on error
        }
      }

      // Apply all optimizations at once
      const updatedResumeData = { ...resumeData };
      (updatedResumeData as Record<string, unknown>)[optimizingSection] = optimizedItems;
      setResumeData(updatedResumeData);

      // Set combined results
      const combinedResult: SectionOptimizationResponse = {
        success: true,
        optimized_section: { [optimizingSection]: optimizedItems },
        explanation: `Optimized all ${totalItems} items for the job description`,
        changes_made: allChanges,
        message: 'Bulk optimization complete'
      };
      setOptimizationResult(combinedResult);

    } catch (error) {
      console.error('Error during bulk optimization:', error);
      alert('Failed to complete bulk optimization. Some items may have been optimized.');
    } finally {
      setIsOptimizing(false);
      setBulkOptimizationProgress(null);
    }
  };

  const applyOptimizationWithResult = (result: SectionOptimizationResponse, itemIndex: number | null = null) => {
    if (!resumeData || !optimizingSection) return;

    const updatedResumeData = { ...resumeData };
    
    switch (optimizingSection) {
      case 'summary':
        // Unwrap from object format
        updatedResumeData.summary = result.optimized_section.content || result.optimized_section;
        break;
      case 'skills':
        // Unwrap from object format
        updatedResumeData.skills = result.optimized_section.skills || result.optimized_section;
        break;
      case 'experience':
        // Unwrap from object format
        if (itemIndex !== null && result.optimized_section.experience) {
          updatedResumeData.experience[itemIndex] = result.optimized_section.experience[0];
        } else {
          updatedResumeData.experience = result.optimized_section.experience || result.optimized_section;
        }
        break;
      case 'education':
        // Unwrap from object format
        if (itemIndex !== null && result.optimized_section.education) {
          updatedResumeData.education[itemIndex] = result.optimized_section.education[0];
        } else {
          updatedResumeData.education = result.optimized_section.education || result.optimized_section;
        }
        break;
      case 'projects':
        // Unwrap from object format
        if (itemIndex !== null && result.optimized_section.projects) {
          updatedResumeData.projects[itemIndex] = result.optimized_section.projects[0];
        } else {
          updatedResumeData.projects = result.optimized_section.projects || result.optimized_section;
        }
        break;
      case 'publications':
        // Unwrap from object format
        if (itemIndex !== null && result.optimized_section.publications) {
          updatedResumeData.publications[itemIndex] = result.optimized_section.publications[0];
        } else {
          updatedResumeData.publications = result.optimized_section.publications || result.optimized_section;
        }
        break;
      case 'certifications':
        // Unwrap from object format
        if (itemIndex !== null && result.optimized_section.certifications) {
          updatedResumeData.certifications[itemIndex] = result.optimized_section.certifications[0];
        } else {
          updatedResumeData.certifications = result.optimized_section.certifications || result.optimized_section;
        }
        break;
      case 'volunteer_experience':
        // Unwrap from object format
        if (itemIndex !== null && result.optimized_section.volunteer_experience) {
          updatedResumeData.volunteer_experience[itemIndex] = result.optimized_section.volunteer_experience[0];
        } else {
          updatedResumeData.volunteer_experience = result.optimized_section.volunteer_experience || result.optimized_section;
        }
        break;
      case 'awards':
        // Unwrap from object format
        updatedResumeData.awards = result.optimized_section.awards || result.optimized_section;
        break;
      case 'languages':
        // Unwrap from object format
        updatedResumeData.languages = result.optimized_section.languages || result.optimized_section;
        break;
      case 'references':
        // Unwrap from object format
        if (itemIndex !== null && result.optimized_section.references) {
          updatedResumeData.references[itemIndex] = result.optimized_section.references[0];
        } else {
          updatedResumeData.references = result.optimized_section.references || result.optimized_section;
        }
        break;
    }

    setResumeData(updatedResumeData);
  };

  const undoOptimization = () => {
    if (!resumeData || !optimizingSection || !previousSectionData) return;

    const updatedResumeData = { ...resumeData };
    
    // Restore previous data
    switch (optimizingSection) {
      case 'summary':
        updatedResumeData.summary = previousSectionData as string;
        break;
      case 'skills':
        updatedResumeData.skills = previousSectionData as string[];
        break;
      case 'experience':
        updatedResumeData.experience = previousSectionData as ResumeData['experience'];
        break;
      case 'education':
        updatedResumeData.education = previousSectionData as ResumeData['education'];
        break;
      case 'projects':
        updatedResumeData.projects = previousSectionData as ResumeData['projects'];
        break;
      case 'publications':
        updatedResumeData.publications = previousSectionData as ResumeData['publications'];
        break;
      case 'certifications':
        updatedResumeData.certifications = previousSectionData as ResumeData['certifications'];
        break;
      case 'volunteer_experience':
        updatedResumeData.volunteer_experience = previousSectionData as ResumeData['volunteer_experience'];
        break;
      case 'awards':
        updatedResumeData.awards = previousSectionData as string[];
        break;
      case 'languages':
        updatedResumeData.languages = previousSectionData as string[];
        break;
      case 'references':
        updatedResumeData.references = previousSectionData as ResumeData['references'];
        break;
    }

    setResumeData(updatedResumeData);
    setShowOptimizationModal(false);
    setOptimizationResult(null);
    setOptimizingSection(null);
    setOptimizingItemIndex(null);
    setCustomPrompt('');
    setPreviousSectionData(null);
    setBulkOptimizationProgress(null);
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
      const response = await fetch(`${API_URL}/generate-pdf`, {
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
      const response = await fetch(`${API_URL}/generate-docx`, {
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
          
          {/* ATS Disclaimer */}
          <div className="mt-6 max-w-2xl mx-auto">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Note:</strong> This tool simulates ATS (Applicant Tracking System) behavior for educational purposes. 
                      Learn how real ATS systems work to better understand the job application process.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowATSInfoModal(true)}
                  className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors flex items-center whitespace-nowrap"
                >
                  <Info className="w-4 h-4 mr-1" />
                  Learn More
                </button>
              </div>
            </div>
          </div>
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
                    <div className="flex justify-center items-center gap-2 mb-3">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">{resumeData.name.toUpperCase()}</h1>
                      <button
                        onClick={() => startEditing('contact', {
                          name: resumeData.name,
                          email: resumeData.email,
                          phone: resumeData.phone,
                          location: resumeData.location,
                          github_profile: resumeData.github_profile,
                          linkedin_profile: resumeData.linkedin_profile,
                          website: resumeData.website
                        })}
                        className="text-gray-500 hover:text-blue-600 transition-colors"
                        title="Edit contact information"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {editingSection === 'contact' ? (
                      <div className="space-y-3 max-w-md mx-auto">
                        <input
                          type="text"
                          value={editingData.name}
                          onChange={(e) => setEditingData({...editingData, name: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                          placeholder="Full Name"
                        />
                        <input
                          type="email"
                          value={editingData.email}
                          onChange={(e) => setEditingData({...editingData, email: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                          placeholder="Email"
                        />
                        <input
                          type="text"
                          value={editingData.phone}
                          onChange={(e) => setEditingData({...editingData, phone: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                          placeholder="Phone"
                        />
                        <input
                          type="text"
                          value={editingData.location}
                          onChange={(e) => setEditingData({...editingData, location: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                          placeholder="Location"
                        />
                        <input
                          type="text"
                          value={editingData.github_profile}
                          onChange={(e) => setEditingData({...editingData, github_profile: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                          placeholder="GitHub Profile"
                        />
                        <input
                          type="text"
                          value={editingData.linkedin_profile}
                          onChange={(e) => setEditingData({...editingData, linkedin_profile: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                          placeholder="LinkedIn Profile"
                        />
                        <input
                          type="text"
                          value={editingData.website}
                          onChange={(e) => setEditingData({...editingData, website: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                          placeholder="Website"
                        />
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={saveEditing}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
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
                    )}
                  </div>

                  {/* Professional Summary */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-900 border-b border-gray-900 dark:border-gray-900 pb-1 uppercase tracking-wide">
                        SUMMARY
                      </h2>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => startOptimization('summary', e)}
                          className="text-gray-500 hover:text-green-600 transition-colors"
                          title="Optimize summary with AI"
                        >
                          <Target className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEditing('summary', resumeData.summary)}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                          title="Edit summary"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {editingSection === 'summary' ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingData}
                          onChange={(e) => setEditingData(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg h-32 resize-none text-gray-900 bg-white"
                          placeholder="Professional summary..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveEditing}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-800 dark:text-gray-800 leading-relaxed">
                        {resumeData.summary}
                      </p>
                    )}
                  </div>

                  {/* Skills */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-900 border-b border-gray-900 dark:border-gray-900 pb-1 uppercase tracking-wide">
                        SKILLS
                      </h2>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => startOptimization('skills', e)}
                          className="text-gray-500 hover:text-green-600 transition-colors"
                          title="Optimize skills with AI"
                        >
                          <Target className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEditing('skills', resumeData.skills)}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                          title="Edit skills"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {editingSection === 'skills' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma-separated)</label>
                          <textarea
                            value={Array.isArray(editingData) ? editingData.join(', ') : editingData}
                            onChange={(e) => {
                              // Keep the raw text for editing, only split when saving
                              setEditingData(e.target.value);
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg h-24 resize-none text-gray-900 bg-white"
                            placeholder="Python, JavaScript, React, Node.js..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveEditing}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
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
                    )}
                  </div>

                  {/* Experience */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-900 border-b border-gray-900 dark:border-gray-900 pb-1 uppercase tracking-wide">
                        PROFESSIONAL EXPERIENCE
                      </h2>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => startBulkOptimization('experience', e)}
                          className="text-gray-500 hover:text-green-600 transition-colors"
                          title="Optimize all experiences with AI"
                        >
                          <Target className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEditing('experience', resumeData.experience)}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                          title="Edit experience"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {editingSection === 'experience' ? (
                      <div className="space-y-4">
                        {(editingData as ResumeData['experience']).map((exp, index: number) => (
                          <div key={index} className="border border-gray-300 rounded-lg p-4 relative">
                            <button
                              onClick={() => {
                                const newData = (editingData as ResumeData['experience']).filter((_, i: number) => i !== index);
                                setEditingData(newData);
                              }}
                              className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors"
                              title="Remove this experience"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <input
                                type="text"
                                value={exp.company}
                                onChange={(e) => {
                                  const newData = [...editingData];
                                  newData[index].company = e.target.value;
                                  setEditingData(newData);
                                }}
                                className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                placeholder="Company"
                              />
                              <input
                                type="text"
                                value={exp.duration}
                                onChange={(e) => {
                                  const newData = [...editingData];
                                  newData[index].duration = e.target.value;
                                  setEditingData(newData);
                                }}
                                className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                placeholder="Duration (e.g., 2020-2023)"
                              />
                            </div>
                            <input
                              type="text"
                              value={exp.position}
                              onChange={(e) => {
                                const newData = [...editingData];
                                newData[index].position = e.target.value;
                                setEditingData(newData);
                              }}
                              className="w-full p-2 border border-gray-300 rounded-lg mb-3 text-gray-900 bg-white"
                              placeholder="Position/Title"
                            />
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Description (one per line)</label>
                              <textarea
                                value={Array.isArray(exp.description) ? exp.description.join('\n') : exp.description}
                                onChange={(e) => {
                                  const newData = [...editingData];
                                  newData[index].description = e.target.value;
                                  setEditingData(newData);
                                }}
                                className="w-full p-2 border border-gray-300 rounded-lg h-24 resize-none text-gray-900 bg-white"
                                placeholder="• Led development of key features&#10;• Improved performance by 50%&#10;• Mentored junior developers"
                              />
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const newData = [...editingData, { company: '', position: '', duration: '', description: [] }];
                              setEditingData(newData);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                          >
                            Add Experience
                          </button>
                          <button
                            onClick={saveEditing}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {resumeData.experience.map((exp, index) => (
                          <div key={index} className="relative group">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center gap-2">
                                <div>
                                  <span className="font-bold text-gray-900 dark:text-gray-900">{exp.company}</span>
                                  <span className="text-gray-800 dark:text-gray-800 ml-1">{resumeData.location}</span>
                                </div>
                                <button
                                  onClick={(e) => startOptimization('experience', e, index)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-green-600"
                                  title={`Optimize ${exp.company} role`}
                                >
                                  <Target className="w-3 h-3" />
                                </button>
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
                    )}
                  </div>

                  {/* Education */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-900 border-b border-gray-900 dark:border-gray-900 pb-1 uppercase tracking-wide">
                        EDUCATION
                      </h2>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => startOptimization('education', e)}
                          className="text-gray-500 hover:text-green-600 transition-colors"
                          title="Optimize education with AI"
                        >
                          <Target className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEditing('education', resumeData.education)}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                          title="Edit education"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {editingSection === 'education' ? (
                      <div className="space-y-4">
                        {(editingData as ResumeData['education']).map((edu, index: number) => (
                          <div key={index} className="border border-gray-300 rounded-lg p-4 relative">
                            <button
                              onClick={() => {
                                const newData = (editingData as ResumeData['education']).filter((_, i: number) => i !== index);
                                setEditingData(newData);
                              }}
                              className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors"
                              title="Remove this education"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <input
                                type="text"
                                value={edu.institution}
                                onChange={(e) => {
                                  const newData = [...editingData];
                                  newData[index].institution = e.target.value;
                                  setEditingData(newData);
                                }}
                                className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                placeholder="Institution"
                              />
                              <input
                                type="text"
                                value={edu.year}
                                onChange={(e) => {
                                  const newData = [...editingData];
                                  newData[index].year = e.target.value;
                                  setEditingData(newData);
                                }}
                                className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                placeholder="Year"
                              />
                            </div>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => {
                                const newData = [...editingData];
                                newData[index].degree = e.target.value;
                                setEditingData(newData);
                              }}
                              className="w-full p-2 border border-gray-300 rounded-lg mb-3 text-gray-900 bg-white"
                              placeholder="Degree"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={edu.gpa || ''}
                                onChange={(e) => {
                                  const newData = [...editingData];
                                  newData[index].gpa = e.target.value;
                                  setEditingData(newData);
                                }}
                                className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                placeholder="GPA/Awards"
                              />
                              <input
                                type="text"
                                value={edu.relevant_coursework || ''}
                                onChange={(e) => {
                                  const newData = [...editingData];
                                  newData[index].relevant_coursework = e.target.value;
                                  setEditingData(newData);
                                }}
                                className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                placeholder="Relevant Coursework"
                              />
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const newData = [...editingData, { institution: '', degree: '', year: '', gpa: '', relevant_coursework: '' }];
                              setEditingData(newData);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                          >
                            Add Education
                          </button>
                          <button
                            onClick={saveEditing}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
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
                    )}
                  </div>


                  {/* Projects (including Publications) */}
                  {(resumeData.projects && resumeData.projects.length > 0) || (resumeData.publications && resumeData.publications.length > 0) ? (
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-900 border-b border-gray-900 dark:border-gray-900 pb-1 uppercase tracking-wide">
                          PROJECTS
                        </h2>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => startOptimization('projects', e)}
                            className="text-gray-500 hover:text-green-600 transition-colors"
                            title="Optimize projects with AI"
                          >
                            <Target className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => startEditing('projects', resumeData.projects)}
                            className="text-gray-500 hover:text-blue-600 transition-colors"
                            title="Edit projects"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {editingSection === 'projects' ? (
                        <div className="space-y-4">
                          {(editingData as ResumeData['projects']).map((project, index: number) => (
                            <div key={index} className="border border-gray-300 rounded-lg p-4 relative">
                              <button
                                onClick={() => {
                                  const newData = (editingData as ResumeData['projects']).filter((_, i: number) => i !== index);
                                  setEditingData(newData);
                                }}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors"
                                title="Remove this project"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <input
                                  type="text"
                                  value={project.name}
                                  onChange={(e) => {
                                    const newData = [...editingData];
                                    newData[index].name = e.target.value;
                                    setEditingData(newData);
                                  }}
                                  className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                  placeholder="Project Name"
                                />
                                <input
                                  type="text"
                                  value={project.duration || ''}
                                  onChange={(e) => {
                                    const newData = [...editingData];
                                    newData[index].duration = e.target.value;
                                    setEditingData(newData);
                                  }}
                                  className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                  placeholder="Duration"
                                />
                              </div>
                              <input
                                type="text"
                                value={project.technologies || ''}
                                onChange={(e) => {
                                  const newData = [...editingData];
                                  newData[index].technologies = e.target.value;
                                  setEditingData(newData);
                                }}
                                className="w-full p-2 border border-gray-300 rounded-lg mb-3 text-gray-900 bg-white"
                                placeholder="Technologies Used"
                              />
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description (one per line)</label>
                                <textarea
                                  value={Array.isArray(project.description) ? project.description.join('\n') : project.description}
                                  onChange={(e) => {
                                    const newData = [...editingData];
                                    newData[index].description = e.target.value;
                                    setEditingData(newData);
                                  }}
                                  className="w-full p-2 border border-gray-300 rounded-lg h-24 resize-none text-gray-900 bg-white"
                                  placeholder="• Built a web application&#10;• Implemented user authentication&#10;• Deployed to cloud platform"
                                />
                              </div>
                              <input
                                type="text"
                                value={project.url || ''}
                                onChange={(e) => {
                                  const newData = [...editingData];
                                  newData[index].url = e.target.value;
                                  setEditingData(newData);
                                }}
                                className="w-full p-2 border border-gray-300 rounded-lg mt-3 text-gray-900 bg-white"
                                placeholder="Project URL"
                              />
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const newData = [...editingData, { name: '', description: [], technologies: '', url: '', duration: '' }];
                                setEditingData(newData);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                            >
                              Add Project
                            </button>
                            <button
                              onClick={saveEditing}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
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
                      )}
                    </div>
                  ) : null}

                  {/* Certifications */}
                  {resumeData.certifications && resumeData.certifications.length > 0 && (
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-900 border-b-2 border-gray-300 dark:border-gray-400 pb-1">
                          CERTIFICATIONS
                        </h2>
                        <button
                          onClick={() => startEditing('certifications', resumeData.certifications)}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                          title="Edit certifications"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {editingSection === 'certifications' ? (
                        <div className="space-y-4">
                          {(editingData as ResumeData['certifications']).map((cert, index: number) => (
                            <div key={index} className="border border-gray-300 rounded-lg p-4 relative">
                              <button
                                onClick={() => {
                                  const newData = (editingData as ResumeData['certifications']).filter((_, i: number) => i !== index);
                                  setEditingData(newData);
                                }}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors"
                                title="Remove this certification"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <input
                                  type="text"
                                  value={cert.name}
                                  onChange={(e) => {
                                    const newData = [...editingData];
                                    newData[index].name = e.target.value;
                                    setEditingData(newData);
                                  }}
                                  className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                  placeholder="Certification Name"
                                />
                                <input
                                  type="text"
                                  value={cert.year}
                                  onChange={(e) => {
                                    const newData = [...editingData];
                                    newData[index].year = e.target.value;
                                    setEditingData(newData);
                                  }}
                                  className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                  placeholder="Year"
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={cert.issuer}
                                  onChange={(e) => {
                                    const newData = [...editingData];
                                    newData[index].issuer = e.target.value;
                                    setEditingData(newData);
                                  }}
                                  className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                  placeholder="Issuing Organization"
                                />
                                <input
                                  type="text"
                                  value={cert.expiry || ''}
                                  onChange={(e) => {
                                    const newData = [...editingData];
                                    newData[index].expiry = e.target.value;
                                    setEditingData(newData);
                                  }}
                                  className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                  placeholder="Expiry Date (optional)"
                                />
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const newData = [...editingData, { name: '', issuer: '', year: '', expiry: '' }];
                                setEditingData(newData);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                            >
                              Add Certification
                            </button>
                            <button
                              onClick={saveEditing}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
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
                      )}
                    </div>
                  )}


                  {/* Awards */}
                  {resumeData.awards && resumeData.awards.length > 0 && (
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-900 border-b-2 border-gray-300 dark:border-gray-400 pb-1">
                          AWARDS & HONORS
                        </h2>
                        <button
                          onClick={() => startEditing('awards', resumeData.awards)}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                          title="Edit awards"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {editingSection === 'awards' ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Awards (one per line)</label>
                            <textarea
                              value={Array.isArray(editingData) ? editingData.join('\n') : editingData}
                              onChange={(e) => {
                                // Keep the raw text for editing, only split when saving
                                setEditingData(e.target.value);
                              }}
                              className="w-full p-3 border border-gray-300 rounded-lg h-32 resize-none text-gray-900 bg-white"
                              placeholder="• Dean's List 2020-2022&#10;• Best Project Award 2021&#10;• Outstanding Student Recognition"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={saveEditing}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {resumeData.awards.map((award, index) => (
                            <p key={index} className="text-gray-800 dark:text-gray-800">• {award}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Languages */}
                  {resumeData.languages && resumeData.languages.length > 0 && (
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-900 border-b-2 border-gray-300 dark:border-gray-400 pb-1">
                          LANGUAGES
                        </h2>
                        <button
                          onClick={() => startEditing('languages', resumeData.languages)}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                          title="Edit languages"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {editingSection === 'languages' ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Languages (comma-separated)</label>
                            <textarea
                              value={Array.isArray(editingData) ? editingData.join(', ') : editingData}
                              onChange={(e) => {
                                // Keep the raw text for editing, only split when saving
                                setEditingData(e.target.value);
                              }}
                              className="w-full p-3 border border-gray-300 rounded-lg h-24 resize-none text-gray-900 bg-white"
                              placeholder="English (Native), Spanish (Fluent), French (Conversational)"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={saveEditing}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-800 dark:text-gray-800">{resumeData.languages.join(' • ')}</p>
                      )}
                    </div>
                  )}

                  {/* References */}
                  {resumeData.references && resumeData.references.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-900 border-b-2 border-gray-300 dark:border-gray-400 pb-1">
                          REFERENCES
                        </h2>
                        <button
                          onClick={() => startEditing('references', resumeData.references)}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                          title="Edit references"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {editingSection === 'references' ? (
                        <div className="space-y-4">
                          {(editingData as ResumeData['references']).map((ref, index: number) => (
                            <div key={index} className="border border-gray-300 rounded-lg p-4 relative">
                              <button
                                onClick={() => {
                                  const newData = (editingData as ResumeData['references']).filter((_, i: number) => i !== index);
                                  setEditingData(newData);
                                }}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors"
                                title="Remove this reference"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <input
                                  type="text"
                                  value={ref.name}
                                  onChange={(e) => {
                                    const newData = [...editingData];
                                    newData[index].name = e.target.value;
                                    setEditingData(newData);
                                  }}
                                  className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                  placeholder="Reference Name"
                                />
                                <input
                                  type="text"
                                  value={ref.title}
                                  onChange={(e) => {
                                    const newData = [...editingData];
                                    newData[index].title = e.target.value;
                                    setEditingData(newData);
                                  }}
                                  className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                  placeholder="Title/Position"
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={ref.company}
                                  onChange={(e) => {
                                    const newData = [...editingData];
                                    newData[index].company = e.target.value;
                                    setEditingData(newData);
                                  }}
                                  className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                  placeholder="Company"
                                />
                                <input
                                  type="text"
                                  value={ref.contact}
                                  onChange={(e) => {
                                    const newData = [...editingData];
                                    newData[index].contact = e.target.value;
                                    setEditingData(newData);
                                  }}
                                  className="p-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                                  placeholder="Contact Information"
                                />
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const newData = [...editingData, { name: '', title: '', company: '', contact: '' }];
                                setEditingData(newData);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                            >
                              Add Reference
                            </button>
                            <button
                              onClick={saveEditing}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {resumeData.references.map((ref, index) => (
                            <div key={index}>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-900">{ref.name}</h3>
                              <p className="text-gray-800 dark:text-gray-800">{ref.title} at {ref.company}</p>
                              <p className="text-gray-700 dark:text-gray-700 text-sm">{ref.contact}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

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

        {/* Optimization Popup */}
        {showOptimizationModal && popupPosition && (
          <>
            {/* Backdrop - click to close */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={cancelOptimization}
            />
            <div 
              className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 w-80"
              style={{
                top: `${popupPosition.top}px`,
                left: `${popupPosition.left}px`,
                maxHeight: 'calc(100vh - 6rem)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div 
                className="flex justify-between items-center p-4 pb-3 cursor-move border-b border-gray-200 dark:border-gray-700"
                onMouseDown={handleMouseDown}
              >
                <h3 className="text-base font-bold text-gray-900 dark:text-white select-none">
                  {optimizingItemIndex !== null ? 'Optimize Item' : 'Optimize All'} - {optimizingSection ? optimizingSection.charAt(0).toUpperCase() + optimizingSection.slice(1) : ''}
                </h3>
                <button
                  onClick={cancelOptimization}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Custom Instructions (Optional)
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., 'Focus on leadership', 'Emphasize technical skills'"
                    className="w-full p-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={optimizeSection}
                    disabled={isOptimizing}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isOptimizing ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        {bulkOptimizationProgress ? (
                          `Optimizing ${bulkOptimizationProgress.current}/${bulkOptimizationProgress.total}...`
                        ) : (
                          'Optimizing...'
                        )}
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4" />
                        {optimizingItemIndex !== null ? 'Optimize This' : 'Optimize All'}
                      </>
                    )}
                  </button>
                  <button
                    onClick={cancelOptimization}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                {optimizationResult && (
                  <div className="mt-4 space-y-3 pb-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <h4 className="font-semibold text-sm text-green-800 dark:text-green-200 mb-1">
                        ✓ Changes Applied!
                      </h4>
                      <p className="text-green-700 dark:text-green-300 text-xs">
                        {optimizationResult.explanation}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1.5">
                        Changes Made:
                      </h4>
                      <div className="max-h-48 overflow-y-auto pr-2">
                        <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-700 dark:text-gray-300">
                          {optimizationResult.changes_made.map((change, index) => (
                            <li key={index}>{change}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={undoOptimization}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Undo Changes
                      </button>
                      <button
                        onClick={cancelOptimization}
                        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
          </>
        )}

        {/* ATS Information Modal */}
        {showATSInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  What Real ATS Actually Does
                </h3>
                <button
                  onClick={() => setShowATSInfoModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    What is an ATS?
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    An ATS is basically a searchable database + workflow management system. 
                    It&apos;s like a big filing cabinet that helps companies organize job applications.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Here&apos;s the real process:
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">Collection & Storage</h5>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          Resumes come in → ATS reads them → stores the information in a database. 
                          It&apos;s just organizing applications, not comparing them to each other. 
                          Think of it like putting all the resumes in digital folders.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">Recruiter-Driven Search (This is the key part!)</h5>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                          The ATS doesn&apos;t automatically &ldquo;choose&rdquo; candidates. Instead:
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          Recruiter logs in → Searches/filters the database like:
                        </p>
                        <ul className="text-gray-600 dark:text-gray-300 text-sm mt-2 ml-4 space-y-1">
                          <li>• &ldquo;Show me candidates with &lsquo;Python&rsquo; AND &lsquo;AWS&rsquo;&rdquo;</li>
                          <li>• &ldquo;Filter: Bachelor&apos;s degree required&rdquo;</li>
                          <li>• &ldquo;Filter: 5+ years experience&rdquo;</li>
                          <li>• &ldquo;Location: Seattle&rdquo;</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">Manual Review</h5>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          Recruiter gets a list of matching candidates → Human reads the resumes that passed filters → 
                          Human writes notes in the system → Human decides who to interview. 
                          It&apos;s always a real person making the final decision!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    💡 The Big Secret
                  </h4>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    ATS systems are just fancy filing cabinets! A human recruiter still has to search for you and read your resume. 
                    Your goal is to make sure you have the right keywords so recruiters can find you when they search.
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Important Note
                  </h4>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    This AI Resume Copilot simulates ATS behavior for educational purposes only. 
                    Real ATS systems work differently at each company, but the basic idea is always the same: 
                    it&apos;s a database that helps recruiters find the right people for the job.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowATSInfoModal(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600 dark:text-gray-400">
          <p>AI Resume Copilot - Optimize your resume for every job application</p>
        </div>
      </div>
    </div>
  );
}