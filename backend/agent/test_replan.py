from typing import TypedDict

from langgraph.graph import StateGraph, START, END


class TestState(TypedDict):
    retry_count: int
    evaluation: str
    plan: list[str]
    result: str


def executor(state: TestState):
    print("EXECUTOR RUNNING")

    return {
        "result": "Test result generated."
    }


def evaluator(state: TestState):
    print("EVALUATOR RUNNING")

    if state["retry_count"] == 0:
        return {"evaluation": "REPLAN"}

    return {"evaluation": "PASS"}


def decide_next_step(state: TestState):

    if state["evaluation"] == "PASS":
        return "finish"

    return "replan"


def replanner(state: TestState):
    print("REPLANNER RUNNING")

    return {
        "plan": ["Improved step 1", "Improved step 2"],
        "retry_count": state["retry_count"] + 1
    }


graph = StateGraph(TestState)

graph.add_node("executor", executor)
graph.add_node("evaluator", evaluator)
graph.add_node("replanner", replanner)

graph.add_edge(START, "executor")
graph.add_edge("executor", "evaluator")

graph.add_conditional_edges(
    "evaluator",
    decide_next_step,
    {
        "finish": END,
        "replan": "replanner"
    }
)

graph.add_edge("replanner", "executor")

agent = graph.compile()


result = agent.invoke({
    "retry_count": 0,
    "evaluation": "",
    "plan": [],
    "result": ""
})

print("\nFINAL STATE:")
print(result)