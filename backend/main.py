from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import pois
from database import Base, engine
from dotenv import load_dotenv
load_dotenv(dotenv_path=".env.local")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="POIs Treasure")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pois.router)
