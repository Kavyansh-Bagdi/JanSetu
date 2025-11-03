from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./jansetu.db"
    
    # App
    APP_NAME: str = "JanSetu"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
