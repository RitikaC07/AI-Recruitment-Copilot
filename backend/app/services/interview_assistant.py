import os
import json
import re
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

    # ---------------------------------------------------------
    # Build conversation text
    # ---------------------------------------------------------

    conversation_text = ""

    for message in messages:

        sender = (
            "AI Interviewer"
            if message.get("sender") == "ai"
            else "Candidate"
        )

        conversation_text += (
            f"{sender}: {message.get('text', '')}\n"
        )

    # ---------------------------------------------------------
    # Evaluation prompt
    # ---------------------------------------------------------

    prompt = f"""
You are an expert technical interviewer and recruitment evaluator.

Evaluate the candidate based ONLY on:

1. Candidate profile
2. Job requirements
3. Complete interview conversation

Do NOT assume knowledge that the candidate did not demonstrate.

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

Evaluate the candidate objectively.

Give each category a score from 0 to 10:

- technical_correctness
- understanding
- problem_solving
- communication
- relevance_to_role

Calculate overall_score as the average of these five scores.

Recommendation rules:

SELECTED:
overall_score >= 7

FURTHER REVIEW:
overall_score >= 5 and overall_score < 7

REJECTED:
overall_score < 5

Do not give SELECTED unless the candidate demonstrated sufficient knowledge
during the interview.

Give concise and useful feedback.

IMPORTANT:

Return ONLY valid JSON.

Do NOT use markdown.

Do NOT use ```json.

Do NOT include any text before or after the JSON.

Return exactly:

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

    # ---------------------------------------------------------
    # Call Gemini
    # ---------------------------------------------------------

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

    except Exception as e:

        print("Gemini evaluation error:", str(e))

        raise Exception(
            f"Gemini evaluation failed: {str(e)}"
        )

    # ---------------------------------------------------------
    # Get Gemini response
    # ---------------------------------------------------------

    if not response or not response.text:

        raise Exception(
            "Gemini returned an empty evaluation response."
        )

    text = response.text.strip()

    print("RAW GEMINI EVALUATION:")
    print(text)

    # ---------------------------------------------------------
    # Remove markdown code fences if Gemini adds them
    # ---------------------------------------------------------

    text = text.replace("```json", "")
    text = text.replace("```JSON", "")
    text = text.replace("```", "")
    text = text.strip()

    # ---------------------------------------------------------
    # Extract JSON object
    #
    # This protects against Gemini returning something like:
    #
    # Here is the evaluation:
    # { ... }
    # ---------------------------------------------------------

    match = re.search(
        r"\{[\s\S]*\}",
        text
    )

    if not match:

        raise Exception(
            "Gemini did not return valid JSON."
        )

    json_text = match.group(0)

    # ---------------------------------------------------------
    # Parse JSON
    # ---------------------------------------------------------

    try:

        evaluation = json.loads(json_text)

    except json.JSONDecodeError as e:

        print("JSON parsing error:", str(e))
        print("Gemini response:", json_text)

        raise Exception(
            f"Invalid JSON returned by Gemini: {str(e)}"
        )

    # ---------------------------------------------------------
    # Validate required fields
    # ---------------------------------------------------------

    required_fields = [
        "technical_correctness",
        "understanding",
        "problem_solving",
        "communication",
        "relevance_to_role"
    ]

    for field in required_fields:

        if field not in evaluation:

            evaluation[field] = 0

        try:

            evaluation[field] = float(
                evaluation[field]
            )

        except (ValueError, TypeError):

            evaluation[field] = 0

        # Keep score between 0 and 10
        evaluation[field] = max(
            0,
            min(
                10,
                evaluation[field]
            )
        )

    # ---------------------------------------------------------
    # Calculate overall score ourselves
    #
    # This prevents Gemini from giving an incorrect average.
    # ---------------------------------------------------------

    scores = [
        evaluation["technical_correctness"],
        evaluation["understanding"],
        evaluation["problem_solving"],
        evaluation["communication"],
        evaluation["relevance_to_role"]
    ]

    overall_score = sum(scores) / len(scores)

    evaluation["overall_score"] = round(
        overall_score,
        1
    )

    # ---------------------------------------------------------
    # Determine recommendation ourselves
    # ---------------------------------------------------------

    if overall_score >= 7:

        evaluation["recommendation"] = "SELECTED"

    elif overall_score >= 5:

        evaluation["recommendation"] = "FURTHER REVIEW"

    else:

        evaluation["recommendation"] = "REJECTED"

    # ---------------------------------------------------------
    # Make sure feedback exists
    # ---------------------------------------------------------

    if not evaluation.get("feedback"):

        evaluation["feedback"] = (
            "The candidate was evaluated based on "
            "their interview responses and job requirements."
        )

    # ---------------------------------------------------------
    # Return final evaluation
    # ---------------------------------------------------------

    print("FINAL EVALUATION:")
    print(evaluation)

    return evaluation