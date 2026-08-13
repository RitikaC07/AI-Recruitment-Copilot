import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def analyze_skill_gap(candidate, job):

    prompt = f"""
You are an expert AI recruitment assistant.

Analyze how suitable the following candidate is for the given job.

CANDIDATE:

Name:
{candidate.get("name", "")}

Skills:
{candidate.get("skills", [])}

Experience:
{candidate.get("experience", [])}

Education:
{candidate.get("education", {})}

Projects:
{candidate.get("projects", [])}


JOB:

Title:
{job.get("title", "")}

Description:
{job.get("description", "")}

Required Skills:
{job.get("required_skills", [])}

Required Experience:
{job.get("minimum_experience", 0)} years


Perform a detailed skill gap analysis.

IMPORTANT SKILL LEVEL RULES:

The job skills may contain these levels:

- Required: Critical skill. Missing this should be considered a significant skill gap.
- Intermediate: Candidate should have reasonable knowledge or practical experience.
- Basic: Candidate only needs fundamental knowledge.

When evaluating skills, consider both the skill name AND its required level.

Return ONLY valid JSON in exactly this format:

{{
    "overall_assessment": "",
    "matched_skills": [],
    "missing_skills": [],
    "related_skills": [],
    "experience_gap": "",
    "skill_gap_summary": "",
    "recommendations": []
}}

Rules:

- matched_skills:
  Skills that the candidate possesses and that are relevant to the job.

- missing_skills:
  Important job skills that the candidate does not have.

- related_skills:
  Transferable or closely related skills that the candidate already possesses.

- experience_gap:
  Compare the candidate's actual experience with the required experience.
  Do not assume experience that is not provided.

- overall_assessment:
  Explain the candidate's overall suitability for this specific job.

- skill_gap_summary:
  Summarize the most important skill gaps, giving greater importance to Required skills.

- recommendations:
  Give practical skills the candidate should learn or improve to become more suitable for this job.

- Do not invent skills that are not present in the candidate information.

- Do not assume experience that is not provided.

- Do not invent projects, certifications, education, or work experience.

- Keep recommendations relevant to this specific job.

- Return ONLY valid JSON.
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    text = response.text.strip()

    # Remove Markdown code fences if Gemini adds them
    if text.startswith("```json"):
        text = text[7:]

    elif text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    text = text.strip()

    return json.loads(text)