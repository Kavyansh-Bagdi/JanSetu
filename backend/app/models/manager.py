from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class Manager(Base):
    __tablename__ = "manager"

    unique_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    post = Column(String, nullable=False)
    location = Column(String, nullable=False)

    # Relationships
    managed_roads = relationship(
        "Road",
        back_populates="manager",
        foreign_keys="Road.manager_id"
    )
    

    def __repr__(self):
        return f"<Manager(unique_id={self.unique_id}, name='{self.name}', post='{self.post}')>"
