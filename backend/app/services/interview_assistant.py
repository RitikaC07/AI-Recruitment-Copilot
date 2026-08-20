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

    The AI:
    - Reads the complete interview conversation
    - Avoids repeating questions
    - Evaluates the candidate's latest answer
    - Generates a relevant follow-up question
    - Provides an answer score
    - Determines when the interview should finish
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

    # Find the latest candidate answer
    latest_candidate_answer = ""

    for message in reversed(messages):
        if message["sender"] == "candidate":
            latest_candidate_answer = message["text"]
            break

    prompt = f"""
You are an AI interview assistant conducting a professional
technical job interview.

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


COMPLETE INTERVIEW CONVERSATION

{conversation_text}


LATEST CANDIDATE ANSWER

{latest_candidate_answer}


YOUR TASK

Continue the interview naturally.

You must evaluate the candidate's latest answer and then
decide what the next interview response should be.


ANSWER EVALUATION

Evaluate the latest candidate answer using these criteria:

1. Technical correctness
2. Understanding of the concept
3. Relevance to the question
4. Problem-solving ability
5. Communication clarity

Give the candidate an overall score from 0 to 10.

IMPORTANT:

- Do not give a high score just because the answer is long.
- Do not penalize short answers if they are technically correct.
- Do not invent information about the candidate.
- Evaluate only what the candidate actually said.
- The score should reflect the quality of the answer.


INTERVIEW RULES

1. NEVER repeat a question that has already been asked.

2. Read the candidate's latest answer carefully.

3. Ask a relevant follow-up question whenever appropriate.

4. The question must be relevant to the job.

5. Questions should become progressively deeper.

6. If the candidate mentions a project, technology,
   challenge, or experience, you may ask a deeper question
   about it.

7. Do not invent candidate experience.

8. Do not ask unrelated questions.

9. Keep the interview conversational.

10. Ask ONLY ONE question at a time.

11. Do not provide the answer to your own question.

12. Keep the response concise.

13. The interview should normally contain around 5-7
    meaningful questions.

14. Once enough questions have been asked, set
    "interview_complete" to true.

15. When the interview is complete, do NOT ask another
    interview question.


FINAL RECOMMENDATION

When interview_complete is true, calculate an overall
recommendation based on the candidate's answers.

Use this guideline:

- 8.0 - 10.0 = Strongly Recommended
- 7.0 - 7.9 = Recommended
- 5.0 - 6.9 = Consider
- Below 5.0 = Not Recommended

The recommendation should be based on the quality of
the interview answers, not on the candidate's name,
gender, age, location, or other unrelated personal
characteristics.


RETURN ONLY VALID JSON

Return exactly this structure:

{{
    "message": "",
    "question": "",
    "interview_complete": false,

    "evaluation": {{
        "score": 0,
        "technical_correctness": 0,
        "understanding": 0,
        "relevance": 0,
        "problem_solving": 0,
        "communication": 0,
        "feedback": ""
    }},

    "final_evaluation": {{
        "overall_score": 0,
        "recommendation": "",
        "feedback": ""
    }}
}}


RULES FOR THE JSON:

- Scores in "evaluation" must be between 0 and 10.
- "evaluation" should evaluate the latest candidate answer.
- If there is no candidate answer yet, use 0 for evaluation
  scores and an empty feedback string.

- "final_evaluation" should only contain meaningful values
  when interview_complete is true.

- When interview_complete is false:

    "overall_score": 0
    "recommendation": ""
    "feedback": ""

- When interview_complete is true:
  calculate the overall interview score from the candidate's
  answers.

- "message" should contain a short natural acknowledgement
  followed by the next question.

- "question" should contain ONLY the next interview question.

- When interview_complete is true:
  "question" must be an empty string.

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

    try:
        return json.loads(text)

    except json.JSONDecodeError:
        # Try to extract JSON if Gemini added extra text
        start = text.find("{")
        end = text.rfind("}")

        if start != -1 and end != -1:
            json_text = text[start:end + 1]
            return json.loads(json_text)

        raise ValueError(
            "Gemini returned an invalid JSON response."
        )

def evaluate_interview(
    candidate,
    job,
    messages
):
    """
    Evaluate the candidate after the complete interview.

    Gemini receives:
    - Candidate profile
    - Job requirements
    - Complete interview conversation

    Returns:
    - Overall score
    - Category scores
    - Feedback
    - Recommendation
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
You are an expert technical interviewer and recruitment evaluator.

Evaluate the candidate based ONLY on the job requirements,
candidate profile, and the complete interview conversation.

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


COMPLETE INTERVIEW

{conversation_text}


EVALUATION RULES

1. Evaluate ONLY based on the candidate's actual answers.

2. Do not assume knowledge that the candidate did not demonstrate.

3. Compare the candidate's answers with the job requirements.

4. Consider the complete interview, not just one answer.

5. Do not penalize the candidate for not knowing technologies
   that are not required by the job.

6. Be objective and professional.

7. Give scores from 0 to 10.

8. Calculate an overall score from the category scores.

9. Recommendation rules:

   - SELECTED:
     Strong match for the role and overall score >= 7.

   - FURTHER REVIEW:
     Moderate match and overall score between 5 and 6.9.

   - REJECTED:
     Weak match or overall score < 5.

10. Give concise but useful feedback.

Return ONLY valid JSON.

Return exactly this structure:

{{
    "overall_score": 0,
    "technical_correctness": 0,
    "understanding": 0,
    "problem_solving": 0,
    "communication": 0,
    "relevance_to_role": 0,
    "recommendation": "",
    "feedback": ""
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