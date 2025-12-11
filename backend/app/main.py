"""FastAPI application - Stateless, no database"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(
    title="Intelligent Redundancy Scanner",
    description="Stateless duplicate file scanner for SharePoint/OneDrive",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "Intelligent Redundancy Scanner API",
        "mode": "stateless",
        "description": "No database - scan, find duplicates, approve, done!"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


# Import routes
from app.api.routes import scan

app.include_router(scan.router, prefix="/api", tags=["scan"])

