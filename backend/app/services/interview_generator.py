import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_interview_questions(job, question_type):
    prompt = f"""
You are an expert AI recruitment assistant.

Generate interview questions for the following job.

JOB TITLE:
{job.get("title", "")}

JOB DESCRIPTION:
{job.get("description", "")}

REQUIRED SKILLS:
{job.get("required_skills", [])}

REQUIRED EXPERIENCE:
{job.get("minimum_experience", 0)} years

QUESTION TYPE:
{question_type}

Generate 5 relevant interview questions.

Rules:
- Questions must be specific to this job.
- Focus on the selected question type.
- Do not invent requirements not present in the job.
- Keep questions clear and suitable for an interview.
- Return ONLY valid JSON.

Return exactly:

{{
    "questions": [
        "Question 1",
        "Question 2",
        "Question 3",
        "Question 4",
        "Question 5"
    ]
}}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    text = response.text.strip()

    text = text.replace("```json", "")
    text = text.replace("```", "")
    text = text.strip()

    return json.loads(text)