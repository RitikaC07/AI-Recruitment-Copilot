import re
import spacy

# Load spaCy English model
nlp = spacy.load("en_core_web_sm")


def extract_name(text):

    # First preference: Name: <candidate name>
    match = re.search(
        r"Name\s*:\s*([A-Za-z]+(?:[ \t]+[A-Za-z]+)*)",
        text,
        re.IGNORECASE
    )

    if match:
        return match.group(1).strip()

    # Second preference: spaCy
    doc = nlp(text)

    for ent in doc.ents:
        if ent.label_ == "PERSON":
            name = ent.text.strip()

            # Keep only the first line
            name = name.split("\n")[0].strip()

            return name

    return ""

def extract_email(text):
    pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

    match = re.search(pattern, text)

    return match.group() if match else ""

def extract_phone(text):
    pattern = r"(\+?\d[\d\s\-]{8,}\d)"

    match = re.search(pattern, text)

    return match.group().strip() if match else ""

def extract_degree(text):

    patterns = [

        r"(Bachelor of Technology \(B\.?Tech\) in [A-Za-z &]+)",

        r"(Bachelor of Engineering \(B\.?E\) in [A-Za-z &]+)",

        r"(Master of Technology \(M\.?Tech\) in [A-Za-z &]+)",

        r"(Master of Engineering \(M\.?E\) in [A-Za-z &]+)"

    ]

    for pattern in patterns:

        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            return match.group().strip()

    return ""

def extract_college(text):

    lines = text.split("\n")

    keywords = [
        "Institute",
        "University",
        "College",
        "School"
    ]

    for line in lines:

        for word in keywords:

            if word.lower() in line.lower():
                return line.strip()

    return ""

def extract_cgpa(text):

    match = re.search(r"CGPA[:\s]*([0-9]+(\.[0-9]+)?\/10)", text, re.IGNORECASE)

    if match:
        return match.group(1)

    return ""

def extract_graduation_year(text):

    match = re.search(r"Graduation[:\s]*(20\d{2})", text)

    if match:
        return match.group(1)

    return ""

SKILLS_DB = [

    "Python",
    "Java",
    "JavaScript",
    "HTML",
    "CSS",

    "React",
    "Node.js",
    "Express",

    "MongoDB",
    "MySQL",
    "SQL",

    "FastAPI",
    "Flask",

    "Machine Learning",
    "Deep Learning",
    "NLP",

    "Git",
    "GitHub",

    "Data Structures",
    "Algorithms",
    "OOP"
]
def extract_skills(text):

    skills = []

    lower = text.lower()

    for skill in SKILLS_DB:

        if skill.lower() in lower:
            skills.append(skill)

    return sorted(list(set(skills)))

def extract_projects(text):
    projects = []

    # Find all PROJECTS headings
    pattern = re.compile(
        r"(?im)^[ \t]*PROJECTS[ \t]*$"
    )

    matches = list(pattern.finditer(text))

    if not matches:
        return []

    # Use the last PROJECTS heading
    start = matches[-1].end()

    # Find certifications after projects
    cert_match = re.search(
        r"(?im)^[ \t]*CERTIFICATIONS[ \t]*$",
        text[start:]
    )

    if cert_match:
        section = text[start:start + cert_match.start()]
    else:
        section = text[start:]

    lines = [
        line.strip()
        for line in section.split("\n")
        if line.strip()
    ]

    # Section headings that should never be treated as projects
    ignored = {
        "PROJECTS",
        "INTERNSHIP",
        "INTERNSHIPS",
        "EXPERIENCE",
        "EDUCATION",
        "TECHNICAL SKILLS",
        "SKILLS",
        "CERTIFICATIONS",
        "ACHIEVEMENTS",
        "LINKS"
    }

    for line in lines:

        clean_line = re.sub(
            r"^[•\-\*\d\.\)\s]+",
            "",
            line
        ).strip()

        if not clean_line:
            continue

        if clean_line.upper() in ignored:
            continue

        # Ignore technology/detail lines
        if clean_line.lower().startswith("tech stack"):
            continue

        # Ignore descriptive sentences
        description_words = (
            "developed",
            "built",
            "implemented",
            "designed",
            "integrated",
            "proposed",
            "created",
            "used",
            "enabling",
            "allowing",
            "automated",
            "achieved",
            "features",
            "developing"
        )

        if clean_line.lower().startswith(description_words):
            continue

        # Project titles are usually relatively short
        if len(clean_line) <= 120:
            projects.append(clean_line)

    return projects

