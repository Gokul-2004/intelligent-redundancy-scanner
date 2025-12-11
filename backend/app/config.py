"""Configuration management - No database needed!"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_url: str = "http://localhost:3000"
    
    # CORS - Allow Apps Script and frontend
    cors_origins: list[str] = [
        "http://localhost:3000", 
        "http://localhost:5173",
        "https://script.google.com",  # Apps Script requests
        "https://*.googleusercontent.com",  # Apps Script execution URLs
        "https://script.googleusercontent.com"  # Apps Script direct requests
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
