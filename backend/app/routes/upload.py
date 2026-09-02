from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.resume_parser import parse_resume
from app.services.text_extractor import extract_text
from app.database import candidate_collection

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
            # INSERT VALID CANDIDATE
            # =============================================

            result = await candidate_collection.insert_one(
                candidate
            )

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