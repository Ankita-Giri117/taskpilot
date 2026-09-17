from tools.tool_registry import execute_tool


def test_calculator():
    result = execute_tool(
        "calculator",
        {"expression": "15 * 8"}
    )

    assert result["success"] is True
    assert result["result"] == "120"


def test_create_task():
    result = execute_tool(
        "create_task",
        {"title": "Registry integration test"}
    )

    assert result["success"] is True
    assert result["result"]["title"] == "Registry integration test"
    assert result["result"]["completed"] is False


def test_list_tasks():
    result = execute_tool(
        "list_tasks",
        {}
    )

    assert result["success"] is True
    assert isinstance(result["result"], list)


def test_unknown_tool():
    result = execute_tool(
        "does_not_exist",
        {}
    )

    assert result["success"] is False


if __name__ == "__main__":
    test_calculator()
    test_create_task()
    test_list_tasks()
    test_unknown_tool()

    print("Tool registry integration test passed.")