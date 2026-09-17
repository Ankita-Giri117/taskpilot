from uuid import uuid4

from tools.task_manager import register_document, list_documents


def test_list_documents():
    document_id_1 = f"list-test-{uuid4()}"
    document_id_2 = f"list-test-{uuid4()}"

    register_document(
        document_id=document_id_1,
        filename="first.txt",
        file_path="uploads/first.txt"
    )

    register_document(
        document_id=document_id_2,
        filename="second.pdf",
        file_path="uploads/second.pdf"
    )

    documents = list_documents()

    assert isinstance(documents, list)

    ids = [document["document_id"] for document in documents]

    assert document_id_1 in ids
    assert document_id_2 in ids


if __name__ == "__main__":
    test_list_documents()
    print("Document list test passed.")