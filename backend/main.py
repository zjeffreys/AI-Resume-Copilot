from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import PyPDF2
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import io
import re
import json
from typing import Union, List, Dict
from pydantic import BaseModel
from openai import OpenAI
from config import Config

# Validate configuration
Config.validate_config()

# Initialize OpenAI client
try:
    openai_client = OpenAI(api_key=Config.OPENAI_API_KEY)
except Exception as e:
    print(f"Warning: OpenAI client initialization failed: {e}")
    print("Resume parsing will fall back to regex-based parsing")
    openai_client = None

app = FastAPI(title="Resume Text Extractor", version="1.0.0")

# Pydantic models for request/response
class ResumeData(BaseModel):
    name: str
    email: str
    phone: str
    summary: str
    experience: list[dict]
    education: list[dict]
    skills: list[str]
    github_profile: str = ""
    linkedin_profile: str = ""
    website: str = ""
    location: str = ""
    publications: list[dict] = []
    projects: list[dict] = []
    certifications: list[dict] = []
    languages: list[str] = []
    volunteer_experience: list[dict] = []
    awards: list[str] = []
    references: list[dict] = []

class ParsedResumeResponse(BaseModel):
    success: bool
    data: ResumeData
    message: str

class ATSAnalysisRequest(BaseModel):
    resume_data: ResumeData
    job_description: str

class ATSScore(BaseModel):
    overall_score: int  # 0-100
    keyword_match_score: int  # 0-100
    experience_relevance: int  # 0-100
    education_fit: int  # 0-100
    skills_alignment: int  # 0-100

class ATSInsight(BaseModel):
    category: str  # "strength", "weakness", "suggestion"
    title: str
    description: str
    impact: str  # "high", "medium", "low"

class ATSRecommendation(BaseModel):
    title: str
    description: str
    priority: str  # "high", "medium", "low"
    effort: str  # "easy", "moderate", "complex"

class ATSAnalysisResponse(BaseModel):
    success: bool
    score: ATSScore
    insights: list[ATSInsight]
    recommendations: list[ATSRecommendation]
    matched_keywords: list[str]
    missing_keywords: list[str]
    experience_gaps: list[str]
    strengths: list[str]
    message: str

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS["allowed_origins"],
    allow_credentials=Config.CORS["allow_credentials"],
    allow_methods=Config.CORS["allow_methods"],
    allow_headers=Config.CORS["allow_headers"],
)

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file content."""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting text from PDF: {str(e)}")

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file content."""
    try:
        doc = Document(io.BytesIO(file_content))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting text from DOCX: {str(e)}")

