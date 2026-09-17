from pathlib import Path
from pypdf import PdfReader
from tools.task_manager import get_document

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"


def read_document(file_path: str) -> str:
    path = Path(file_path).resolve()
    upload_dir = UPLOAD_DIR.resolve()

    if upload_dir not in path.parents:
        return "Access denied. Documents can only be read from the uploads directory."

    if not path.exists():
        return "File not found."

    if not path.is_file():
        return "The provided path is not a file."

    try:
        if path.suffix.lower() in [".txt", ".md"]:
            return path.read_text(encoding="utf-8")

        if path.suffix.lower() == ".pdf":
            reader = PdfReader(str(path))
            text = []

            for page in reader.pages:
                page_text = page.extract_text()

                if page_text:
                    text.append(page_text)

            if not text:
                return "No readable text found in the PDF."

            return "\n".join(text)

        return "Unsupported file type. Supported types: TXT, MD, PDF."

    except Exception as error:
        return f"Unable to read document: {error}"

def read_document_by_id(document_id: str) -> str:
    document = get_document(document_id)

    if document is None:
        return "Document not found."

    return read_document(document["file_path"])       