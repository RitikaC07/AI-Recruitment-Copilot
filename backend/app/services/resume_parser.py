import re
import spacy


# =========================================================
# LOAD SPACY MODEL
# =========================================================

nlp = spacy.load("en_core_web_sm")


# =========================================================
# INVALID NAME WORDS
# These words/phrases should NEVER be treated as names.
# =========================================================

INVALID_NAME_WORDS = {

    # -----------------------------------------------------
    # Programming Languages
    # -----------------------------------------------------

    "java",
    "python",
    "javascript",
    "typescript",
    "c",
    "c++",
    "c#",
    "ruby",
    "php",
    "kotlin",
    "swift",
    "go",
    "rust",

    # -----------------------------------------------------
    # Web Technologies
    # -----------------------------------------------------

    "html",
    "css",
    "react",
    "react js",
    "react.js",
    "angular",
    "vue",
    "node",
    "node js",
    "node.js",
    "express",
    "next js",
    "next.js",

    # -----------------------------------------------------
    # Databases
    # -----------------------------------------------------

    "mongodb",
    "mysql",
    "sql",
    "postgresql",
    "oracle",
    "redis",
    "firebase",

    # -----------------------------------------------------
    # Frameworks
    # -----------------------------------------------------

    "fastapi",
    "flask",
    "django",
    "spring",
    "spring boot",
    "laravel",

    # -----------------------------------------------------
    # AI / ML
    # -----------------------------------------------------

    "ai",
    "generative ai",
    "artificial intelligence",
    "machine learning",
    "deep learning",
    "natural language processing",
    "natural language",
    "nlp",
    "computer vision",
    "data science",
    "data analytics",
    "data analysis",
    "large language model",
    "large language models",
    "llm",
    "llms",

    # -----------------------------------------------------
    # Cloud / DevOps
    # -----------------------------------------------------

    "cloud",
    "cloud platform",
    "cloud computing",
    "aws",
    "azure",
    "google cloud",
    "gcp",
    "devops",
    "docker",
    "kubernetes",

    # -----------------------------------------------------
    # Resume Headings
    # -----------------------------------------------------

    "resume",
    "curriculum vitae",
    "cv",
    "profile",
    "summary",
    "professional summary",
    "objective",
    "career objective",
    "skills",
    "technical skills",
    "technical skill",
    "education",
    "experience",
    "work experience",
    "professional experience",
    "employment",
    "internship",
    "internships",
    "projects",
    "project",
    "certifications",
    "certification",
    "achievements",
    "achievement",
    "references",
    "links",
    "contact",
    "contact information",

    # -----------------------------------------------------
    # Job Titles
    # -----------------------------------------------------

    "software engineer",
    "software developer",
    "web developer",
    "frontend developer",
    "front end developer",
    "backend developer",
    "back end developer",
    "full stack developer",
    "fullstack developer",
    "full-stack developer",
    "developer",
    "engineer",
    "intern",
    "student",
    "data scientist",
    "data analyst",
    "machine learning engineer",
    "ai engineer",
    "software engineering",

    # -----------------------------------------------------
    # Other Technical Words
    # -----------------------------------------------------

    "technology",
    "technologies",
    "technology stack",
    "tech stack",
    "platform",
    "professional",
    "candidate",
    "experienced",
    "experienced se",
    "se",
    "associate",
    "manager",
    "lead",
}


# =========================================================
# ADDITIONAL TECHNICAL WORDS
# Used when validating individual words.
# =========================================================

TECHNICAL_WORDS = {

    "ai",
    "ml",
    "llm",
    "llms",
    "api",
    "aws",
    "azure",
    "gcp",
    "sql",
    "java",
    "python",
    "javascript",
    "typescript",
    "react",
    "angular",
    "vue",
    "node",
    "express",
    "mongodb",
    "mysql",
    "postgresql",
    "firebase",
    "fastapi",
    "flask",
    "django",
    "spring",
    "docker",
    "kubernetes",
    "cloud",
    "data",
    "software",
    "developer",
    "engineer",
    "technology",
    "technologies",
    "platform",
    "generative",
    "learning",
    "intelligence",
    "artificial",
    "machine",
    "frontend",
    "backend",
    "fullstack",
    "professional",
    "experienced",
    "experience",
    "skills",
    "education",
    "projects",
    "certifications",
    "intern",
    "student",
}


# =========================================================
# VALIDATE NAME
# =========================================================

