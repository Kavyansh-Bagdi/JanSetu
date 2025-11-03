from fastapi import FastAPI
from app.core.config import settings
from app.core.database import engine, Base

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)


@app.on_event("startup")
async def startup_event():
    """
    Initialize database tables on startup (for development only)
    In production, use Alembic migrations instead
    """
    # Base.metadata.create_all(bind=engine)
    pass


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/docs"
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
