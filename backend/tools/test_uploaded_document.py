from pathlib import Path
from document_reader import read_document


UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"


def test_uploaded_document():
    files = list(UPLOAD_DIR.glob("*"))

    assert files, "No uploaded files found."

    file_path = files[0]

    content = read_document(str(file_path))

    assert content
    assert "TaskPilot" in content

    print("Uploaded document reader test passed.")
    print("\nFile:", file_path.name)
    print("\nContent:")
    print(content)


if __name__ == "__main__":
    test_uploaded_document()