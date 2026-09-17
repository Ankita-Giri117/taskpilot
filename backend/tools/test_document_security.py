from pathlib import Path

from tools.document_reader import read_document, UPLOAD_DIR


def test_uploaded_document_can_be_read():
    test_file = UPLOAD_DIR / "security_test.txt"
    test_file.write_text(
        "TaskPilot document security test.",
        encoding="utf-8"
    )

    result = read_document(str(test_file))

    assert result == "TaskPilot document security test."

    test_file.unlink()


def test_outside_file_is_blocked():
    outside_file = Path(__file__).resolve().parent.parent / ".env"

    result = read_document(str(outside_file))

    assert result.startswith("Access denied.")


if __name__ == "__main__":
    test_uploaded_document_can_be_read()
    test_outside_file_is_blocked()

    print("Document security test passed.")