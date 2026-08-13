from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.encoders import jsonable_encoder
from app.services.resume_parser import parse_resume
from app.services.text_extractor import extract_text
from app.database import candidate_collection
import os
import shutil

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/resume")
async def upload_resume(file: UploadFile = File(...)):
    """
    Upload Resume (PDF or DOCX)
    """

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        text = extract_text(file_path)
        candidate = parse_resume(text)
        result = await candidate_collection.insert_one(candidate)
        candidate["_id"] = str(result.inserted_id)

        return {
            "success": True,
            "candidate": candidate
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)}")

@router.get("/candidates")
async def get_candidates():

    candidates = await candidate_collection.find().sort("_id", -1).to_list(100)

    for candidate in candidates:
        candidate["_id"] = str(candidate["_id"])

    return candidates


@router.get("/dashboard")
async def dashboard_data():

    candidates = await candidate_collection.find().sort("_id", -1).to_list(4)

    for candidate in candidates:
        candidate["_id"] = str(candidate["_id"])

    return {
        "total_candidates": await candidate_collection.count_documents({}),
        "recent_candidates": candidates
    }