from pydantic import BaseModel, Field
from datetime import date
from typing import Optional, List, Dict, Any
from decimal import Decimal


class RoadCreate(BaseModel):
    builder_id: int
    cost: Decimal = Field(default=0)
    started_date: date
    polyline: List[Dict[str, Any]]
    ended_date: Optional[date] = None
    inspector_assigned: Optional[int] = None  
    manager_unique_id: Optional[int] = None
    date_verified: Optional[date] = None