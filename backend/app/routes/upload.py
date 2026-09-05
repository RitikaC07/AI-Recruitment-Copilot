from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.resume_parser import parse_resume
from app.services.text_extractor import extract_text
from app.database import candidate_collection

from datetime import datetime

import os
import shutil
import uuid


router = APIRouter()

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =========================================================
# UPLOAD SINGLE OR MULTIPLE RESUMES
# =========================================================

@router.post("/resume")
async def upload_resume(
    files: list[UploadFile] = File(...)
):

    results = []

    allowed_extensions = {
        ".pdf",
        ".doc",
        ".docx"
    }

    # -----------------------------------------------------
    # Process every uploaded file separately
    # -----------------------------------------------------

    for file in files:

        original_filename = file.filename

        # Default result for this file
        file_result = {
            "filename": original_filename,
            "success": False,
            "candidate": None,
            "message": ""
        }

        # -------------------------------------------------
        # Check filename
        # -------------------------------------------------

        if not original_filename:

            file_result["message"] = (
                "File name is missing."
            )

            results.append(file_result)
            continue

        # -------------------------------------------------
        # Check extension
        # -------------------------------------------------

        file_extension = os.path.splitext(
            original_filename
        )[1].lower()

        if file_extension not in allowed_extensions:

            file_result["message"] = (
                "Invalid file type. "
                "Please upload PDF, DOC or DOCX."
            )

            results.append(file_result)
            continue

        # -------------------------------------------------
        # Create unique temporary filename
        # -------------------------------------------------

        unique_filename = (
            f"{uuid.uuid4()}{file_extension}"
        )

        file_path = os.path.join(
            UPLOAD_FOLDER,
            unique_filename
        )

        try:

            # =============================================
            # SAVE FILE
            # =============================================

            with open(file_path, "wb") as buffer:

                shutil.copyfileobj(
                    file.file,
                    buffer
                )

            # =============================================
            # EXTRACT TEXT
            # =============================================

            text = extract_text(file_path)

            if not text or not text.strip():

                file_result["message"] = (
                    "Could not extract text from this document."
                )

                results.append(file_result)
                continue

            # =============================================
            # PARSE RESUME
            # =============================================

            candidate = parse_resume(text)

            # =============================================
            # CHECK WHETHER IT IS A RESUME
            # =============================================

            if not candidate.get(
                "is_resume",
                False
            ):

                file_result["message"] = (
                    "This document does not appear "
                    "to be a resume."
                )

                results.append(file_result)
                continue

            # =============================================
            # CHECK CANDIDATE NAME
            # =============================================

            if not candidate.get(
                "name_found",
                False
            ):

                file_result["message"] = (
                    "Candidate name not found. "
                    "Please upload a resume containing "
                    "the candidate's name."
                )

                results.append(file_result)
                continue

            # =============================================
            # ADD RECRUITMENT INFORMATION
            # =============================================

            # Every new candidate starts as Applied
            candidate["status"] = "Applied"

            # Store when the candidate was added
            candidate["created_at"] = datetime.utcnow()

            # =============================================
            # INSERT VALID CANDIDATE
            # =============================================

            result = await candidate_collection.insert_one(
                candidate
            )

            # Convert MongoDB ObjectId to string
            # for the response
            candidate["_id"] = str(
                result.inserted_id
            )

            # =============================================
            # SUCCESS
            # =============================================

            file_result["success"] = True

            file_result["candidate"] = candidate

            file_result["message"] = (
                f"Candidate {candidate['name']} "
                "added successfully."
            )

            results.append(file_result)

        except Exception as e:

            file_result["message"] = (
                f"Parsing failed: {str(e)}"
            )

            results.append(file_result)

        finally:

            # =============================================
            # DELETE TEMPORARY FILE
            # =============================================

            if os.path.exists(file_path):

                try:
                    os.remove(file_path)

                except Exception:
                    pass

    # =====================================================
    # RETURN RESULTS FOR ALL FILES
    # =====================================================

    successful = [
        result
        for result in results
        if result["success"]
    ]

    failed = [
        result
        for result in results
        if not result["success"]
    ]

    return {
        "success": len(successful) > 0,

        "total_files": len(results),

        "successful_count": len(successful),

        "failed_count": len(failed),

        "results": results
    }


# =========================================================
# GET ALL CANDIDATES
# =========================================================

@router.get("/candidates")
async def get_candidates():

    candidates = await candidate_collection.find() \
        .sort("_id", -1) \
        .to_list(100)

    for candidate in candidates:

        candidate["_id"] = str(
            candidate["_id"]
        )

    return candidates


