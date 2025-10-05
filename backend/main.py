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
# En producción, Railway te dará URLs específicas
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    # En producción, solo permite tu dominio de Railway
    origins = [
        FRONTEND_URL,
        "https://*.railway.app",  # Cualquier subdominio de railway
    ]
else:
    # En desarrollo, permite localhost
    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        FRONTEND_URL,
        "*",  # Solo en desarrollo
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if ENVIRONMENT == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "POIs Treasure API",
        "docs": "/docs",
        "health": "/health"
    }

# Include routers
app.include_router(users.router)
app.include_router(profiles.router)
app.include_router(pois.router)
app.include_router(surveys.router)
app.include_router(tracking.router)