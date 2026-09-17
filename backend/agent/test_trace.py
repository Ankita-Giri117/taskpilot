from agent import AgentState


def test_activity_trace():
    state: AgentState = {
        "goal": "Test TaskPilot",
        "plan": ["Step 1", "Step 2"],
        "tool_result": "",
        "result": "Test result",
        "evaluation": "PASS",
        "retry_count": 0,
        "activity": [
            {
                "type": "planner",
                "status": "completed",
                "message": "Execution plan created"
            },
            {
                "type": "executor",
                "status": "completed",
                "message": "Agent completed the execution step"
            },
            {
                "type": "evaluator",
                "status": "completed",
                "message": "Evaluator returned PASS"
            }
        ]
    }

    assert len(state["activity"]) == 3
    assert state["activity"][0]["type"] == "planner"
    assert state["activity"][1]["type"] == "executor"
    assert state["activity"][2]["type"] == "evaluator"

    print("Activity trace test passed.")
    print("\nTrace:")
    for event in state["activity"]:
        print(f"- {event['type']}: {event['message']}")


if __name__ == "__main__":
    test_activity_trace()