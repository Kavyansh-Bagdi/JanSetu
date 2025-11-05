from sqlalchemy import Column, Integer, String, DECIMAL, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Road(Base):
    __tablename__ = "road"

    road_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    # Geo coordinates or shape for the road. Stored as JSON. In the DB this column
    # already exists and must be non-null, so we keep it here to match the schema.
    coordinates = Column(JSON, nullable=False)
    cost = Column(DECIMAL(15, 2), nullable=False)
    started_date = Column(Date, nullable=False)
    ended_date = Column(Date, nullable=True)
    builder_id = Column(Integer, ForeignKey("builder.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employee.unique_id"), nullable=False)
    maintained_by = Column(Integer, ForeignKey("builder.id"), nullable=False)
    # Allow chief_engineer to be nullable initially; builders will assign this later
    chief_engineer = Column(String, nullable=True)
    date_verified = Column(Date, nullable=True)
    status = Column(String, default="under_construction")  # "under_construction", "completed", "maintained"
    # Relationships
    builder = relationship("Builder", back_populates="roads", foreign_keys=[builder_id])
    employee = relationship(
        "Employee",
        back_populates="managed_roads",
        foreign_keys=[employee_id]  
    )
    maintainer = relationship(
        "Builder",
        back_populates="maintained_roads",
        foreign_keys=[maintained_by]
    )
    ratings = relationship("Rating", back_populates="road", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="road", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Road(road_id={self.road_id}, chief_engineer='{self.chief_engineer}')>"
