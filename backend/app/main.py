import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.api.v1.router import api_router
from app.api.v1.websockets import router as ws_router
from app.utils.seed_data import seed_initial_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Startup: Create tables if not existing
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # 2. Seed initial data
    async with AsyncSessionLocal() as db:
        await seed_initial_data(db)
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set CORS middleware for Vercel & local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for product image uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API v1 Router & Root WebSocket Router
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(ws_router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME, "version": settings.VERSION}
