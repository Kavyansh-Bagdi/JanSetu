from sqlalchemy import Column, Integer, String, DECIMAL, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Road(Base):
    __tablename__ = "road"

    road_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    coordinates = Column(JSON, nullable=False)  # Stores list of coordinate points
    cost = Column(DECIMAL(15, 2), nullable=False)
    started_date = Column(Date, nullable=False)
    ended_date = Column(Date, nullable=True)
    builder_id = Column(Integer, ForeignKey("builder.id"), nullable=False)
    manager_id = Column(Integer, ForeignKey("manager.unique_id"), nullable=False)
    maintained_by = Column(Integer, ForeignKey("builder.id"), nullable=False)
    chief_engineer = Column(String, nullable=False)
    is_verified = Column(Integer, default=False)
    verification_code = Column(String, nullable=True)
    date_verified = Column(Date, nullable=True)

    # Relationships
    builder = relationship("Builder", back_populates="roads", foreign_keys=[builder_id])
    manager = relationship(
        "Manager",
        back_populates="managed_roads",
        foreign_keys=[manager_id]
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
