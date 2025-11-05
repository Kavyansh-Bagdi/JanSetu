from pydantic import BaseModel, Field
from typing import Optional


class BuilderRoadUpdate(BaseModel):
    # Development helper: which builder is making the change (use auth in production)
    builder_unique_id: Optional[int] = None
    chief_engineer: Optional[str] = Field(default=None, max_length=200)
    status: Optional[str] = None
