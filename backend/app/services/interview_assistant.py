import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_next_interview_response(
    candidate,
    job,
    messages
):
    """
    Generate the next conversational AI interview response.

    Gemini receives:
    - Candidate profile
    - Job information
    - Complete conversation history

    It must avoid repeating previously asked questions.
    """

    conversation_text = ""

    for message in messages:
        sender = (
            "AI Interviewer"
            if message["sender"] == "ai"
            else "Candidate"
        )

        conversation_text += (
            f"{sender}: {message['text']}\n"
        )

    prompt = f"""
You are an AI interview assistant conducting a professional
job interview.

CANDIDATE

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


JOB

Title:
{job.get("title", "")}

Description:
{job.get("description", "")}

Required Skills:
{job.get("required_skills", [])}

Minimum Experience:
{job.get("minimum_experience", 0)} years


INTERVIEW CONVERSATION

{conversation_text}


YOUR TASK

Continue the interview naturally.

The candidate has already answered the questions shown
in the conversation.

Generate the next interview response.

IMPORTANT RULES:

1. Do NOT repeat any question that has already been asked.

2. Read the candidate's latest answer carefully.

3. Ask a relevant follow-up question based on their answer
   whenever possible.

4. The question should be relevant to the job.

5. Questions should become progressively deeper.

6. Do not ask about skills that are completely unrelated
   to the candidate or job.

7. Do not invent candidate experience.

8. If the candidate mentions a project, technology,
   challenge, or experience, you may ask a deeper question
   about it.

9. Keep the interview conversational rather than making
   every question sound like an exam.

10. Ask ONLY ONE question at a time.

11. Do not provide the answer to your own question.

12. Keep the response concise.

Return ONLY valid JSON:

{{
    "message": "",
    "question": "",
    "interview_complete": false
}}

The "message" should contain a short natural acknowledgement
followed by the next question.

The "question" should contain ONLY the question.

Set "interview_complete" to true only when the interview
should end.
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    text = response.text.strip()

    # Remove Markdown code fences if Gemini adds them
    text = text.replace("```json", "")
    text = text.replace("```", "")
    text = text.strip()

    return json.loads(text)