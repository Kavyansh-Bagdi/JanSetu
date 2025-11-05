from app.models.builder import Builder
from app.models.user import User
from app.models.rating import Rating
from app.models.review import Review
from app.models.road import Road
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status, UploadFile
from datetime import datetime, timezone
from typing import List, Optional
from decimal import Decimal
import os
import uuid
from pathlib import Path


class UserService:
    """Service class for user-related operations"""
    
    # Directory to store uploaded media files
    UPLOAD_DIR = Path("storage/review_media")
    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".mp4", ".mov", ".avi"}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    def __init__(self):
        """Initialize service and create upload directory if it doesn't exist"""
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    async def save_media_file(self, file: UploadFile) -> str:
        """
        Save uploaded media file to storage with a unique name.
        Returns the file path relative to storage directory.
        """
        # Validate file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in self.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(self.ALLOWED_EXTENSIONS)}"
            )
        
        # Read file content to check size
        content = await file.read()
        if len(content) > self.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size is {self.MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = self.UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Return relative path
        return str(Path("storage/review_media") / unique_filename)
    
    def delete_media_file(self, file_path: str):
        """Delete a media file from storage"""
        try:
            full_path = Path(file_path)
            if full_path.exists():
                full_path.unlink()
        except Exception as e:
            # Log error but don't fail if file deletion fails
            print(f"Error deleting file {file_path}: {e}")
    
    def create_rating(self, road_id: int, user_id: int, rating_value: Decimal, location: str, session: Session) -> Rating:
        """Create a new rating for a road"""
        # Check if road exists
        road = session.query(Road).filter(Road.road_id == road_id).first()
        if not road:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Road not found"
            )
        
        # Check if user already rated this road
        existing_rating = session.query(Rating).filter(
            Rating.road_id == road_id,
            Rating.user_id == user_id
        ).first()
        
        if existing_rating:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already rated this road"
            )
        
        # Create new rating
        new_rating = Rating(
            road_id=road_id,
            user_id=user_id,
            rating=rating_value,
            location=location,
            timestamp=datetime.now(timezone.utc)
        )
        
        session.add(new_rating)
        
        # Update user's total contributions
        user = session.query(User).filter(User.user_id == user_id).first()
        if user:
            user.total_contributions += 1
        
        session.commit()
        session.refresh(new_rating)
        
        return new_rating
    
    async def create_review(
        self, 
        road_id: int, 
        user_id: int, 
        media_file: Optional[UploadFile], 
        tags: Optional[str], 
        session: Session
    ) -> Review:
        """Create a new review for a road with optional media file upload"""
        # Check if road exists
        road = session.query(Road).filter(Road.road_id == road_id).first()
        if not road:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Road not found"
            )
        
        # Save media file if provided
        media_path = None
        if media_file and media_file.filename:
            media_path = await self.save_media_file(media_file)
        
        # Create new review
        new_review = Review(
            road_id=road_id,
            user_id=user_id,
            media=media_path,
            tags=tags,
            timestamp=datetime.now(timezone.utc)
        )
        
        session.add(new_review)
        
        # Update user's total contributions
        user = session.query(User).filter(User.user_id == user_id).first()
        if user:
            user.total_contributions += 1
        
        session.commit()
        session.refresh(new_review)
        
        return new_review
    
    def get_road_ratings(self, road_id: int, session: Session) -> List[Rating]:
        """Get all ratings for a specific road"""
        road = session.query(Road).filter(Road.road_id == road_id).first()
        if not road:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Road not found"
            )
        
        ratings = session.query(Rating).filter(Rating.road_id == road_id).all()
        return ratings
    
    def get_road_reviews(self, road_id: int, session: Session) -> List[Review]:
        """Get all reviews for a specific road"""
        road = session.query(Road).filter(Road.road_id == road_id).first()
        if not road:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Road not found"
            )
        
        reviews = session.query(Review).filter(Review.road_id == road_id).all()
        return reviews
    
    def get_average_rating(self, road_id: int, session: Session) -> Optional[Decimal]:
        """Calculate average rating for a road"""
        avg_rating = session.query(func.avg(Rating.rating)).filter(
            Rating.road_id == road_id
        ).scalar()
        
        return Decimal(str(avg_rating)).quantize(Decimal('0.1')) if avg_rating else None


