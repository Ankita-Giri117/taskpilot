from fastapi import FastAPI, HTTPException, UploadFile, File, Header
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import shutil
import uuid
import os
import secrets

from jose import jwt

from agent.agent import agent
from tools.task_manager import (
    create_task,
    list_tasks,
    complete_task,
    toggle_task,
    list_memory,
    register_document,
    list_documents,
    list_run_history,
    create_user,
    authenticate_user,
    set_current_user,
    get_run_history_item,
)
from tools.calendar_manager import (
    initialize_calendar_table,
    save_calendar_credentials,
    get_calendar_credentials,
)
from tools.calendar_service import get_calendar_service
from google_auth_oauthlib.flow import Flow


UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="TaskPilot API",
    description="Backend API for the TaskPilot Agentic AI system",
    version="1.0.0",
)

FRONTEND_URL = os.getenv("TASKPILOT_FRONTEND_URL", "http://localhost:5173")
raw_allowed = os.getenv(
    "ALLOWED_ORIGINS",
    f"http://localhost:5173,http://127.0.0.1:5173,{FRONTEND_URL}",
)
ALLOWED_ORIGINS = list(
    dict.fromkeys(origin.strip() for origin in raw_allowed.split(",") if origin.strip())
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


class AgentRequest(BaseModel):
    goal: str
    document_ids: list[str] = []


class AgentResponse(BaseModel):
    goal: str
    plan: list[str]
    tool_result: str
    evaluation: str
    result: str
    activity: list[dict]


class TaskCreateRequest(BaseModel):
    title: str


class TaskCompleteRequest(BaseModel):
    task_id: int


class AuthRequest(BaseModel):
    email: str
    password: str

JWT_SECRET = os.getenv("JWT_SECRET")

if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET is not configured. Add JWT_SECRET to the backend .env file."
    )

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60 * 24

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "http://127.0.0.1:8000/api/calendar/callback",
)

GOOGLE_CALENDAR_SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
]

TASKPILOT_FRONTEND_URL = os.getenv(
    "TASKPILOT_FRONTEND_URL",
    "http://localhost:5173",
)


# Ensure the Calendar credential table exists.
initialize_calendar_table()


def create_access_token(user_id: int, email: str):
    from datetime import datetime, timedelta, timezone

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=JWT_EXPIRATION_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def get_current_user(authorization: str | None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    token = authorization[7:].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

        user_id = payload.get("sub")
        email = payload.get("email")

        if not user_id or not email:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token.",
            )

        return {
            "id": int(user_id),
            "email": email,
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Authentication token has expired.",
        )

    except jwt.JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )


@app.post("/api/auth/signup")
def signup(request: AuthRequest):
    email = request.email.strip().lower()
    password = request.password

    if not email or "@" not in email:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address.",
        )

    if len(password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters.",
        )

    user = create_user(email, password)

    if user is None:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    token = create_access_token(
        user["id"],
        user["email"],
    )

    return {
        "message": "Account created successfully.",
        "token": token,
        "user": user,
    }


@app.post("/api/auth/login")
def login(request: AuthRequest):
    email = request.email.strip().lower()

    user = authenticate_user(
        email,
        request.password,
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    token = create_access_token(
        user["id"],
        user["email"],
    )

    return {
        "message": "Login successful.",
        "token": token,
        "user": user,
    }


@app.get("/api/auth/me")
def get_me(
    authorization: str | None = Header(default=None),
):
    return get_current_user(authorization)


@app.get("/")
def root():
    return {
        "message": "TaskPilot API is running",
    }


@app.get("/api/calendar/connect")
def connect_google_calendar(
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    set_current_user(user["id"])

    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Google Calendar OAuth is not configured.",
        )

    client_config = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [GOOGLE_REDIRECT_URI],
        }
    }

    # Generate the PKCE verifier explicitly so it is available before
    # the authorization URL is created.
    code_verifier = secrets.token_urlsafe(64)

    flow = Flow.from_client_config(
        client_config,
        scopes=GOOGLE_CALENDAR_SCOPES,
        code_verifier=code_verifier,
    )

    flow.redirect_uri = GOOGLE_REDIRECT_URI

    from datetime import datetime, timedelta, timezone

    state_payload = {
        "user_id": user["id"],
        "code_verifier": code_verifier,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
    }

    state = jwt.encode(
        state_payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )

    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state,
    )

    return {
        "authorization_url": authorization_url,
    }


@app.get("/api/calendar/callback")
def google_calendar_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):
    if error:
        raise HTTPException(
            status_code=400,
            detail=f"Google Calendar authorization failed: {error}",
        )

    if not code or not state:
        raise HTTPException(
            status_code=400,
            detail="Missing Google Calendar authorization data.",
        )

    try:
        state_payload = jwt.decode(
            state,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=400,
            detail="Google Calendar authorization state has expired. Please try again.",
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=400,
            detail="Invalid OAuth state. Please start the Calendar connection again.",
        )

    user_id = state_payload.get("user_id")
    code_verifier = state_payload.get("code_verifier")

    if not user_id or not code_verifier:
        raise HTTPException(
            status_code=400,
            detail="Invalid OAuth state. Please start the Calendar connection again.",
        )

    set_current_user(int(user_id))

    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Google Calendar OAuth is not configured.",
        )

    client_config = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [GOOGLE_REDIRECT_URI],
        }
    }

    flow = Flow.from_client_config(
        client_config,
        scopes=GOOGLE_CALENDAR_SCOPES,
        state=state,
        code_verifier=code_verifier,
    )

    flow.redirect_uri = GOOGLE_REDIRECT_URI

    flow.fetch_token(code=code)

    credentials = flow.credentials

    token_data = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": credentials.scopes,
    }

    save_calendar_credentials(token_data)

    return RedirectResponse(
        url=f"{TASKPILOT_FRONTEND_URL}/?calendar=connected"
    )


