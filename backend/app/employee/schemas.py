from pydantic import BaseModel, Field
from pydantic.types import Json
from datetime import date
from typing import Optional
from decimal import Decimal


class RoadCreate(BaseModel):
    builder_id: int
    cost: Decimal = Field(default=0)
    started_date: date
    polyline: Json
    ended_date: Optional[date] = None
    inspector_assigned: Optional[int] = None  
    manager_unique_id: Optional[int] = None
    date_verified: Optional[date] = None