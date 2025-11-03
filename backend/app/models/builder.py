from sqlalchemy import Column, Integer, String, DECIMAL
from sqlalchemy.orm import relationship
from app.core.database import Base


class Builder(Base):
    __tablename__ = "builder"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    average_rating = Column(DECIMAL(3, 2), default=0.0)
    total_projects = Column(Integer, default=0)
    hyperlink = Column(String, nullable=True)

    # Relationships
    roads = relationship("Road", back_populates="builder", foreign_keys="Road.builder_id")
    
    maintained_roads = relationship(
        "Road",
        back_populates="maintainer",
        foreign_keys="Road.maintained_by"
    )

    def __repr__(self):
        return f"<Builder(id={self.id}, name='{self.name}')>"
