import json

from tools.calculator import calculator
from tools.task_manager import (
    create_task,
    list_tasks,
    complete_task,
)
from tools.document_reader import read_document_by_id
from tools.calendar_service import get_calendar_service


# OpenAI-compatible function definitions sent to OpenRouter.
TOOL_DEFINITIONS = [
    {
        "type": "function",
        "name": "calculator",
        "description": "Calculates a mathematical expression and returns the result.",
        "parameters": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "A mathematical expression such as 25 * 4.",
                }
            },
            "required": ["expression"],
        },
    },
    {
        "type": "function",
        "name": "create_task",
        "description": "Creates a new task and stores it in the task database.",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "The title of the task to create.",
                }
            },
            "required": ["title"],
        },
    },
    {
        "type": "function",
        "name": "list_tasks",
        "description": "Lists all tasks currently stored in the task database.",
        "parameters": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "type": "function",
        "name": "complete_task",
        "description": "Marks an existing task as completed using its task ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "integer",
                    "description": "The ID of the task to mark as completed.",
                }
            },
            "required": ["task_id"],
        },
    },
    {
        "type": "function",
        "name": "read_document",
        "description": "Reads an uploaded TXT, MD, or PDF document using its document ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "document_id": {
                    "type": "string",
                    "description": "The ID of an uploaded document.",
                }
            },
            "required": ["document_id"],
        },
    },
    {
        "type": "function",
        "name": "list_calendar_events",
        "description": "Lists the user's upcoming Google Calendar events.",
        "parameters": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "type": "function",
        "name": "create_calendar_event",
        "description": "Creates a new event in the user's primary Google Calendar.",
        "parameters": {
            "type": "object",
            "properties": {
                "summary": {
                    "type": "string",
                    "description": "The title of the calendar event.",
                },
                "start_datetime": {
                    "type": "string",
                    "description": "Event start time in ISO 8601/RFC3339 format.",
                },
                "end_datetime": {
                    "type": "string",
                    "description": "Event end time in ISO 8601/RFC3339 format.",
                },
                "description": {
                    "type": "string",
                    "description": "Optional event description.",
                },
                "location": {
                    "type": "string",
                    "description": "Optional event location.",
                },
                "time_zone": {
                    "type": "string",
                    "description": "IANA timezone. Defaults to Asia/Kolkata.",
                },
            },
            "required": ["summary", "start_datetime", "end_datetime"],
        },
    },
]


# OpenRouter server-side web search.
# OpenRouter executes this itself; no local Python implementation is required.
BUILT_IN_TOOLS = [
    {
        "type": "openrouter:web_search",
    }
]


def list_calendar_events():
    try:
        calendar = get_calendar_service()

        events_result = (
            calendar.events()
            .list(
                calendarId="primary",
                maxResults=10,
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )

        events = events_result.get("items", [])
        formatted_events = []

        for event in events:
            start = event.get("start", {})
            end = event.get("end", {})

            formatted_events.append(
                {
                    "id": event.get("id"),
                    "summary": event.get("summary", "Untitled event"),
                    "start": start.get("dateTime") or start.get("date"),
                    "end": end.get("dateTime") or end.get("date"),
                    "location": event.get("location"),
                    "html_link": event.get("htmlLink"),
                }
            )

        return {
            "success": True,
            "message": "Calendar events retrieved successfully.",
            "events": formatted_events,
        }

    except Exception as error:
        return {
            "success": False,
            "error": str(error),
        }


def create_calendar_event(
    summary,
    start_datetime,
    end_datetime,
    description=None,
    location=None,
    time_zone="Asia/Kolkata",
):
    try:
        calendar = get_calendar_service()

        event_body = {
            "summary": summary,
            "start": {
                "dateTime": start_datetime,
                "timeZone": time_zone,
            },
            "end": {
                "dateTime": end_datetime,
                "timeZone": time_zone,
            },
        }

        if description:
            event_body["description"] = description

        if location:
            event_body["location"] = location

        created_event = (
            calendar.events()
            .insert(
                calendarId="primary",
                body=event_body,
            )
            .execute()
        )

        return {
            "success": True,
            "message": "Calendar event created successfully.",
            "event": {
                "id": created_event.get("id"),
                "summary": created_event.get("summary"),
                "start": created_event.get("start", {}).get("dateTime"),
                "end": created_event.get("end", {}).get("dateTime"),
                "location": created_event.get("location"),
                "html_link": created_event.get("htmlLink"),
            },
        }

    except Exception as error:
        return {
            "success": False,
            "error": str(error),
        }


TOOL_FUNCTIONS = {
    "calculator": {
        "function": calculator,
        "category": "calculation",
    },
    "create_task": {
        "function": create_task,
        "category": "task_management",
    },
    "list_tasks": {
        "function": list_tasks,
        "category": "task_management",
    },
    "complete_task": {
        "function": complete_task,
        "category": "task_management",
    },
    "read_document": {
        "function": read_document_by_id,
        "category": "document",
    },
    "list_calendar_events": {
        "function": list_calendar_events,
        "category": "calendar",
    },
    "create_calendar_event": {
        "function": create_calendar_event,
        "category": "calendar",
    },
}

def execute_tool(name: str, arguments: dict):
    """Execute one local Python tool safely."""
    if name not in TOOL_FUNCTIONS:
        return {
            "success": False,
            "error": f"Unknown tool: {name}",
        }

    try:
        if not isinstance(arguments, dict):
            raise ValueError("Tool arguments must be a JSON object.")

        result = TOOL_FUNCTIONS[name]["function"](**arguments)

        return {
            "success": True,
            "result": result,
        }

    except Exception as error:
        return {
            "success": False,
            "error": str(error),
        }


def format_tool_result(result):
    return json.dumps(result, default=str)
