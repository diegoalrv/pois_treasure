from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routes import users, profiles, pois, surveys, tracking

Base.metadata.create_all(bind=engine)

app = FastAPI(title="POIs Treasure Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

app.include_router(users.router)
app.include_router(profiles.router)
app.include_router(pois.router)
app.include_router(surveys.router)
app.include_router(tracking.router)
