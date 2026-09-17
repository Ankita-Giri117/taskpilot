from tools.document_reader import read_document_by_id
from tools.task_manager import register_document
from tools.document_reader import UPLOAD_DIR


def test_read_document_by_id():
    document_id = "test-document-id-001"
    test_file = UPLOAD_DIR / "document_id_test.txt"

    test_file.write_text(
        "TaskPilot document ID test.",
        encoding="utf-8"
    )

    register_document(
        document_id=document_id,
        filename="document_id_test.txt",
        file_path=str(test_file)
    )

    result = read_document_by_id(document_id)

    assert result == "TaskPilot document ID test."

    test_file.unlink()


def test_missing_document():
    result = read_document_by_id("does-not-exist")

    assert result == "Document not found."


if __name__ == "__main__":
    test_read_document_by_id()
    test_missing_document()

    print("Document ID reader test passed.")