from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base
from app.auth import auth_router
from app.employee.routes import employee_router
from app.builder.routes import builder_router
from app.user.routes import user_router
from sqlalchemy.orm import Session
from app.core.database import get_db
from fastapi import Depends
from pathlib import Path

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)

# Mount static files for serving uploaded media
storage_path = Path("storage")
storage_path.mkdir(exist_ok=True)
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(employee_router)
app.include_router(builder_router)
app.include_router(user_router)

@app.on_event("startup")
async def startup_event():
    """
    Initialize database tables on startup (for development only)
    In production, use Alembic migrations instead
    """
    # Base.metadata.create_all(bind=engine)
    pass


@app.get("/")
async def root(session: Session = Depends(get_db)):
    from app.user.services import UserService
    user_service = UserService()
    all_roads = user_service.all_road_data(session=session)
    #will send all roads data as json
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/docs",
        "all_roads_data": all_roads
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )