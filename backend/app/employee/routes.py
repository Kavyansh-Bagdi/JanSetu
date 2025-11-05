from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.builder import Builder
from app.models.employee import Employee
from app.models.road import Road
from .schemas import RoadCreate

employee_router = APIRouter(prefix="/employee", tags=["Employee"])


@employee_router.post("/roads", status_code=status.HTTP_201_CREATED)
def create_road(
    payload: RoadCreate,
    session: Session = Depends(get_db),
):
    """
    Manager (employee) creates a Road. inspector_assigned is optional.
    """
    # Development mode: optionally resolve manager by provided manager_unique_id in payload
    manager_profile = None
    if getattr(payload, "manager_unique_id", None) is not None:
        manager_profile = session.query(Employee).filter(Employee.unique_id == payload.manager_unique_id).first()
        if not manager_profile:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Manager profile (manager_unique_id) not found")

    # verify builder exists
    builder = session.query(Builder).filter(Builder.id == payload.builder_id).first()
    if not builder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Builder not found")

    # validate inspector if provided
    inspector_unique = None
    if payload.inspector_assigned is not None:
        inspector = session.query(Employee).filter(Employee.unique_id == payload.inspector_assigned).first()
        if not inspector:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inspector employee not found")
        inspector_unique = inspector.unique_id

    # Decide the employee_unique to assign to the road. Road.employee_id is NOT NULL in the DB,
    # so require either inspector_assigned or manager_unique_id in development mode.
    if inspector_unique is not None:
        assigned_employee_unique = inspector_unique
    elif manager_profile is not None:
        assigned_employee_unique = manager_profile.unique_id
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either inspector_assigned or manager_unique_id in the request (development mode)"
        )

    road = Road(
        cost=payload.cost,
        started_date=payload.started_date,
        ended_date=payload.ended_date,
        builder_id=builder.id,
        employee_id=assigned_employee_unique,
        # provide empty coordinates by default in development so NOT NULL constraint is satisfied
        coordinates={},
        maintained_by=builder.id,
        # chief_engineer and status are assigned/managed by builders. Provide empty string for chief_engineer
        # to satisfy existing DB NOT NULL constraint in development. Replace with proper migration later.
        chief_engineer="",
        date_verified=payload.date_verified,
    )

    session.add(road)
    session.commit()
    session.refresh(road)

    return {
        "road_id": road.road_id,
        "builder_id": road.builder_id,
    "employee_id": road.employee_id,
    "chief_engineer": getattr(road, "chief_engineer", None),
        "started_date": str(road.started_date),
        "ended_date": str(road.ended_date) if road.ended_date else None,
    }

@employee_router.get("/inspector/roads")
def get_inspector_roads(
    inspector_unique_id: int,
    session: Session = Depends(get_db),
):
    """
    Return roads assigned to the inspector corresponding to the authenticated user.
    Only returns roads where Road.employee_id == Employee.unique_id for the inspector.
    """
    inspector = session.query(Employee).filter(Employee.unique_id == inspector_unique_id).first()
    if not inspector:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inspector profile not found for provided unique id")

    # Optional: enforce role check if Employee has a role field
    # if getattr(inspector, "role", None) and inspector.role != "inspector":
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not an inspector")

    roads = session.query(Road).filter(Road.employee_id == inspector.unique_id).all()

    result = []
    for r in roads:
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
        })

    return {"count": len(result), "roads": result}