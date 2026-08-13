import os

from app.services.pdf_parser import extract_text_from_pdf
from app.services.docx_parser import extract_text_from_docx


def extract_text(file_path):

    extension = os.path.splitext(file_path)[1].lower()

    if extension == ".pdf":
        return extract_text_from_pdf(file_path)

    elif extension == ".docx":
        return extract_text_from_docx(file_path)

    else:
        raise ValueError("Unsupported File Format")