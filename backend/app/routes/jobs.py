from fastapi import APIRouter, HTTPException
from app.database import db, candidate_collection
from app.services.skill_gap_analyzer import analyze_skill_gap
from app.services.interview_generator import generate_interview_questions
from datetime import datetime
from pydantic import BaseModel
from typing import List
from app.services.interview_assistant import (
    generate_next_interview_response,
    evaluate_interview
)
from bson import ObjectId

router = APIRouter()

job_collection = db["jobs"]


# =========================================================
# CREATE JOB
# =========================================================

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


# =========================================================
# GET ALL JOBS
# =========================================================

@router.get("/jobs")
async def get_jobs():
    """
    Get all job postings.
    """

    jobs = await job_collection.find().sort("_id", -1).to_list(100)

    for job in jobs:
        job["_id"] = str(job["_id"])

    return jobs


# =========================================================
# SKILL GAP ANALYSIS
# =========================================================

@router.post("/jobs/{job_id}/candidates/{candidate_id}/skill-gap")
async def skill_gap_analysis(
    job_id: str,
    candidate_id: str
):
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


# =========================================================
# GENERATE INTERVIEW QUESTIONS
# =========================================================

@router.post("/jobs/{job_id}/interview-questions")
async def generate_questions(
    job_id: str,
    question_type: str = "Technical Skills"
):

    try:

        job = await job_collection.find_one({
            "_id": ObjectId(job_id)
        })

    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid job ID"
        )

    if not job:

        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    try:

        result = generate_interview_questions(
            job,
            question_type
        )

        return {
            "success": True,
            "job": job.get("title", ""),
            "question_type": question_type,
            "questions": result.get(
                "questions",
                []
            )
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate questions: {str(e)}"
        )


# =========================================================
# INTERVIEW MODELS
# =========================================================

class InterviewMessage(BaseModel):
    sender: str
    text: str


class InterviewChatRequest(BaseModel):
    candidate_id: str
    job_id: str
    messages: List[InterviewMessage]

class CandidateStatusUpdate(BaseModel):
    status: str

# =========================================================
# START / CONTINUE AI INTERVIEW
# =========================================================

@router.post("/interview/chat")
async def interview_chat(
    request: InterviewChatRequest
):
    """
    Generate the next AI interview response.

    When the interview starts:
        Candidate status -> Active

    During the interview:
        Candidate remains Active
    """

    try:

        # -------------------------------------------------
        # Get candidate
        # -------------------------------------------------

        candidate = await candidate_collection.find_one({
            "_id": ObjectId(request.candidate_id)
        })

        if not candidate:

            raise HTTPException(
                status_code=404,
                detail="Candidate not found"
            )

        # -------------------------------------------------
        # Get job
        # -------------------------------------------------

        job = await job_collection.find_one({
            "_id": ObjectId(request.job_id)
        })

        if not job:

            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        # -------------------------------------------------
        # Update candidate status to Active
        #
        # This happens when the interview is started.
        # -------------------------------------------------

        await candidate_collection.update_one(
            {
                "_id": ObjectId(request.candidate_id)
            },
            {
                "$set": {
                    "interview_status": "Active",
                    "interview_job_id": request.job_id,
                    "interview_started_at": datetime.utcnow()
                }
            }
        )

        # -------------------------------------------------
        # Convert MongoDB IDs
        # -------------------------------------------------

        candidate["_id"] = str(
            candidate["_id"]
        )

        job["_id"] = str(
            job["_id"]
        )

        # -------------------------------------------------
        # Convert messages
        # -------------------------------------------------

        messages = [
            {
                "sender": message.sender,
                "text": message.text
            }
            for message in request.messages
        ]

        # -------------------------------------------------
        # Ask Gemini
        # -------------------------------------------------

        result = generate_next_interview_response(
            candidate,
            job,
            messages
        )

        # -------------------------------------------------
        # Return AI response
        # -------------------------------------------------

        return {
            "success": True,
            "response": {

                "message": result.get(
                    "message",
                    ""
                ),

                "question": result.get(
                    "question",
                    ""
                ),

                "interview_complete": result.get(
                    "interview_complete",
                    False
                ),

                "evaluation": result.get(
                    "evaluation",
                    {}
                ),

                "final_evaluation": result.get(
                    "final_evaluation",
                    {}
                )
            }
        }

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Interview conversation failed: {str(e)}"
        )


# =========================================================
# FINAL INTERVIEW EVALUATION
# =========================================================

