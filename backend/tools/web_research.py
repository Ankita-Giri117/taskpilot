import os

from dotenv import load_dotenv
from google import genai


load_dotenv()


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def web_research(query: str) -> str:
    try:
        interaction = client.interactions.create(
            model="gemini-3.6-flash",
            input=query,
            tools=[
                {
                    "type": "google_search"
                }
            ]
        )

        return interaction.output_text

    except Exception as error:
        return f"Web research failed: {error}"