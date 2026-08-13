from fastapi import APIRouter, HTTPException
from app.database import db, candidate_collection
from app.services.skill_gap_analyzer import analyze_skill_gap
from datetime import datetime
from bson import ObjectId

router = APIRouter()

job_collection = db["jobs"]


@router.post("/jobs")
async def create_job(job: dict):
    """
    Create a new job posting.
    """

    if not job.get("title"):
        raise HTTPException(
            status_code=400,
            detail="Job title is required"
        )

    if not job.get("description"):
        raise HTTPException(
            status_code=400,
            detail="Job description is required"
        )

    job["created_at"] = datetime.utcnow()

    result = await job_collection.insert_one(job)

    return {
        "success": True,
        "message": "Job created successfully",
        "job_id": str(result.inserted_id)
    }


@router.get("/jobs")
async def get_jobs():
    """
    Get all job postings.
    """

    jobs = await job_collection.find().sort("_id", -1).to_list(100)

    for job in jobs:
        job["_id"] = str(job["_id"])

    return jobs


@router.post("/jobs/{job_id}/candidates/{candidate_id}/skill-gap")
async def skill_gap_analysis(job_id: str, candidate_id: str):
    """
    Analyze candidate skill gap for a specific job using Gemini.
    """

    try:

        # Find job
        job = await job_collection.find_one(
            {"_id": ObjectId(job_id)}
        )

        if not job:
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        # Find candidate
        candidate = await candidate_collection.find_one(
            {"_id": ObjectId(candidate_id)}
        )

        if not candidate:
            raise HTTPException(
                status_code=404,
                detail="Candidate not found"
            )

        # Convert MongoDB IDs
        job["_id"] = str(job["_id"])
        candidate["_id"] = str(candidate["_id"])

        # Send candidate + job to Gemini
        analysis = analyze_skill_gap(
            candidate,
            job
        )

        return {
            "success": True,
            "candidate": candidate.get("name", ""),
            "job": job.get("title", ""),
            "analysis": analysis
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Skill gap analysis failed: {str(e)}"
        )