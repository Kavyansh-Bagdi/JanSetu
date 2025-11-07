from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.builder import Builder
from app.models.road import Road
from app.models.rating import Rating
from .schemas import BuilderRoadUpdate

builder_router = APIRouter(prefix="/builder", tags=["Builder"])


@builder_router.get("/{builder_id}/roads")
def get_builder_roads(builder_id: int, session: Session = Depends(get_db)):
    """
    Return roads assigned to this builder (either as owner or maintainer).
    """
    builder = session.query(Builder).filter(Builder.id == builder_id).first()
    if not builder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Builder not found")

    roads = session.query(Road).filter(
        (Road.builder_id == builder.id) | (Road.maintained_by == builder.id)
    ).all()

    result = []
    for r in roads:
        ratings = session.query(Rating).filter(Rating.road_id == r.road_id).all()
        average_rating = sum(float(rating.rating) for rating in ratings) / len(ratings) if ratings else None
        result.append({
            "road_id": getattr(r, "road_id", None),
            "builder_id": getattr(r, "builder_id", None),
            "maintained_by": getattr(r, "maintained_by", None),
            "cost": str(getattr(r, "cost", None)) if getattr(r, "cost", None) is not None else None,
            "started_date": str(getattr(r, "started_date", None)),
            "ended_date": str(getattr(r, "ended_date", None)) if getattr(r, "ended_date", None) else None,
            "status": getattr(r, "status", None),
            "chief_engineer": getattr(r, "chief_engineer", None),
            "date_verified": str(getattr(r, "date_verified", None)) if getattr(r, "date_verified", None) else None,
            "average_rating": average_rating,
            "polyline_data": getattr(r,"polyline_data",None),
        })

    return {"count": len(result), "roads": result}


@builder_router.patch("/roads/{road_id}")
def update_road_by_builder(
    road_id: int,
    payload: BuilderRoadUpdate,
    session: Session = Depends(get_db),
):
    """
    Allow a builder to assign a chief_engineer and/or change the status of a road.
    Development note: identify the builder using builder_unique_id in payload. In production
    this should use the authenticated builder identity.
    """
    if payload.builder_unique_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide builder_unique_id in request (development mode)")

    builder = session.query(Builder).filter(Builder.id == payload.builder_unique_id).first()
    if not builder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Builder not found")

    road = session.query(Road).filter(Road.road_id == road_id).first()
    if not road:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Road not found")

    # Ensure builder is authorized to update this road (owner or maintainer)
    if builder.id != road.builder_id and builder.id != road.maintained_by:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Builder not authorized to modify this road")

    updated = False
    if payload.chief_engineer is not None:
        road.chief_engineer = payload.chief_engineer
        updated = True
    if payload.status is not None:
        road.status = payload.status
        updated = True
    if payload.date_verified is not None:
        road.date_verified = payload.date_verified
        updated = True

    if not updated:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nothing to update")

    session.commit()
    session.refresh(road)

    return {
        "road_id": road.road_id,
        "chief_engineer": road.chief_engineer,
        "status": road.status,
    }
