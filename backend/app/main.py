from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.upload import router as upload_router
from app.routes.jobs import router as jobs_router
from app.routes.matching import router as matching_router

app = FastAPI(
    title="AI Recruitment Copilot API",
    version="1.0.0",
    description="Backend API for AI Recruitment Copilot"
)

# Allow React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(jobs_router)
app.include_router(matching_router)

@app.get("/")
async def root():
    return {
        "status": "success",
        "message": "AI Recruitment Copilot Backend Running 🚀"
    }