# =========================================================
# DASHBOARD
# =========================================================

@router.get("/dashboard")
async def dashboard_data():

    candidates = await candidate_collection.find() \
        .sort("_id", -1) \
        .to_list(4)

    for candidate in candidates:

        candidate["_id"] = str(
            candidate["_id"]
        )

    return {

        "total_candidates":
            await candidate_collection.count_documents({}),

        "recent_candidates":
            candidates
    }

# =========================================================
# ANALYTICS
# =========================================================

@router.get("/analytics")
async def get_analytics():

    try:

        # -------------------------------------------------
        # Get all candidates
        # -------------------------------------------------

        candidates = await candidate_collection.find().to_list(None)

        total_candidates = len(candidates)

        # -------------------------------------------------
        # Recruitment Pipeline
        # -------------------------------------------------

        pipeline_statuses = [
            "Applied",
            "Screened",
            "Interviewed",
            "Shortlisted",
            "Further Review",
            "Hired",
            "Rejected"
        ]

        pipeline = {}

        for status in pipeline_statuses:

            pipeline[status] = sum(
                1
                for candidate in candidates
                if candidate.get("status") == status
            )

        # -------------------------------------------------
        # Total Hired
        # -------------------------------------------------

        total_hired = pipeline["Hired"]

        # -------------------------------------------------
        # Hiring Success Rate
        # -------------------------------------------------

        if total_candidates > 0:

            hiring_success_rate = (
                total_hired / total_candidates
            ) * 100

        else:

            hiring_success_rate = 0

        # -------------------------------------------------
        # Average Time to Hire
        # -------------------------------------------------

        hiring_times = []

        for candidate in candidates:

            created_at = candidate.get(
                "created_at"
            )

            hired_at = candidate.get(
                "hired_at"
            )

            if created_at and hired_at:

                time_difference = (
                    hired_at - created_at
                ).total_seconds() / 86400

                hiring_times.append(
                    time_difference
                )

        if hiring_times:

            avg_time_to_hire = (
                sum(hiring_times)
                / len(hiring_times)
            )

        else:

            avg_time_to_hire = 0

        # -------------------------------------------------
        # Top Skills
        # -------------------------------------------------

        skill_counts = {}

        for candidate in candidates:

            skills = candidate.get(
                "skills",
                []
            )

            if not isinstance(skills, list):
                continue

            for skill in skills:

                if not skill:
                    continue

                skill_name = str(skill)

                skill_counts[skill_name] = (
                    skill_counts.get(
                        skill_name,
                        0
                    ) + 1
                )

        # Sort skills by number of candidates
        sorted_skills = sorted(
            skill_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )

        # Return top 10 skills
        top_skills = [
            {
                "skill": skill,
                "count": count
            }
            for skill, count
            in sorted_skills[:10]
        ]

        # -------------------------------------------------
        # Interview Analytics
        # -------------------------------------------------

        interview_scores = []

        completed_interviews = 0

        for candidate in candidates:

            score = candidate.get(
                "interview_score"
            )

            if score is not None:

                try:

                    interview_scores.append(
                        float(score)
                    )

                except (
                    ValueError,
                    TypeError
                ):

                    pass

            if candidate.get(
                "interview_completed_at"
            ):

                completed_interviews += 1

        # Average interview score

        if interview_scores:

            average_interview_score = (
                sum(interview_scores)
                / len(interview_scores)
            )

        else:

            average_interview_score = 0

        # -------------------------------------------------
        # Interview Pass Rate
        #
        # Candidates with score >= 60 are considered
        # passed.
        # -------------------------------------------------

        if interview_scores:

            passed_interviews = sum(
                1
                for score in interview_scores
                if score >= 7
            )

            interview_pass_rate = (
                passed_interviews
                / len(interview_scores)
            ) * 100

        else:

            interview_pass_rate = 0

        # -------------------------------------------------
        # Return Analytics
        # -------------------------------------------------

        return {

            "hiring_success_rate":
                round(
                    hiring_success_rate,
                    2
                ),

            "avg_time_to_hire":
                round(
                    avg_time_to_hire,
                    2
                ),

            "total_candidates":
                total_candidates,

            "total_hired":
                total_hired,

            "pipeline":
                pipeline,

            "top_skills":
                top_skills,

            "interview": {

                "average_score":
                    round(
                        average_interview_score,
                        2
                    ),

                "pass_rate":
                    round(
                        interview_pass_rate,
                        2
                    ),

                "completed_interviews":
                    completed_interviews
            }
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to generate analytics: {str(e)}"
            )
        )