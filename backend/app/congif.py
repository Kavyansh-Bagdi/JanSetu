from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
load_dotenv()

import os
print("🧐 CWD when loading .env:", os.getcwd())
print("🧐 Do we see a .env here?", os.path.exists(os.path.join(os.getcwd(), ".env")))

class Settings(BaseSettings):
    JWT_SECRET : str
    JWT_ALGORITHM : str
    DATABASE_URL  : str


    ACCESS_TOKEN_EXPIRE_MINUTES: int = 3  # Default token expiration time in minutes
    # Application URL for email links
    APP_URL: str = f"{os.getenv("API_URL")}/auth"

    model_config  = SettingsConfigDict(
         env_file = ".env",
         extra = "ignore"
    )


Config = Settings()
import os
from dotenv import load_dotenv
load_dotenv()
db_url = os.getenv("DATABASE_URL")
# config.set_main_option("sqlalchemy.url", db_url)
