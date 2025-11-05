from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional
from decimal import Decimal


# Request schemas
class RatingCreate(BaseModel):
    """Schema for creating a rating"""
    road_id: int = Field(..., gt=0, description="ID of the road being rated")
    rating: Decimal = Field(..., ge=0.0, le=5.0, decimal_places=1, description="Rating value between 0.0 and 5.0")
    location: str = Field(..., min_length=1, description="Location where rating was given")

    @field_validator('rating')
    @classmethod
    def validate_rating(cls, v):
        if v < 0 or v > 5:
            raise ValueError('Rating must be between 0.0 and 5.0')
        return v


class ReviewCreate(BaseModel):
    """Schema for creating a review"""
    road_id: int = Field(..., gt=0, description="ID of the road being reviewed")
    media: Optional[str] = Field(None, description="URL or path to media file")
    tags: Optional[str] = Field(None, description="Comma-separated tags")


# Response schemas
class RatingResponse(BaseModel):
    rating_id: int
    road_id: int
    user_id: int
    rating: Decimal
    timestamp: datetime
    location: str
    
    class Config:
        from_attributes = True


class ReviewResponse(BaseModel):
    review_id: int
    road_id: int
    user_id: int
    media: Optional[str]
    tags: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True


class RoadInfoResponse(BaseModel):
    """Response schema for road information"""
    road_id: int
    builder_id: int
    builder_name: str
    cost: Decimal
    employee_id: int
    employee_name: str
    status: str
    maintained_by: int
    maintainer_name: str
    started_date: str
    ended_date: Optional[str]
    verification_date: Optional[str]
    chief_engineer: str
    average_rating: Optional[Decimal] = None
    total_ratings: int = 0
    total_reviews: int = 0