@app.get("/api/calendar/status")
def get_google_calendar_status(
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    set_current_user(user["id"])

    credentials = get_calendar_credentials()

    return {
        "connected": credentials is not None,
    }


@app.get("/api/calendar/events")
def get_google_calendar_events(
    authorization: str | None = Header(default=None)
):
    user = get_current_user(authorization)
    set_current_user(user["id"])

    try:
        calendar = get_calendar_service()

        events_result = (
            calendar.events()
            .list(
                calendarId="primary",
                timeMin=None,
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
                    "description": event.get("description"),
                    "html_link": event.get("htmlLink"),
                }
            )

        return {
            "events": formatted_events
        }

    except RuntimeError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        print(f"Google Calendar events fetch failed: {error}")

        raise HTTPException(
            status_code=500,
            detail="Unable to fetch Google Calendar events.",
        )

@app.get("/health")
def health():
    return {
        "status": "healthy",
    }


@app.post("/api/tasks")
def add_task(
    request: TaskCreateRequest,
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    set_current_user(user["id"])

    return {
        "message": create_task(request.title),
    }


@app.get("/api/tasks")
def get_tasks(
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    set_current_user(user["id"])

    return {
        "tasks": list_tasks(),
    }


@app.patch("/api/tasks/{task_id}/toggle")
def toggle_task_status(
    task_id: int,
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    set_current_user(user["id"])

    result = toggle_task(task_id)

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["error"],
        )

    return {
        "message": result,
    }


@app.post("/api/agent", response_model=AgentResponse)
def run_agent(
    request: AgentRequest,
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    set_current_user(user["id"])

    goal = request.goal.strip()

    if not goal:
        raise HTTPException(
            status_code=400,
            detail="Goal cannot be empty.",
        )

    try:
        response = agent.invoke(
            {
                "goal": goal,
                "document_ids": request.document_ids,
                "plan": [],
                "tool_result": "",
                "result": "",
                "evaluation": "",
                "evaluation_feedback": "",
                "retry_count": 0,
                "activity": [],
            }
        )

        return {
            "goal": goal,
            "plan": response["plan"],
            "tool_result": response["tool_result"],
            "evaluation": response["evaluation"],
            "result": response["result"],
            "activity": response["activity"],
        }

    except Exception as error:
        import traceback

        print("\n--- AGENT EXCEPTION TRACEBACK ---")
        traceback.print_exc()
        print("---------------------------------\n")

        error_message = str(error)
        lower_msg = error_message.lower()

        if "401" in error_message or "unauthorized" in lower_msg or "authentication" in lower_msg:
            raise HTTPException(
                status_code=502,
                detail=f"OpenRouter Authentication Failure: {error_message}",
            )

        if "429" in error_message or "quota" in lower_msg or "credits" in lower_msg or "rate limit" in lower_msg:
            raise HTTPException(
                status_code=429,
                detail=f"OpenRouter Rate Limit / Quota Exceeded: {error_message}",
            )

        raise HTTPException(
            status_code=500,
            detail=f"Agent Execution Failure: {error_message}",
        )


@app.post("/api/documents/upload")
def upload_document(
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    set_current_user(user["id"])

    allowed_extensions = {".txt", ".md", ".pdf"}
    safe_filename = Path(file.filename).name
    file_extension = Path(safe_filename).suffix.lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Supported types: TXT, MD, PDF.",
        )

    document_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{document_id}{file_extension}"

    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        document = register_document(
            document_id=document_id,
            filename=safe_filename,
            file_path=str(file_path),
        )

        return {
            "document_id": document["document_id"],
            "filename": document["filename"],
            "message": "Document uploaded successfully.",
        }

    except Exception:
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Unable to save the uploaded document.",
        )


@app.get("/api/documents")
def get_documents(
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    set_current_user(user["id"])

    documents = list_documents()

    return {
        "documents": [
            {
                "document_id": document["document_id"],
                "filename": document["filename"],
            }
            for document in documents
        ]
    }


@app.get("/api/memory")
def get_memory(
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    set_current_user(user["id"])

    return list_memory(20)


@app.get("/api/run-history")
def get_run_history(
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    set_current_user(user["id"])

    return list_run_history(20)


@app.get("/api/run-history/{run_id}")
def get_run_history_detail(
    run_id: int,
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization)
    set_current_user(user["id"])

    run = get_run_history_item(run_id)

    if run is None:
        raise HTTPException(
            status_code=404,
            detail="Run history item not found.",
        )

    return run
