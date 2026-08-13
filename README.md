# AI Recruitment Copilot 🤖

An AI-powered recruitment and talent management platform that helps recruiters manage resumes, candidates, job postings, and AI-based candidate matching.

## 🚀 Overview

AI Recruitment Copilot is designed to simplify the recruitment process by combining resume parsing, candidate management, job posting, AI-powered matching, and skill-gap analysis in a single platform.

Recruiters can upload candidate resumes, extract candidate information, create job postings, compare candidates against job requirements, and use AI to analyze skill gaps.

## ✨ Features

### 📄 Resume Upload & Parsing
- Upload candidate resumes.
- Extract candidate information from resumes.
- Extract:
  - Name
  - Email
  - Phone
  - Skills
  - Education
  - Experience
  - Projects

### 👥 Candidate Management
- View all candidates.
- View extracted candidate information.
- Manage candidate profiles.
- Analyze candidates for specific job roles.

### 💼 Job Postings
- Create job postings.
- Add:
  - Job title
  - Company
  - Job description
  - Required skills
  - Minimum experience
- Define skill levels such as:
  - Required
  - Intermediate
  - Basic

### 🎯 AI Candidate Matching
Candidates are automatically compared against a selected job based on:

- Required skills
- Skill-level importance
- Candidate experience

The system calculates an overall match score and ranks candidates from highest to lowest match.

### 🧠 AI Skill-Gap Analysis
Gemini AI analyzes a candidate against a specific job and provides:

- Overall suitability
- Matched skills
- Missing skills
- Related skills
- Experience gap
- Skill-gap summary
- Recommendations

### 📊 Analytics
The application provides recruitment-related analytics and candidate insights.

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- Axios
- Lucide React

### Backend
- Python
- FastAPI
- Uvicorn

### Database
- MongoDB
- Motor / PyMongo

### AI
- Google Gemini API

### Resume Processing
- PDF parsing
- DOCX parsing
- Resume text extraction

## 📁 Project Structure

```text
AI-Recruitment-Copilot/
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── ...
│   │
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
⚙️ Installation & Setup
1. Clone the repository
git clone https://github.com/RitikaC07/AI-Recruitment-Copilot.git
cd AI-Recruitment-Copilot
🔹 Backend Setup

Open a terminal in the project root.

cd backend

Create a virtual environment:

python -m venv venv

Activate it on Windows:

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt
Environment Variables

Create a .env file inside the backend folder.

MONGODB_URL=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key

Do not commit your .env file to GitHub.

Start the Backend
uvicorn app.main:app --reload

The backend will run at:

http://127.0.0.1:8000

FastAPI documentation:

http://127.0.0.1:8000/docs
🔹 Frontend Setup

Open another terminal:

cd frontend

Install dependencies:

npm install

Start the development server:

npm run dev

The frontend will be available at:

http://localhost:5173
🎯 Candidate Matching Logic

The matching system evaluates candidates using both skill relevance and experience.

Skill Levels
Skill Level	Weight
Required	1.0
Intermediate	0.7
Basic	0.4

The skill score is calculated using the weighted skills matched by the candidate.

The final match score combines:

Skill score — 80%
Experience score — 20%

Candidates are then ranked from the highest match score to the lowest.

Match Categories
Score	Recommendation
80–100%	Strong Match
60–79%	Good Match
40–59%	Partial Match
Below 40%	Low Match
🧠 AI Skill-Gap Analysis

The platform uses Google Gemini to analyze the relationship between a candidate's profile and a selected job.

The AI considers:

Candidate skills
Candidate experience
Education
Projects
Job description
Required skills
Required experience

It then generates structured skill-gap information and recommendations.

🔄 Application Flow
Recruiter
    │
    ▼
Upload Resume
    │
    ▼
Resume Parser
    │
    ▼
Candidate Profile
    │
    ▼
Create Job Posting
    │
    ▼
Select Job
    │
    ▼
Candidate Matching
    │
    ├── Skill Matching
    ├── Experience Matching
    └── Match Score
    │
    ▼
Rank Candidates
    │
    ▼
AI Skill-Gap Analysis
    │
    ▼
Recruiter Insights