def is_valid_name(name):

    if not name:
        return False

    # Normalize spaces
    name = " ".join(name.split()).strip()

    # Remove unwanted symbols from beginning/end
    name = re.sub(
        r"^[^A-Za-z]+|[^A-Za-z]+$",
        "",
        name
    )

    if not name:
        return False

    lower_name = name.lower()

    # -----------------------------------------------------
    # Exact invalid phrase
    # -----------------------------------------------------

    if lower_name in INVALID_NAME_WORDS:
        return False

    words = name.split()

    # -----------------------------------------------------
    # Normal candidate name should have 2-5 words
    # -----------------------------------------------------

    if len(words) < 2 or len(words) > 5:
        return False

    # -----------------------------------------------------
    # Validate every word
    # -----------------------------------------------------

    for word in words:

        # Allow names like:
        # Mary-Jane
        # O'Connor

        if not re.fullmatch(
            r"[A-Za-z]+(?:[-'][A-Za-z]+)?",
            word
        ):
            return False

        # Very long word is unlikely to be a name
        if len(word) > 20:
            return False

        # Reject technical words
        if word.lower() in TECHNICAL_WORDS:
            return False

    # -----------------------------------------------------
    # Reject obvious technical phrases
    # -----------------------------------------------------

    technical_patterns = [

        r"\bai\b",
        r"\bml\b",
        r"\bllm\b",
        r"\bllms\b",
        r"\bapi\b",
        r"\baws\b",
        r"\bazure\b",
        r"\bgcp\b",
        r"\bsql\b",
        r"\bjava\b",
        r"\bpython\b",
        r"\breact\b",
        r"\bnode\b",
        r"\bcloud\b",
        r"\bdata\b",
        r"\bsoftware\b",
        r"\bdeveloper\b",
        r"\bengineer\b",
        r"\btechnology\b",
        r"\btechnologies\b",
        r"\bplatform\b",
        r"\bgenerative\b",
        r"\blearning\b",
        r"\bintelligence\b",
        r"\bartificial\b",
        r"\bmachine\b",
        r"\bprofessional\b",
        r"\bexperienced\b",
        r"\bstudent\b",
        r"\bintern\b",
    ]

    for pattern in technical_patterns:

        if re.search(
            pattern,
            lower_name
        ):
            return False

    return True


# =========================================================
# CHECK WHETHER DOCUMENT LOOKS LIKE A RESUME
# =========================================================

def is_resume(text):

    if not text:
        return False

    lower_text = text.lower()

    # -----------------------------------------------------
    # Resume section keywords
    # -----------------------------------------------------

    resume_keywords = [

        "education",
        "experience",
        "work experience",
        "professional experience",
        "skills",
        "technical skills",
        "projects",
        "certifications",
        "achievements",
        "internship",
        "internships",
        "degree",
        "university",
        "college",
        "objective",
        "summary",
    ]

    matches = 0

    for keyword in resume_keywords:

        if keyword in lower_text:
            matches += 1

    # -----------------------------------------------------
    # Contact information
    # -----------------------------------------------------

    has_email = bool(
        re.search(
            r"[a-zA-Z0-9._%+-]+"
            r"@[a-zA-Z0-9.-]+"
            r"\.[a-zA-Z]{2,}",
            text
        )
    )

    has_phone = bool(
        re.search(
            r"\+?\d[\d\s().-]{7,}",
            text
        )
    )

    # -----------------------------------------------------
    # Resume normally has several sections.
    # -----------------------------------------------------

    if matches >= 3:
        return True

    # If it has 2 sections + contact information
    if matches >= 2 and (has_email or has_phone):
        return True

    return False


# =========================================================
# EXTRACT NAME
# =========================================================

