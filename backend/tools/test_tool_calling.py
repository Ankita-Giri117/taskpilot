import json
import os

from dotenv import load_dotenv
from google import genai

from calculator import calculator


load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


calculator_tool = {
    "type": "function",
    "name": "calculator",
    "description": "Calculates a mathematical expression and returns the result.",
    "parameters": {
        "type": "object",
        "properties": {
            "expression": {
                "type": "string",
                "description": "A mathematical expression such as 25 * 4 or 100 / 5 + 10."
            }
        },
        "required": ["expression"]
    }
}


interaction = client.interactions.create(
    model="gemini-3.6-flash",
    input="Calculate 125 * 24 for me.",
    tools=[calculator_tool]
)


for step in interaction.steps:

    if step.type == "function_call":
        print("\n--- TOOL CALL ---")
        print("Tool:", step.name)
        print("Arguments:", step.arguments)

        arguments = step.arguments

        result = calculator(
            arguments["expression"]
        )

        print("Tool result:", result)

        final_interaction = client.interactions.create(
            model="gemini-3.6-flash",
            previous_interaction_id=interaction.id,
            input=[
                {
                    "type": "function_result",
                    "name": step.name,
                    "call_id": step.id,
                    "result": [
                        {
                            "type": "text",
                            "text": json.dumps({
                                "result": result
                            })
                        }
                    ]
                }
            ],
            tools=[calculator_tool]
        )

        print("\n--- FINAL ANSWER ---")
        print(final_interaction.output_text)