from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Rating(Base):
    __tablename__ = "rating"

    rating_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    road_id = Column(Integer, ForeignKey("road.road_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("user.user_id"), nullable=False)
    rating = Column(DECIMAL(2, 1), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    location = Column(String, nullable=False)

    # Relationships
    road = relationship("Road", back_populates="ratings")
    user = relationship("User", back_populates="ratings")

    def __repr__(self):
        return f"<Rating(rating_id={self.rating_id}, rating={self.rating}, timestamp={self.timestamp}, location={self.location})>"
