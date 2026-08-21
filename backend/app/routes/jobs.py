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

    The final AI recommendation is saved to the
    candidate's MongoDB document.
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
        # Update candidate status
        # -------------------------------------------------

        # Normalize recommendation
        recommendation_upper = str(
            recommendation
        ).upper()

        if recommendation_upper == "SELECTED":

            interview_status = "Selected"

        elif recommendation_upper in [
            "REJECTED",
            "REJECT"
        ]:

            interview_status = "Rejected"

        else:

            interview_status = "Further Review"

        # -------------------------------------------------
        # Save interview result in MongoDB
        # -------------------------------------------------

        await candidate_collection.update_one(
            {
                "_id": ObjectId(
                    request.candidate_id
                )
            },
            {
                "$set": {

                    "interview_status":
                        interview_status,

                    "interview_score":
                        overall_score,

                    "interview_recommendation":
                        recommendation,

                    "interview_evaluation":
                        evaluation,

                    "interview_completed_at":
                        datetime.utcnow(),

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
                interview_status
        }

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Interview evaluation failed: {str(e)}"
        )