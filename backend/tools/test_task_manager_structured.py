from task_manager import list_tasks


def test_structured_tasks():
    tasks = list_tasks()

    assert isinstance(tasks, list)

    for task in tasks:
        assert isinstance(task, dict)
        assert "id" in task
        assert "title" in task
        assert "completed" in task
        assert isinstance(task["id"], int)
        assert isinstance(task["title"], str)
        assert isinstance(task["completed"], bool)

    print("Structured task test passed.")
    print("\nTasks:")

    for task in tasks:
        print(task)


if __name__ == "__main__":
    test_structured_tasks()