def extract_name(text):

    if not text:
        return ""

    # -----------------------------------------------------
    # Normalize line endings
    # -----------------------------------------------------

    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # -----------------------------------------------------
    # Convert text into clean lines
    # -----------------------------------------------------

    lines = [

        " ".join(line.split()).strip()

        for line in text.splitlines()

        if line.strip()

    ]

    # =====================================================
    # METHOD 1
    # Explicit "Name: ..."
    # =====================================================

    for line in lines[:30]:

        match = re.match(

            r"^\s*"
            r"(?:name|candidate\s+name)"
            r"\s*[:\-]\s*"
            r"(.+?)"
            r"\s*$",

            line,

            re.IGNORECASE
        )

        if match:

            name = match.group(1).strip()

            if is_valid_name(name):

                return name

    # =====================================================
    # METHOD 2
    # Check top lines
    #
    # Candidate names are normally at the top of resumes.
    # =====================================================

    for line in lines[:15]:

        clean_line = re.sub(

            r"^[•\-\*\d\.\)\s]+",

            "",

            line

        ).strip()

        if not clean_line:
            continue

        lower_line = clean_line.lower()

        # -------------------------------------------------
        # Ignore email
        # -------------------------------------------------

        if "@" in clean_line:
            continue

        # -------------------------------------------------
        # Ignore URLs
        # -------------------------------------------------

        if re.search(

            r"(https?://|www\.|linkedin\.com|github\.com)",

            lower_line
        ):
            continue

        # -------------------------------------------------
        # Ignore phone numbers
        # -------------------------------------------------

        if re.search(

            r"\+?\d[\d\s().\-]{7,}",

            clean_line
        ):
            continue

        # -------------------------------------------------
        # Ignore anything containing digits
        # -------------------------------------------------

        if re.search(r"\d", clean_line):
            continue

        # -------------------------------------------------
        # Ignore lines containing separators
        # -------------------------------------------------

        if "|" in clean_line:
            continue

        # -------------------------------------------------
        # Ignore obvious headings
        # -------------------------------------------------

        if lower_line in INVALID_NAME_WORDS:
            continue

        # -------------------------------------------------
        # Ignore lines containing technical phrases
        # -------------------------------------------------

        invalid_phrase_found = False

        for invalid_word in INVALID_NAME_WORDS:

            if invalid_word in lower_line:

                invalid_phrase_found = True

                break

        if invalid_phrase_found:
            continue

        # -------------------------------------------------
        # Name should not be too long
        # -------------------------------------------------

        if len(clean_line) > 60:
            continue

        words = clean_line.split()

        # -------------------------------------------------
        # Candidate name should contain 2-5 words
        # -------------------------------------------------

        if not (2 <= len(words) <= 5):
            continue

        # -------------------------------------------------
        # Validate individual words
        # -------------------------------------------------

        valid_words = True

        for word in words:

            if not re.fullmatch(

                r"[A-Za-z]+(?:[-'][A-Za-z]+)?",

                word

            ):

                valid_words = False

                break

        if not valid_words:
            continue

        # -------------------------------------------------
        # Final validation
        # -------------------------------------------------

        if is_valid_name(clean_line):

            return clean_line

    # =====================================================
    # METHOD 3
    # spaCy PERSON detection
    #
    # IMPORTANT:
    # We validate the result before accepting it.
    # =====================================================

    top_text = "\n".join(lines[:25])

    doc = nlp(top_text)

    for ent in doc.ents:

        if ent.label_ != "PERSON":
            continue

        name = ent.text.strip()

        # Remove line breaks
        name = name.split("\n")[0].strip()

        # Normalize spaces
        name = " ".join(name.split())

        # Validate spaCy result
        if is_valid_name(name):

            return name

    # =====================================================
    # NO VALID NAME FOUND
    # =====================================================

    return ""


# =========================================================
# EMAIL
# =========================================================

def extract_email(text):

    pattern = (

        r"[a-zA-Z0-9._%+-]+"

        r"@[a-zA-Z0-9.-]+"

        r"\.[a-zA-Z]{2,}"

    )

    match = re.search(
        pattern,
        text
    )

    return match.group() if match else ""


# =========================================================
# PHONE
# =========================================================

def extract_phone(text):

    pattern = r"(\+?\d[\d\s\-]{8,}\d)"

    match = re.search(
        pattern,
        text
    )

    return match.group().strip() if match else ""


# =========================================================
# DEGREE
# =========================================================

def extract_degree(text):

    patterns = [

        r"(Bachelor of Technology \(B\.?Tech\) in [A-Za-z &]+)",

        r"(Bachelor of Engineering \(B\.?E\) in [A-Za-z &]+)",

        r"(Master of Technology \(M\.?Tech\) in [A-Za-z &]+)",

        r"(Master of Engineering \(M\.?E\) in [A-Za-z &]+)"

    ]

    for pattern in patterns:

        match = re.search(

            pattern,

            text,

            re.IGNORECASE

        )

        if match:

            return match.group().strip()

    return ""


# =========================================================
# COLLEGE
# =========================================================

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


# =========================================================
# CGPA
# =========================================================

def extract_cgpa(text):

    match = re.search(

        r"CGPA[:\s]*"
        r"([0-9]+(\.[0-9]+)?\/10)",

        text,

        re.IGNORECASE

    )

    if match:

        return match.group(1)

    return ""


# =========================================================
# GRADUATION YEAR
# =========================================================

def extract_graduation_year(text):

    match = re.search(

        r"Graduation[:\s]*(20\d{2})",

        text,

        re.IGNORECASE

    )

    if match:

        return match.group(1)

    return ""


# =========================================================
# SKILLS
# =========================================================

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

    return sorted(
        list(set(skills))
    )


# =========================================================
# PROJECTS
# =========================================================