@router.post("/interview/evaluate")
async def evaluate_completed_interview(
    request: InterviewChatRequest
):
    """
    Evaluate the candidate after the recruiter ends
    the interview.

    AI recommendation:
        SELECTED      -> Shortlisted
        FURTHER REVIEW -> Further Review
        REJECTED      -> Rejected

    The recruiter can later manually change the
    candidate to Hired, Shortlisted, or Rejected.
    """

    try:

        # -------------------------------------------------
        # Get candidate
        # -------------------------------------------------

        candidate = await candidate_collection.find_one({
            "_id": ObjectId(request.candidate_id)
        })

        if not candidate:

            raise HTTPException(
                status_code=404,
                detail="Candidate not found"
            )

        # -------------------------------------------------
        # Get job
        # -------------------------------------------------

        job = await job_collection.find_one({
            "_id": ObjectId(request.job_id)
        })

        if not job:

            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )

        # -------------------------------------------------
        # Convert MongoDB IDs to strings for AI
        # -------------------------------------------------

        candidate["_id"] = str(
            candidate["_id"]
        )

        job["_id"] = str(
            job["_id"]
        )

        # -------------------------------------------------
        # Convert messages
        # -------------------------------------------------

        messages = [
            {
                "sender": message.sender,
                "text": message.text
            }
            for message in request.messages
        ]

        # -------------------------------------------------
        # Evaluate complete interview using Gemini
        # -------------------------------------------------

        evaluation = evaluate_interview(
            candidate,
            job,
            messages
        )

        # -------------------------------------------------
        # Get final score and recommendation
        # -------------------------------------------------

        overall_score = evaluation.get(
            "overall_score",
            0
        )

        recommendation = evaluation.get(
            "recommendation",
            "FURTHER REVIEW"
        )

        # -------------------------------------------------
        # Normalize recommendation
        # -------------------------------------------------

        recommendation_upper = str(
            recommendation
        ).strip().upper()

        # -------------------------------------------------
        # Determine recruitment status
        # -------------------------------------------------

        if recommendation_upper == "SELECTED":

            recruitment_status = "Shortlisted"

            interview_status = "Selected"

        elif recommendation_upper in [
            "REJECTED",
            "REJECT"
        ]:

            recruitment_status = "Rejected"

            interview_status = "Rejected"

        else:

            recruitment_status = "Further Review"

            interview_status = "Further Review"

        # -------------------------------------------------
        # Save interview result + recruitment status
        # -------------------------------------------------

        await candidate_collection.update_one(
            {
                "_id": ObjectId(
                    request.candidate_id
                )
            },
            {
                "$set": {

                    # Recruitment pipeline status
                    "status":
                        recruitment_status,

                    # Interview-specific status
                    "interview_status":
                        interview_status,

                    # Interview score
                    "interview_score":
                        overall_score,

                    # AI recommendation
                    "interview_recommendation":
                        recommendation,

                    # Complete evaluation
                    "interview_evaluation":
                        evaluation,

                    # Interview completion time
                    "interview_completed_at":
                        datetime.utcnow(),

                    # Job for which interview was conducted
                    "interview_job_id":
                        request.job_id
                }
            }
        )

        # -------------------------------------------------
        # Return result
        # -------------------------------------------------

        return {
            "success": True,

            "candidate":
                candidate.get(
                    "name",
                    ""
                ),

            "job":
                job.get(
                    "title",
                    ""
                ),

            "evaluation":
                evaluation,

            "candidate_status":
                recruitment_status
        }

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Interview evaluation failed: {str(e)}"
            )
        )

@router.patch("/candidates/{candidate_id}/status")
async def update_candidate_status(
    candidate_id: str,
    request: CandidateStatusUpdate
):
    """
    Allows the recruiter to manually update
    a candidate's recruitment status.
    """

    allowed_statuses = {
        "Applied",
        "Screened",
        "Interviewed",
        "Shortlisted",
        "Further Review",
        "Hired",
        "Rejected"
    }

    # -------------------------------------------------
    # Validate status
    # -------------------------------------------------

    if request.status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. Allowed statuses are: "
                "Applied, Screened, Interviewed, "
                "Shortlisted, Further Review, Hired, Rejected"
            )
        )

    try:

        # -------------------------------------------------
        # Find candidate
        # -------------------------------------------------

        candidate = await candidate_collection.find_one(
            {
                "_id": ObjectId(candidate_id)
            }
        )

        if not candidate:

            raise HTTPException(
                status_code=404,
                detail="Candidate not found"
            )

        # -------------------------------------------------
        # Prepare update
        # -------------------------------------------------

        update_data = {
            "status": request.status
        }

        # -------------------------------------------------
        # If candidate is hired, store hiring time
        # -------------------------------------------------

        if request.status == "Hired":

            # Don't overwrite the original hiring date
            if not candidate.get("hired_at"):

                update_data["hired_at"] = datetime.utcnow()

        # -------------------------------------------------
        # Update candidate
        # -------------------------------------------------

        await candidate_collection.update_one(
            {
                "_id": ObjectId(candidate_id)
            },
            {
                "$set": update_data
            }
        )

        # -------------------------------------------------
        # Return updated information
        # -------------------------------------------------

        return {
            "success": True,
            "message": (
                f"Candidate status changed to "
                f"{request.status}"
            ),
            "candidate_id": candidate_id,
            "status": request.status
        }

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to update candidate status: "
                f"{str(e)}"
            )
        )