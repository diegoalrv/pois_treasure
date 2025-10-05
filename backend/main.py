from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routes import users, profiles, pois, surveys, tracking
import os

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="POIs Treasure Backend",
    version="1.0.0",
    description="Backend API for mobility survey and POI tracking"
)

# CORS Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    # En producción, lista explícita de orígenes permitidos
    origins = [
        "https://mobility-concepcion-workshop.up.railway.app",  # Tu frontend
    ]
    if FRONTEND_URL:
        origins.append(FRONTEND_URL)
else:
    # En desarrollo, permite todo
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    return {
        "message": "POIs Treasure API",
        "docs": "/docs",
        "health": "/health"
    }

app.include_router(users.router)
app.include_router(profiles.router)
app.include_router(pois.router)
app.include_router(surveys.router)
app.include_router(tracking.router)