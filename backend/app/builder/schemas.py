from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class BuilderRoadUpdate(BaseModel):
    # Development helper: which builder is making the change (use auth in production)
    builder_unique_id: Optional[int] = None
    chief_engineer: Optional[str] = Field(default=None, max_length=200)
    date_verified: Optional[date] = None
    status: Optional[str] = None