def extract_experience(text):
    experience = []

    # Look specifically for a section heading
    pattern = re.compile(
        r"(?im)^[ \t]*(EXPERIENCE|WORK EXPERIENCE|INTERNSHIP|INTERNSHIPS|PROFESSIONAL EXPERIENCE)[ \t]*$"
    )

    matches = list(pattern.finditer(text))

    if not matches:
        return []

    # Use the last actual section heading
    start = matches[-1].end()

    # Find the next major section
    next_section = re.search(
        r"(?im)^[ \t]*(PROJECTS|EDUCATION|TECHNICAL SKILLS|SKILLS|CERTIFICATIONS|ACHIEVEMENTS|LINKS)[ \t]*$",
        text[start:]
    )

    if next_section:
        section = text[start:start + next_section.start()]
    else:
        section = text[start:]

    lines = [
        line.strip()
        for line in section.split("\n")
        if line.strip()
    ]

    for line in lines:

        line = re.sub(r"^[•\-\*\u2022]+\s*", "", line).strip()

        if len(line) >= 3:
            experience.append(line)

    return experience

def calculate_experience_years(experience_text):
    """
    Convert extracted experience into years.

    Handles:
    - "3 Years" -> 3
    - "2.5 Years" -> 2.5
    - "6 Months" -> 0.5
    - ["3 Years"] -> 3
    - ["Internship - 6 Months"] -> 0.5
    """

    if not experience_text:
        return 0

    # Your parser returns a list
    if isinstance(experience_text, list):
        text = " ".join(
            str(item) for item in experience_text
        )
    else:
        text = str(experience_text)

    text = text.lower()

    # Find years
    year_matches = re.findall(
        r"(\d+(?:\.\d+)?)\s*(?:years?|yrs?)",
        text
    )

    total_years = sum(
        float(value)
        for value in year_matches
    )

    # Find months
    month_matches = re.findall(
        r"(\d+(?:\.\d+)?)\s*(?:months?|mos?)",
        text
    )

    total_years += sum(
        float(value) / 12
        for value in month_matches
    )

    return round(total_years, 2)

def extract_certifications(text):
    certifications = []

    match = re.search(
        r"CERTIFICATIONS(.*?)(EXPERIENCE|PROJECTS|EDUCATION|TECHNICAL SKILLS|$)",
        text,
        re.DOTALL | re.IGNORECASE
    )

    if not match:
        return []

    section = match.group(1)

    lines = [
        line.strip()
        for line in section.split("\n")
        if line.strip()
    ]

    for line in lines:

        # Ignore bullet points
        line = re.sub(r"^[•\-\*\d\.\)\s]+", "", line).strip()

        if len(line) > 2:
            certifications.append(line)

    return certifications

def extract_links(text):
    links = {}

    github = re.search(
        r"(https?://)?(www\.)?github\.com/[A-Za-z0-9_.-]+",
        text,
        re.IGNORECASE,
    )

    linkedin = re.search(
        r"(https?://)?(www\.)?linkedin\.com/in/[A-Za-z0-9_-]+",
        text,
        re.IGNORECASE,
    )

    portfolio = re.search(
        r"https?://[A-Za-z0-9./_-]+",
        text,
        re.IGNORECASE,
    )

    if github:
        links["github"] = github.group()

    if linkedin:
        links["linkedin"] = linkedin.group()

    if portfolio:
        url = portfolio.group()

        if "github" not in url.lower() and "linkedin" not in url.lower():
            links["portfolio"] = url

    return links

def parse_resume(text):

    candidate = {

        "name": extract_name(text),

        "email": extract_email(text),

        "phone": extract_phone(text),

        "education": {

            "degree": extract_degree(text),

            "college": extract_college(text),

            "cgpa": extract_cgpa(text),

            "graduation_year": extract_graduation_year(text)

        },

        "skills": extract_skills(text),

        "experience": extract_experience(text),

        "projects": extract_projects(text),

        "certifications": extract_certifications(text),

        "links": extract_links(text)

    }

    return candidate