from tools.task_manager import register_document, get_document


def test_document_registry():
    document = register_document(
        "test-doc-001",
        "sample.txt",
        "uploads/sample.txt"
    )

    assert document["document_id"] == "test-doc-001"
    assert document["filename"] == "sample.txt"

    retrieved = get_document("test-doc-001")

    assert retrieved is not None
    assert retrieved["document_id"] == "test-doc-001"
    assert retrieved["filename"] == "sample.txt"
    assert retrieved["file_path"] == "uploads/sample.txt"


if __name__ == "__main__":
    test_document_registry()
    print("Document registry test passed.")