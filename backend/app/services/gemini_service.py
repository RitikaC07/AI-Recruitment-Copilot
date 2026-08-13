import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")


def parse_resume_with_gemini(resume_text):
    prompt = f"""
You are an expert AI recruitment assistant.

Extract the following information from the resume.

Return ONLY valid JSON.

{{
    "name": "",
    "email": "",
    "phone": "",
    "experience": "",
    "skills": [],
    "education": [],
    "projects": []
}}

Resume:

{resume_text}
"""

    response = model.generate_content(prompt)

    text = response.text.strip()

    # Remove markdown if Gemini wraps the JSON
    text = text.replace("```json", "").replace("```", "").strip()

    return json.loads(text)