def parse_resume_with_chatgpt(text: str) -> ResumeData:
    """Parse extracted text into structured resume data using ChatGPT."""
    try:
        # Check if OpenAI client is available
        if openai_client is None:
            raise Exception("OpenAI client not initialized")
        
        # Get OpenAI configuration for resume parsing
        openai_config = Config.get_openai_config("parsing")
        
        # Create the prompt for ChatGPT
        prompt = f"""
        Parse the following resume text and extract ALL available information into a JSON format. 
        Be thorough and accurate in your extraction. If information is not available, use empty strings or empty arrays.

        Required JSON structure:
        {{
            "name": "Full name of the person",
            "email": "Email address",
            "phone": "Phone number",
            "location": "City, State/Country (if mentioned)",
            "summary": "Professional summary or objective (create a concise summary from the content if not explicitly stated)",
            "github_profile": "GitHub profile URL or username",
            "linkedin_profile": "LinkedIn profile URL",
            "website": "Personal website or portfolio URL",
            "experience": [
                {{
                    "position": "Job title",
                    "company": "Company name",
                    "duration": "Employment duration (e.g., '2020-2023' or 'Jan 2020 - Present')",
                    "description": "Job description and key achievements"
                }}
            ],
            "education": [
                {{
                    "degree": "Degree type and field",
                    "institution": "School/University name",
                    "year": "Graduation year",
                    "gpa": "GPA if mentioned",
                    "relevant_coursework": "Notable coursework if mentioned"
                }}
            ],
            "projects": [
                {{
                    "name": "Project name",
                    "description": "Project description",
                    "technologies": "Technologies used",
                    "url": "Project URL if mentioned",
                    "duration": "Project duration if mentioned"
                }}
            ],
            "publications": [
                {{
                    "title": "Publication title",
                    "journal": "Journal or conference name",
                    "year": "Publication year",
                    "authors": "Authors (include the person if they are an author)",
                    "url": "Publication URL if mentioned"
                }}
            ],
            "certifications": [
                {{
                    "name": "Certification name",
                    "issuer": "Certifying organization",
                    "year": "Year obtained",
                    "expiry": "Expiry date if mentioned"
                }}
            ],
            "volunteer_experience": [
                {{
                    "position": "Volunteer position",
                    "organization": "Organization name",
                    "duration": "Duration of volunteer work",
                    "description": "Description of volunteer activities"
                }}
            ],
            "awards": ["List of awards, honors, or recognitions"],
            "languages": ["List of languages and proficiency levels"],
            "references": [
                {{
                    "name": "Reference name",
                    "title": "Reference title/position",
                    "company": "Reference company",
                    "contact": "Contact information if provided"
                }}
            ],
            "skills": ["List of technical and professional skills"]
        }}

        Resume text:
        {text}

        IMPORTANT: Extract ALL information that is present. Look for:
        - Social media profiles (GitHub, LinkedIn, Twitter, etc.)
        - Personal websites or portfolios
        - Location information
        - Projects with descriptions and technologies
        - Publications, papers, or research
        - Certifications and licenses
        - Volunteer work
        - Awards and honors
        - Languages spoken
        - References
        - Any other relevant professional information

        Return only the JSON object, no additional text or formatting.
        """

        # Call OpenAI API
        response = openai_client.chat.completions.create(
            model=openai_config["model"],
            messages=[
                {"role": "system", "content": "You are an expert resume parser. Extract information accurately and return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=openai_config["max_tokens"],
            temperature=openai_config["temperature"]
        )

        # Extract the response content
        response_text = response.choices[0].message.content.strip()
        
        # Clean up the response (remove any markdown formatting)
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        # Parse the JSON response
        parsed_data = json.loads(response_text)
        
        # Validate and create ResumeData object
        return ResumeData(
            name=parsed_data.get("name", "Resume Owner"),
            email=parsed_data.get("email", ""),
            phone=parsed_data.get("phone", ""),
            location=parsed_data.get("location", ""),
            summary=parsed_data.get("summary", "Professional with relevant experience and skills."),
            github_profile=parsed_data.get("github_profile", ""),
            linkedin_profile=parsed_data.get("linkedin_profile", ""),
            website=parsed_data.get("website", ""),
            experience=parsed_data.get("experience", []),
            education=parsed_data.get("education", []),
            skills=parsed_data.get("skills", []),
            publications=parsed_data.get("publications", []),
            projects=parsed_data.get("projects", []),
            certifications=parsed_data.get("certifications", []),
            languages=parsed_data.get("languages", []),
            volunteer_experience=parsed_data.get("volunteer_experience", []),
            awards=parsed_data.get("awards", []),
            references=parsed_data.get("references", [])
        )
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse resume with ChatGPT. Please ensure your resume is well-formatted and try again.")
    except Exception as e:
        print(f"ChatGPT parsing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse resume with ChatGPT. Please check your OpenAI API key and try again.")


def analyze_resume_with_ats(resume_data: ResumeData, job_description: str) -> ATSAnalysisResponse:
    """Analyze resume against job description using ChatGPT to simulate ATS analysis."""
    try:
        # Check if OpenAI client is available
        if openai_client is None:
            raise Exception("OpenAI client not initialized")
        
        # Get OpenAI configuration for resume optimization
        openai_config = Config.get_openai_config("optimization")
        
        # Create the prompt for ATS analysis
        prompt = f"""
        You are an expert ATS (Applicant Tracking System) analyst. Analyze the following resume against the job description and provide a comprehensive assessment similar to what a real ATS would generate.

        Resume Information:
        Name: {resume_data.name}
        Email: {resume_data.email}
        Location: {resume_data.location}
        Professional Summary: {resume_data.summary}
        
        Skills: {', '.join(resume_data.skills)}
        
        Experience:
        {chr(10).join([f"- {exp['position']} at {exp['company']} ({exp['duration']}): {exp['description']}" for exp in resume_data.experience])}
        
        Education:
        {chr(10).join([f"- {edu['degree']} from {edu['institution']} ({edu['year']})" for edu in resume_data.education])}
        
        Projects:
        {chr(10).join([f"- {proj['name']}: {proj['description']} (Technologies: {proj['technologies']})" for proj in resume_data.projects])}
        
        Certifications:
        {chr(10).join([f"- {cert['name']} from {cert['issuer']} ({cert['year']})" for cert in resume_data.certifications])}
        
        Job Description:
        {job_description}

        Please provide a comprehensive ATS analysis in the following JSON format:

        {{
            "score": {{
                "overall_score": 85,
                "keyword_match_score": 78,
                "experience_relevance": 90,
                "education_fit": 88,
                "skills_alignment": 82
            }},
            "insights": [
                {{
                    "category": "strength",
                    "title": "Strong Technical Background",
                    "description": "Candidate demonstrates excellent technical skills relevant to the position",
                    "impact": "high"
                }},
                {{
                    "category": "weakness", 
                    "title": "Limited Industry Experience",
                    "description": "Candidate lacks specific experience in the target industry",
                    "impact": "medium"
                }}
            ],
            "recommendations": [
                {{
                    "title": "Add Industry-Specific Keywords",
                    "description": "Include more industry-specific terminology and technologies",
                    "priority": "high",
                    "effort": "easy"
                }}
            ],
            "matched_keywords": ["Python", "Machine Learning", "Data Analysis"],
            "missing_keywords": ["TensorFlow", "AWS", "Docker"],
            "experience_gaps": ["Cloud computing experience", "Team leadership"],
            "strengths": ["Strong technical skills", "Relevant education", "Project experience"]
        }}

        Analysis Guidelines:
        1. Score each category 0-100 based on relevance and match quality
        2. Identify specific keywords that match and are missing
        3. Highlight experience gaps that could be addressed
        4. Provide actionable recommendations with priority levels
        5. Focus on both technical and soft skills
        6. Consider industry-specific requirements
        7. Assess cultural fit and career progression potential

        Return only the JSON object, no additional text or formatting.
        """

        # Call OpenAI API
        response = openai_client.chat.completions.create(
            model=openai_config["model"],
            messages=[
                {"role": "system", "content": "You are an expert ATS analyst. Provide detailed, actionable feedback in JSON format. Be specific and practical in your recommendations."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=openai_config["max_tokens"],
            temperature=openai_config["temperature"]
        )

        # Extract the response content
        response_text = response.choices[0].message.content.strip()
        
        # Clean up the response (remove any markdown formatting)
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        # Parse the JSON response
        parsed_data = json.loads(response_text)
        
        # Create response objects
        score = ATSScore(
            overall_score=parsed_data["score"]["overall_score"],
            keyword_match_score=parsed_data["score"]["keyword_match_score"],
            experience_relevance=parsed_data["score"]["experience_relevance"],
            education_fit=parsed_data["score"]["education_fit"],
            skills_alignment=parsed_data["score"]["skills_alignment"]
        )
        
        insights = [
            ATSInsight(
                category=insight["category"],
                title=insight["title"],
                description=insight["description"],
                impact=insight["impact"]
            ) for insight in parsed_data["insights"]
        ]
        
        recommendations = [
            ATSRecommendation(
                title=rec["title"],
                description=rec["description"],
                priority=rec["priority"],
                effort=rec["effort"]
            ) for rec in parsed_data["recommendations"]
        ]
        
        return ATSAnalysisResponse(
            success=True,
            score=score,
            insights=insights,
            recommendations=recommendations,
            matched_keywords=parsed_data["matched_keywords"],
            missing_keywords=parsed_data["missing_keywords"],
            experience_gaps=parsed_data["experience_gaps"],
            strengths=parsed_data["strengths"],
            message="ATS analysis completed successfully"
        )
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse ATS analysis response")
    except Exception as e:
        print(f"ATS analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Error during ATS analysis: {str(e)}")


def generate_pdf(resume_data: ResumeData) -> bytes:
    """Generate PDF from resume data using ReportLab."""
    try:
        pdf_config = Config.PDF_GENERATION
        margins = pdf_config["margins"]
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter, 
            rightMargin=margins["right"],
            leftMargin=margins["left"],
            topMargin=margins["top"],
            bottomMargin=margins["bottom"]
        )
        
        # Get styles
        styles = getSampleStyleSheet()
        
        # Create custom styles
        fonts = pdf_config["fonts"]
        
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=1,  # Center alignment
            fontName=fonts["title"]
        )
        
        header_style = ParagraphStyle(
            'CustomHeader',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            spaceBefore=20,
            fontName=fonts["header"],
            textColor='#2c3e50'
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            fontName=fonts["body"]
        )
        
        # Build content
        story = []
        
        # Title
        story.append(Paragraph(resume_data.name.upper(), title_style))
        
        # Contact information
        contact_info = resume_data.email
        if resume_data.phone:
            contact_info += f" | {resume_data.phone}"
        if resume_data.location:
            contact_info += f" | {resume_data.location}"
        story.append(Paragraph(contact_info, normal_style))
        
        # Social profiles and website
        social_info = []
        if resume_data.github_profile:
            social_info.append(f"GitHub: {resume_data.github_profile}")
        if resume_data.linkedin_profile:
            social_info.append(f"LinkedIn: {resume_data.linkedin_profile}")
        if resume_data.website:
            social_info.append(f"Website: {resume_data.website}")
        
        if social_info:
            story.append(Paragraph(" • ".join(social_info), normal_style))
        
        story.append(Spacer(1, 20))
        
        # Professional Summary
        story.append(Paragraph("PROFESSIONAL SUMMARY", header_style))
        story.append(Paragraph(resume_data.summary, normal_style))
        story.append(Spacer(1, 12))
        
        # Technical Skills
        story.append(Paragraph("TECHNICAL SKILLS", header_style))
        story.append(Paragraph(" • ".join(resume_data.skills), normal_style))
        story.append(Spacer(1, 12))
        
        # Professional Experience
        story.append(Paragraph("PROFESSIONAL EXPERIENCE", header_style))
        for exp in resume_data.experience:
            story.append(Paragraph(f"<b>{exp['position']}</b> - {exp['company']} ({exp['duration']})", normal_style))
            story.append(Paragraph(exp['description'], normal_style))
            story.append(Spacer(1, 8))
        
        # Education
        story.append(Paragraph("EDUCATION", header_style))
        for edu in resume_data.education:
            edu_text = f"<b>{edu['degree']}</b> - {edu['institution']} ({edu['year']})"
            if edu.get('gpa'):
                edu_text += f" | GPA: {edu['gpa']}"
            story.append(Paragraph(edu_text, normal_style))
            if edu.get('relevant_coursework'):
                story.append(Paragraph(f"Relevant Coursework: {edu['relevant_coursework']}", normal_style))
        story.append(Spacer(1, 12))
        
        # Projects
        if resume_data.projects:
            story.append(Paragraph("PROJECTS", header_style))
            for project in resume_data.projects:
                project_text = f"<b>{project['name']}</b>"
                if project.get('duration'):
                    project_text += f" ({project['duration']})"
                story.append(Paragraph(project_text, normal_style))
                story.append(Paragraph(project.get('description', ''), normal_style))
                if project.get('technologies'):
                    story.append(Paragraph(f"Technologies: {project['technologies']}", normal_style))
                if project.get('url'):
                    story.append(Paragraph(f"URL: {project['url']}", normal_style))
                story.append(Spacer(1, 6))
            story.append(Spacer(1, 12))
        
        # Publications
        if resume_data.publications:
            story.append(Paragraph("PUBLICATIONS", header_style))
            for pub in resume_data.publications:
                pub_text = f"<b>{pub['title']}</b>"
                if pub.get('journal'):
                    pub_text += f" - {pub['journal']}"
                if pub.get('year'):
                    pub_text += f" ({pub['year']})"
                story.append(Paragraph(pub_text, normal_style))
                if pub.get('authors'):
                    story.append(Paragraph(f"Authors: {pub['authors']}", normal_style))
                if pub.get('url'):
                    story.append(Paragraph(f"URL: {pub['url']}", normal_style))
                story.append(Spacer(1, 6))
            story.append(Spacer(1, 12))
        
        # Certifications
        if resume_data.certifications:
            story.append(Paragraph("CERTIFICATIONS", header_style))
            for cert in resume_data.certifications:
                cert_text = f"<b>{cert['name']}</b> - {cert['issuer']}"
                if cert.get('year'):
                    cert_text += f" ({cert['year']})"
                if cert.get('expiry'):
                    cert_text += f" | Expires: {cert['expiry']}"
                story.append(Paragraph(cert_text, normal_style))
            story.append(Spacer(1, 12))
        
        # Volunteer Experience
        if resume_data.volunteer_experience:
            story.append(Paragraph("VOLUNTEER EXPERIENCE", header_style))
            for vol in resume_data.volunteer_experience:
                vol_text = f"<b>{vol['position']}</b> - {vol['organization']}"
                if vol.get('duration'):
                    vol_text += f" ({vol['duration']})"
                story.append(Paragraph(vol_text, normal_style))
                story.append(Paragraph(vol.get('description', ''), normal_style))
                story.append(Spacer(1, 6))
            story.append(Spacer(1, 12))
        
        # Awards
        if resume_data.awards:
            story.append(Paragraph("AWARDS & HONORS", header_style))
            for award in resume_data.awards:
                story.append(Paragraph(f"• {award}", normal_style))
            story.append(Spacer(1, 12))
        
        # Languages
        if resume_data.languages:
            story.append(Paragraph("LANGUAGES", header_style))
            story.append(Paragraph(" • ".join(resume_data.languages), normal_style))
            story.append(Spacer(1, 12))
        
        # References
        if resume_data.references:
            story.append(Paragraph("REFERENCES", header_style))
            for ref in resume_data.references:
                ref_text = f"<b>{ref['name']}</b>"
                if ref.get('title'):
                    ref_text += f", {ref['title']}"
                if ref.get('company'):
                    ref_text += f" at {ref['company']}"
                story.append(Paragraph(ref_text, normal_style))
                if ref.get('contact'):
                    story.append(Paragraph(ref['contact'], normal_style))
                story.append(Spacer(1, 6))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

def generate_docx(resume_data: ResumeData) -> bytes:
    """Generate DOCX from resume data using python-docx."""
    try:
        docx_config = Config.DOCX_GENERATION
        margins = docx_config["margins"]
        fonts = docx_config["fonts"]
        
        doc = Document()
        
        # Set margins
        sections = doc.sections
        for section in sections:
            section.top_margin = Inches(margins["top"])
            section.bottom_margin = Inches(margins["bottom"])
            section.left_margin = Inches(margins["left"])
            section.right_margin = Inches(margins["right"])
        
        # Title
        title = doc.add_heading(resume_data.name.upper(), 0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # Contact info
        contact_info = resume_data.email
        if resume_data.phone:
            contact_info += f" | {resume_data.phone}"
        if resume_data.location:
            contact_info += f" | {resume_data.location}"
        
        contact = doc.add_paragraph(contact_info)
        contact.alignment = WD_ALIGN_PARAGRAPH.CENTER
        contact.runs[0].font.size = Pt(fonts["contact_size"])
        
        # Social profiles and website
        if resume_data.github_profile or resume_data.linkedin_profile or resume_data.website:
            social_info = []
            if resume_data.github_profile:
                social_info.append(f"GitHub: {resume_data.github_profile}")
            if resume_data.linkedin_profile:
                social_info.append(f"LinkedIn: {resume_data.linkedin_profile}")
            if resume_data.website:
                social_info.append(f"Website: {resume_data.website}")
            
            social = doc.add_paragraph(" • ".join(social_info))
            social.alignment = WD_ALIGN_PARAGRAPH.CENTER
            social.runs[0].font.size = Pt(fonts["contact_size"])
        
        # Add spacing
        doc.add_paragraph()
        
        # Professional Summary
        doc.add_heading('PROFESSIONAL SUMMARY', level=1)
        summary_para = doc.add_paragraph(resume_data.summary)
        summary_para.runs[0].font.size = Pt(fonts["body_size"])
        
        # Technical Skills
        doc.add_heading('TECHNICAL SKILLS', level=1)
        skills_para = doc.add_paragraph(" • ".join(resume_data.skills))
        skills_para.runs[0].font.size = Pt(fonts["body_size"])
        
        # Professional Experience
        doc.add_heading('PROFESSIONAL EXPERIENCE', level=1)
        for exp in resume_data.experience:
            # Job title and company
            job_para = doc.add_paragraph()
            job_para.add_run(exp['position']).bold = True
            job_para.add_run(f" - {exp['company']} ({exp['duration']})")
            job_para.runs[0].font.size = Pt(fonts["body_size"])
            
            # Job description
            desc_para = doc.add_paragraph(exp['description'])
            desc_para.runs[0].font.size = Pt(fonts["body_size"])
            doc.add_paragraph()  # Add spacing
        
        # Education
        doc.add_heading('EDUCATION', level=1)
        for edu in resume_data.education:
            edu_para = doc.add_paragraph()
            edu_text = f"{edu['degree']} - {edu['institution']} ({edu['year']})"
            if edu.get('gpa'):
                edu_text += f" | GPA: {edu['gpa']}"
            edu_para.add_run(edu_text).bold = True
            edu_para.runs[0].font.size = Pt(fonts["body_size"])
            if edu.get('relevant_coursework'):
                coursework_para = doc.add_paragraph(f"Relevant Coursework: {edu['relevant_coursework']}")
                coursework_para.runs[0].font.size = Pt(fonts["body_size"])
        
        # Projects
        if resume_data.projects:
            doc.add_heading('PROJECTS', level=1)
            for project in resume_data.projects:
                project_para = doc.add_paragraph()
                project_text = project['name']
                if project.get('duration'):
                    project_text += f" ({project['duration']})"
                project_para.add_run(project_text).bold = True
                project_para.runs[0].font.size = Pt(fonts["body_size"])
                
                if project.get('description'):
                    desc_para = doc.add_paragraph(project['description'])
                    desc_para.runs[0].font.size = Pt(fonts["body_size"])
                
                if project.get('technologies'):
                    tech_para = doc.add_paragraph(f"Technologies: {project['technologies']}")
                    tech_para.runs[0].font.size = Pt(fonts["body_size"])
                
                if project.get('url'):
                    url_para = doc.add_paragraph(f"URL: {project['url']}")
                    url_para.runs[0].font.size = Pt(fonts["body_size"])
                
                doc.add_paragraph()  # Add spacing
        
        # Publications
        if resume_data.publications:
            doc.add_heading('PUBLICATIONS', level=1)
            for pub in resume_data.publications:
                pub_para = doc.add_paragraph()
                pub_text = pub['title']
                if pub.get('journal'):
                    pub_text += f" - {pub['journal']}"
                if pub.get('year'):
                    pub_text += f" ({pub['year']})"
                pub_para.add_run(pub_text).bold = True
                pub_para.runs[0].font.size = Pt(fonts["body_size"])
                
                if pub.get('authors'):
                    authors_para = doc.add_paragraph(f"Authors: {pub['authors']}")
                    authors_para.runs[0].font.size = Pt(fonts["body_size"])
                
                if pub.get('url'):
                    url_para = doc.add_paragraph(f"URL: {pub['url']}")
                    url_para.runs[0].font.size = Pt(fonts["body_size"])
                
                doc.add_paragraph()  # Add spacing
        
        # Certifications
        if resume_data.certifications:
            doc.add_heading('CERTIFICATIONS', level=1)
            for cert in resume_data.certifications:
                cert_para = doc.add_paragraph()
                cert_text = f"{cert['name']} - {cert['issuer']}"
                if cert.get('year'):
                    cert_text += f" ({cert['year']})"
                if cert.get('expiry'):
                    cert_text += f" | Expires: {cert['expiry']}"
                cert_para.add_run(cert_text).bold = True
                cert_para.runs[0].font.size = Pt(fonts["body_size"])
        
        # Volunteer Experience
        if resume_data.volunteer_experience:
            doc.add_heading('VOLUNTEER EXPERIENCE', level=1)
            for vol in resume_data.volunteer_experience:
                vol_para = doc.add_paragraph()
                vol_text = f"{vol['position']} - {vol['organization']}"
                if vol.get('duration'):
                    vol_text += f" ({vol['duration']})"
                vol_para.add_run(vol_text).bold = True
                vol_para.runs[0].font.size = Pt(fonts["body_size"])
                
                if vol.get('description'):
                    desc_para = doc.add_paragraph(vol['description'])
                    desc_para.runs[0].font.size = Pt(fonts["body_size"])
                
                doc.add_paragraph()  # Add spacing
        
        # Awards
        if resume_data.awards:
            doc.add_heading('AWARDS & HONORS', level=1)
            for award in resume_data.awards:
                award_para = doc.add_paragraph(f"• {award}")
                award_para.runs[0].font.size = Pt(fonts["body_size"])
        
        # Languages
        if resume_data.languages:
            doc.add_heading('LANGUAGES', level=1)
            lang_para = doc.add_paragraph(" • ".join(resume_data.languages))
            lang_para.runs[0].font.size = Pt(fonts["body_size"])
        
        # References
        if resume_data.references:
            doc.add_heading('REFERENCES', level=1)
            for ref in resume_data.references:
                ref_para = doc.add_paragraph()
                ref_text = ref['name']
                if ref.get('title'):
                    ref_text += f", {ref['title']}"
                if ref.get('company'):
                    ref_text += f" at {ref['company']}"
                ref_para.add_run(ref_text).bold = True
                ref_para.runs[0].font.size = Pt(fonts["body_size"])
                
                if ref.get('contact'):
                    contact_para = doc.add_paragraph(ref['contact'])
                    contact_para.runs[0].font.size = Pt(fonts["body_size"])
                
                doc.add_paragraph()  # Add spacing
        
        # Save to bytes
        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        return buffer.getvalue()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating DOCX: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Resume Text Extractor API is running"}

@app.post("/extract-resume-text")
async def extract_resume_text(file: UploadFile = File(...)):
    """
    Extract text content from uploaded resume file.
    Supports PDF and DOCX formats.
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_extension = file.filename.lower().split('.')[-1]
    
    if file_extension not in ['pdf', 'docx']:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported file type. Please upload a PDF or DOCX file."
        )
    
    # Read file content
    try:
        file_content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    # Extract text based on file type
    try:
        if file_extension == 'pdf':
            extracted_text = extract_text_from_pdf(file_content)
        elif file_extension == 'docx':
            extracted_text = extract_text_from_docx(file_content)
        
        return {
            "filename": file.filename,
            "file_type": file_extension,
            "text_content": extracted_text,
            "success": True
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/parse-resume", response_model=ParsedResumeResponse)
async def parse_resume(file: UploadFile = File(...)):
    """
    Parse uploaded resume file and return structured data.
    Supports PDF and DOCX formats.
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_extension = file.filename.lower().split('.')[-1]
    
    if file_extension not in ['pdf', 'docx']:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported file type. Please upload a PDF or DOCX file."
        )
    
    # Read file content
    try:
        file_content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    # Extract text based on file type
    try:
        if file_extension == 'pdf':
            extracted_text = extract_text_from_pdf(file_content)
        elif file_extension == 'docx':
            extracted_text = extract_text_from_docx(file_content)
        
        # Parse the extracted text into structured data using ChatGPT
        if openai_client is None:
            raise HTTPException(
                status_code=503, 
                detail="Resume parsing service is currently unavailable. Please ensure OpenAI API key is configured and try again later."
            )
        
        parsed_data = parse_resume_with_chatgpt(extracted_text)
        
        return ParsedResumeResponse(
            success=True,
            data=parsed_data,
            message="Resume parsed successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")

@app.post("/generate-pdf")
async def generate_pdf_endpoint(resume_data: ResumeData):
    """
    Generate PDF from resume data.
    """
    try:
        pdf_content = generate_pdf(resume_data)
        
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={resume_data.name.replace(' ', '_')}_resume.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@app.post("/generate-docx")
async def generate_docx_endpoint(resume_data: ResumeData):
    """
    Generate DOCX from resume data.
    """
    try:
        docx_content = generate_docx(resume_data)
        
        return StreamingResponse(
            io.BytesIO(docx_content),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={resume_data.name.replace(' ', '_')}_resume.docx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating DOCX: {str(e)}")

@app.post("/analyze-ats", response_model=ATSAnalysisResponse)
async def analyze_ats(request: ATSAnalysisRequest):
    """
    Analyze resume against job description using ChatGPT to simulate ATS analysis.
    Returns comprehensive scoring, insights, and recommendations.
    """
    try:
        if not request.job_description.strip():
            raise HTTPException(status_code=400, detail="Job description cannot be empty")
        
        if not request.resume_data:
            raise HTTPException(status_code=400, detail="Resume data is required")
        
        # Perform ATS analysis
        analysis_result = analyze_resume_with_ats(request.resume_data, request.job_description)
        
        return analysis_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during ATS analysis: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    server_config = Config.SERVER
    uvicorn.run(
        app, 
        host=server_config["host"], 
        port=server_config["port"],
        debug=server_config["debug"]
    )
