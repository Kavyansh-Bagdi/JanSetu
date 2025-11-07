from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.builder import Builder
from app.models.user import User
from app.models.road import Road
from app.auth.dependencies import get_current_user
from .schemas import (
    RatingCreate,
    ReviewCreate,
    RatingResponse,
    ReviewResponse,
    RoadInfoResponse
)
from .services import UserService
from typing import List, Optional

user_router = APIRouter(prefix="/user", tags=["User"])
user_service = UserService()
current_user = {
        "user_id": 1
    }


@user_router.get('/roads/{road_id}', response_model=RoadInfoResponse, status_code=status.HTTP_200_OK)
def get_road_info(
    road_id: int,
    session: Session = Depends(get_db)
):
    """
    Get detailed information about a specific road.
    """
    road = session.query(Road).filter(Road.road_id == road_id).first()
    if not road:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Road not found"
        )
    
    # Get average rating
    avg_rating = user_service.get_average_rating(road_id, session)
    
    # Get counts
    total_ratings = len(road.ratings)
    total_reviews = len(road.reviews)

    return RoadInfoResponse(
        road_id=road.road_id,
        builder_id=road.builder_id,
        builder_name=road.builder.name,
        cost=road.cost,
        employee_id=road.employee_id,
        employee_name=road.employee.user.name,
        status=road.status,
        maintained_by=road.maintained_by,
        maintainer_name=road.maintainer.name,
        started_date=str(road.started_date),
        ended_date=str(road.ended_date) if road.ended_date else None,
        verification_date=str(road.date_verified) if road.date_verified else None,
        chief_engineer=road.chief_engineer,
        average_rating=avg_rating,
        total_ratings=total_ratings,
        total_reviews=total_reviews
    )


@user_router.post('/roads/rate/', response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
def rate_road(
    payload: RatingCreate,
    # current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    """
    Rate a road. Requires authentication.
    """

    rating = user_service.create_rating(
        road_id=payload.road_id,
        user_id=current_user['user_id'],
        rating_value=payload.rating,
        location=payload.location,
        session=session
    )
    return rating


@user_router.post('/roads/review/', response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def review_road(
    road_id: int = Form(...),
    tags: Optional[str] = Form(None),
    media_file: Optional[UploadFile] = File(None),
    # current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    """
    Review a road with optional media file upload. Requires authentication.
    Accepts multipart/form-data with:
    - road_id: int (required)
    - tags: str (optional, comma-separated)
    - media_file: file (optional, image/video)
    """
    review = await user_service.create_review(
        road_id=road_id,
        user_id=current_user['user_id'],
        media_file=media_file,
        tags=tags,
        session=session
    )
    return review


@user_router.get('/roads/{road_id}/ratings/', response_model=List[RatingResponse], status_code=status.HTTP_200_OK)
def get_road_ratings(
    road_id: int,
    session: Session = Depends(get_db)
):
    """
    Get all ratings for a specific road.
    """
    ratings = user_service.get_road_ratings(road_id, session)
    return ratings


@user_router.get("/roads/{road_id}/reviews", response_model=dict)
async def get_road_reviews(
    road_id: int,
    session: Session = Depends(get_db)
):
    """
    Fetch all reviews for a given road with tag frequency count.
    """
    reviews = user_service.get_road_reviews(road_id=road_id, session=session)

    tag_counts = {}
    all_reviews = []

    for review in reviews:
        # Split tags safely
        tags = []
        if review.tags:
            tags = [t.strip() for t in review.tags.split(",") if t.strip() and not t.isdigit()]

        # Update tag counts
        for tag in tags:
            if tag not in tag_counts:
                tag_counts[tag] = 0
            tag_counts[tag] += 1

        # Construct full media URL if media exists
        media_url = None
        if review.media:
            media_url = f"{settings.API_URL}/{review.media}"

        all_reviews.append({
            "user_id": review.user_id,
            "tags": tags,
            "comment": review.tags.split(",")[0] if review.tags else "",
            "media": media_url,
            "timestamp": str(review.timestamp),
        })

    return {
        "reviews": all_reviews,
        "tag_counts": tag_counts,
    }

