from pydantic import BaseModel, Field
from datetime import date
from typing import Optional
from decimal import Decimal


class RoadCreate(BaseModel):
    builder_id: int
    cost: Decimal = Field(default=0)
    started_date: date
    ended_date: Optional[date] = None
    inspector_assigned: Optional[int] = None  # Employee.unique_id
    # During development we allow providing the manager's employee.unique_id
    # so routes can be tested without authentication. In production remove/ignore.
    manager_unique_id: Optional[int] = None
    status: str = Field(default="under_construction")
    chief_engineer: str = Field(default="Unknown", max_length=200)
    date_verified: Optional[date] = None