def extract_projects(text):

    projects = []

    pattern = re.compile(

        r"(?im)^[ \t]*PROJECTS[ \t]*$"

    )

    matches = list(
        pattern.finditer(text)
    )

    if not matches:

        return []

    start = matches[-1].end()

    cert_match = re.search(

        r"(?im)^[ \t]*CERTIFICATIONS[ \t]*$",

        text[start:]

    )

    if cert_match:

        section = text[
            start:
            start + cert_match.start()
        ]

    else:

        section = text[start:]

    lines = [

        line.strip()

        for line in section.split("\n")

        if line.strip()

    ]

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

        if clean_line.lower().startswith(
            "tech stack"
        ):
            continue

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

        if clean_line.lower().startswith(
            description_words
        ):
            continue

        if len(clean_line) <= 120:

            projects.append(
                clean_line
            )

    return projects


# =========================================================
# EXPERIENCE
# =========================================================

def extract_experience(text):

    experience = []

    pattern = re.compile(

        r"(?im)^[ \t]*"

        r"(EXPERIENCE|WORK EXPERIENCE|INTERNSHIP|"
        r"INTERNSHIPS|PROFESSIONAL EXPERIENCE)"

        r"[ \t]*$"

    )

    matches = list(
        pattern.finditer(text)
    )

    if not matches:

        return []

    start = matches[-1].end()

    next_section = re.search(

        r"(?im)^[ \t]*"

        r"(PROJECTS|EDUCATION|TECHNICAL SKILLS|"
        r"SKILLS|CERTIFICATIONS|ACHIEVEMENTS|LINKS)"

        r"[ \t]*$",

        text[start:]

    )

    if next_section:

        section = text[
            start:
            start + next_section.start()
        ]

    else:

        section = text[start:]

    lines = [

        line.strip()

        for line in section.split("\n")

        if line.strip()

    ]

    for line in lines:

        line = re.sub(

            r"^[•\-\*\u2022]+\s*",

            "",

            line

        ).strip()

        if len(line) >= 3:

            experience.append(line)

    return experience


# =========================================================
# EXPERIENCE YEARS
# =========================================================

def calculate_experience_years(
    experience_text
):

    if not experience_text:

        return 0

    if isinstance(
        experience_text,
        list
    ):

        text = " ".join(

            str(item)

            for item in experience_text

        )

    else:

        text = str(
            experience_text
        )

    text = text.lower()

    year_matches = re.findall(

        r"(\d+(?:\.\d+)?)"
        r"\s*(?:years?|yrs?)",

        text

    )

    total_years = sum(

        float(value)

        for value in year_matches

    )

    month_matches = re.findall(

        r"(\d+(?:\.\d+)?)"
        r"\s*(?:months?|mos?)",

        text

    )

    total_years += sum(

        float(value) / 12

        for value in month_matches

    )

    return round(
        total_years,
        2
    )


# =========================================================
# CERTIFICATIONS
# =========================================================

def extract_certifications(text):

    certifications = []

    match = re.search(

        r"CERTIFICATIONS"

        r"(.*?)"

        r"(EXPERIENCE|PROJECTS|EDUCATION|"
        r"TECHNICAL SKILLS|$)",

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

        line = re.sub(

            r"^[•\-\*\d\.\)\s]+",

            "",

            line

        ).strip()

        if len(line) > 2:

            certifications.append(line)

    return certifications


# =========================================================
# LINKS
# =========================================================

def extract_links(text):

    links = {}

    github = re.search(

        r"(https?://)?"
        r"(www\.)?"
        r"github\.com/[A-Za-z0-9_.-]+",

        text,

        re.IGNORECASE

    )

    linkedin = re.search(

        r"(https?://)?"
        r"(www\.)?"
        r"linkedin\.com/in/[A-Za-z0-9_-]+",

        text,

        re.IGNORECASE

    )

    portfolio = re.search(

        r"https?://[A-Za-z0-9./_-]+",

        text,

        re.IGNORECASE

    )

    if github:

        links["github"] = github.group()

    if linkedin:

        links["linkedin"] = linkedin.group()

    if portfolio:

        url = portfolio.group()

        if (
            "github" not in url.lower()
            and
            "linkedin" not in url.lower()
        ):

            links["portfolio"] = url

    return links


# =========================================================
# MAIN RESUME PARSER
# =========================================================

def parse_resume(text):

    name = extract_name(text)

    candidate = {

        "is_resume":
            is_resume(text),

        "name":
            name,

        "name_found":
            bool(name),

        "email":
            extract_email(text),

        "phone":
            extract_phone(text),

        "education": {

            "degree":
                extract_degree(text),

            "college":
                extract_college(text),

            "cgpa":
                extract_cgpa(text),

            "graduation_year":
                extract_graduation_year(text)

        },

        "skills":
            extract_skills(text),

        "experience":
            extract_experience(text),

        "projects":
            extract_projects(text),

        "certifications":
            extract_certifications(text),

        "links":
            extract_links(text)

    }

    return candidate