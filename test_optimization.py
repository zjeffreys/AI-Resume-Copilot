#!/usr/bin/env python3
"""
Simple test script to verify the optimization endpoint works.
Run this after starting the backend server.
"""

import requests
import json

def test_optimization_endpoint():
    """Test the optimization endpoint with sample data."""
    
    # Sample resume data
    resume_data = {
        "name": "John Doe",
        "email": "john.doe@email.com",
        "phone": "555-1234",
        "location": "San Francisco, CA",
        "summary": "Experienced software engineer with 5 years of experience in web development.",
        "skills": ["Python", "JavaScript", "React", "Node.js"],
        "experience": [
            {
                "position": "Software Engineer",
                "company": "Tech Corp",
                "duration": "2020-2023",
                "description": [
                    "Developed web applications using React and Node.js",
                    "Collaborated with cross-functional teams",
                    "Improved application performance by 30%"
                ]
            }
        ],
        "education": [
            {
                "degree": "Bachelor of Science in Computer Science",
                "institution": "University of California",
                "year": "2020",
                "gpa": "3.8",
                "relevant_coursework": "Data Structures, Algorithms, Software Engineering"
            }
        ],
        "projects": [],
        "publications": [],
        "certifications": [],
        "languages": [],
        "volunteer_experience": [],
        "awards": [],
        "references": [],
        "github_profile": "",
        "linkedin_profile": "",
        "website": ""
    }
    
    # Sample job description
    job_description = """
    We are looking for a Senior Software Engineer with expertise in:
    - Python and JavaScript development
    - React and Node.js frameworks
    - Cloud technologies (AWS, Azure)
    - Team leadership and mentoring
    - Agile development methodologies
    
    Requirements:
    - 5+ years of software development experience
    - Strong problem-solving skills
    - Experience with microservices architecture
    - Bachelor's degree in Computer Science or related field
    """
    
    # Test data for optimization request
    test_request = {
        "resume_data": resume_data,
        "job_description": job_description,
        "section": "summary",
        "section_data": resume_data["summary"],
        "custom_prompt": "Make the summary more focused on leadership and cloud technologies"
    }
    
    try:
        print("Testing optimization endpoint...")
        print(f"Optimizing section: {test_request['section']}")
        print(f"Custom prompt: {test_request['custom_prompt']}")
        print()
        
        response = requests.post(
            "http://localhost:8000/optimize-section",
            json=test_request,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Optimization successful!")
            print(f"Explanation: {result['explanation']}")
            print(f"Changes made: {result['changes_made']}")
            print(f"Optimized section: {result['optimized_section']}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to backend server.")
        print("Make sure the backend is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_optimization_endpoint()
