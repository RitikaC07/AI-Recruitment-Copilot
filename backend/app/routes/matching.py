from fastapi import APIRouter, HTTPException
from app.database import candidate_collection, db
from app.services.resume_parser import calculate_experience_years
from bson import ObjectId

router = APIRouter()

job_collection = db["jobs"]


@router.get("/jobs/{job_id}/matches")
async def get_job_matches(job_id: str):
    """
    Compare all candidates against a selected job.
    Skill levels:
    Required     -> weight 1.0
    Intermediate -> weight 0.7
    Basic        -> weight 0.4
    """

    # Get job
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

    # --------------------------------
    # Job Skills
    # --------------------------------

    job_skills = job.get("required_skills", [])

    skill_weights = {
        "required": 1.0,
        "intermediate": 0.7,
        "basic": 0.4
    }

    processed_skills = []

    for skill in job_skills:

        # New format:
        # {"name": "Python", "level": "Required"}

        if isinstance(skill, dict):

            name = str(
                skill.get("name", "")
            ).lower().strip()

            level = str(
                skill.get("level", "Required")
            ).lower().strip()

        # Old format:
        # "Python"

        else:

            name = str(skill).lower().strip()
            level = "required"

        if name:
            processed_skills.append({
                "name": name,
                "level": level,
                "weight": skill_weights.get(
                    level,
                    1.0
                )
            })

    minimum_experience = float(
        job.get("minimum_experience", 0)
    )

    # --------------------------------
    # Get Candidates
    # --------------------------------

    candidates = await candidate_collection.find().to_list(100)

    results = []

    for candidate in candidates:

        # --------------------------------
        # Candidate Skills
        # --------------------------------

        candidate_skills = [
            str(skill).lower().strip()
            for skill in candidate.get(
                "skills",
                []
            )
        ]

        # --------------------------------
        # Matched / Missing Skills
        # --------------------------------

        matched_skills = []
        missing_skills = []

        total_weight = 0
        matched_weight = 0

        for skill in processed_skills:

            skill_name = skill["name"]
            weight = skill["weight"]

            total_weight += weight

            if skill_name in candidate_skills:

                matched_skills.append(
                    skill_name
                )

                matched_weight += weight

            else:

                missing_skills.append(
                    skill_name
                )

        # --------------------------------
        # Skill Score
        # --------------------------------

        if total_weight > 0:

            skill_score = (
                matched_weight
                / total_weight
            ) * 100

        else:

            skill_score = 0

        skill_score = min(
            skill_score,
            100
        )

        # --------------------------------
        # Experience
        # --------------------------------

        candidate_experience = calculate_experience_years(
            candidate.get(
                "experience",
                []
            )
        )

        if minimum_experience == 0:

            experience_score = 100

        elif candidate_experience >= minimum_experience:

            experience_score = 100

        else:

            experience_score = (
                candidate_experience
                / minimum_experience
            ) * 100

        experience_score = min(
            experience_score,
            100
        )

        # --------------------------------
        # Final Match Score
        # --------------------------------

        match_score = (
            skill_score * 0.8
            + experience_score * 0.2
        )

        # --------------------------------
        # Recommendation
        # --------------------------------

        if match_score >= 80:

            recommendation = "Strong Match"

        elif match_score >= 60:

            recommendation = "Good Match"

        elif match_score >= 40:

            recommendation = "Partial Match"

        else:

            recommendation = "Low Match"

        # --------------------------------
        # Result
        # --------------------------------

        results.append({

            "candidate_id": str(
                candidate["_id"]
            ),

            "name": candidate.get(
                "name",
                ""
            ),

            "email": candidate.get(
                "email",
                ""
            ),

            "skills": candidate.get(
                "skills",
                []
            ),

            "experience": candidate.get(
                "experience",
                ""
            ),

            "candidate_experience_years": round(
                candidate_experience,
                2
            ),

            "matched_skills": matched_skills,

            "missing_skills": missing_skills,

            "skill_score": round(
                skill_score,
                2
            ),

            "experience_score": round(
                experience_score,
                2
            ),

            "match_score": round(
                match_score,
                2
            ),

            "recommendation": recommendation
        })

    # --------------------------------
    # Highest Match First
    # --------------------------------

    results.sort(
        key=lambda x: x["match_score"],
        reverse=True
    )

    return {

        "job_id": job_id,

        "job_title": job.get(
            "title",
            ""
        ),

        "total_candidates": len(
            results
        ),

        "matches": results
    }