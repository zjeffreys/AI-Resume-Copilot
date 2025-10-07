import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Application configuration settings."""
    
    # OpenAI Configuration
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    
    # Resume Parsing Configuration
    RESUME_PARSING = {
        "model": "gpt-4.1-mini",
        "max_tokens": 2000,
        "temperature": 0.1
    }
    
    # Resume Optimization Configuration (for future use)
    RESUME_OPTIMIZATION = {
        "model": "gpt-4",  # More powerful model for optimization
        "max_tokens": 3000,
        "temperature": 0.3  # Slightly more creative for optimization
    }
    
    # PDF Generation Configuration
    PDF_GENERATION = {
        "page_size": "letter",
        "margins": {
            "top": 72,
            "bottom": 18,
            "left": 72,
            "right": 72
        },
        "fonts": {
            "title": "Helvetica-Bold",
            "header": "Helvetica-Bold",
            "body": "Helvetica"
        }
    }
    
    # DOCX Generation Configuration
    DOCX_GENERATION = {
        "margins": {
            "top": 1,  # inches
            "bottom": 1,
            "left": 1,
            "right": 1
        },
        "fonts": {
            "title_size": 18,  # points
            "contact_size": 12,
            "body_size": 11
        }
    }
    
    # Server Configuration
    SERVER = {
        "host": "0.0.0.0",
        "port": 8000,
        "debug": False
    }
    
    # CORS Configuration
    CORS = {
        # "allowed_origins": os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
        "allowed_origins": ["*"], # Allow all origins for now todo: Remove this
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"]
    }
    
    # File Upload Configuration
    UPLOAD = {
        "max_file_size": 10 * 1024 * 1024,  # 10MB
        "allowed_extensions": [".pdf", ".docx"],
        "temp_dir": "temp_uploads"
    }
    
    @classmethod
    def get_openai_config(cls, functionality="parsing"):
        """Get OpenAI configuration for specific functionality."""
        config_map = {
            "parsing": cls.RESUME_PARSING,
            "optimization": cls.RESUME_OPTIMIZATION
        }
        return config_map.get(functionality, cls.RESUME_PARSING)
    
    @classmethod
    def validate_config(cls):
        """Validate that required configuration is present."""
        if not cls.OPENAI_API_KEY:
            print("Warning: OPENAI_API_KEY not found in environment variables")
            print("ChatGPT features will be disabled. Resume parsing will use fallback method.")
        return True
