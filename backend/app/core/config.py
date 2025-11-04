from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./jansetu.db"
    
    # JWT
    # NOTE: For development you can keep a default secret so the app starts without an
    # .env file. Change/remove this default in production and set JWT_SECRET via env.
    JWT_SECRET: str = "dev-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # App
    APP_NAME: str = "JanSetu"
    DEBUG: bool = True
    API_URL: str = "http://localhost:8000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
