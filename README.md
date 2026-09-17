# TaskPilot — Agentic AI Task Management System

TaskPilot is an enterprise-grade, full-stack **Agentic AI Task Management System** that autonomously parses user goals, formulates multi-step execution plans, dynamically selects and invokes tools, evaluates execution results, and performs iterative replanning when required.

Built with **React**, **FastAPI**, **LangGraph**, and **OpenRouter**, TaskPilot combines modern AI agent capabilities with user authentication, document analysis, task management, conversation history, and Google Calendar integration.

---

## Key Features

- **Autonomous Agentic Loop**: Goal → Multi-step Planning → Tool Execution → Result Evaluation → Re-planning.
- **LangGraph Orchestration**: Robust state graph managing agent lifecycle and decision loops.
- **OpenRouter LLM Integration**: Multi-model support (`nvidia/nemotron-3-ultra-550b-a55b:free`, `openrouter/free`, `google/gemma-2-9b-it:free`, etc.).
- **Local Tool Ecosystem**:
  - `calculator`: Exact mathematical computation tool.
  - `create_task`, `list_tasks`, `complete_task`: Full task lifecycle management.
  - `read_document`: Document parsing for TXT, Markdown, and PDF files.
  - `list_calendar_events`, `create_calendar_event`: Google Calendar integration.
  - `web_search`: Real-time web research functionality.
- **User Authentication & Multi-User Isolation**: JWT token authentication with per-user task, document, memory, and run-history isolation.
- **Document Management**: Secure file upload registry (TXT, MD, PDF) with document selection for agent runs.
- **Agent Activity & Traceability**: Real-time activity feed tracking agent steps, decisions, and evaluations.
- **Agent History**: Interactive conversation history enabling users to review previous agent runs and execution details.
- **Light / Dark Visual System**: Fully responsive light/dark theme system tailored for readability across desktop and mobile devices.

---

## Architecture Overview

```text
React + Vite + Tailwind CSS
            │
            ▼
       FastAPI API
            │
            ▼
     LangGraph Agent
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
OpenRouter Tools  Memory
            │
    ┌───────┼───────────┬──────────┐
    ▼       ▼           ▼          ▼
 Tasks  Documents  Web Research Calendar
            │
            ▼
         SQLite
```

### Execution Flow

```text
User Goal
   │
   ▼
Planner Step (creates 3-5 step plan)
   │
   ▼
Executor Step (invokes tools iteratively)
   │
   ▼
Tool Execution (calculators, tasks, documents, calendar, web)
   │
   ▼
Evaluator Step (PASS or REPLAN decision)
   │
   ├──────────────┐
  PASS           REPLAN (Revises plan and re-executes)
   │
   ▼
Final Result saved to History & Memory
```

---

## Technology Stack

- **Frontend**: React 18, Vite 8, Tailwind CSS v4, Lucide React icons.
- **Backend**: Python 3.12, FastAPI, LangGraph, Python-dotenv, PyPDF, Python-Jose (JWT), SQLite.
- **LLM Provider**: OpenRouter API (`https://openrouter.ai/api/v1`).
- **Authentication**: JWT token-based auth with bcrypt password hashing.

---

## Local Setup Instructions

### 1. Clone & Navigate
```bash
git clone <repository-url>
cd "data agent"
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Install dependencies:
pip install -r requirements.txt
```

Create `backend/.env` based on `backend/.env.example`:
```env
JWT_SECRET=your-random-jwt-secret-key
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
TASKPILOT_FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 3. Start Backend Server
```bash
python -m uvicorn main:app --reload --port 8000
```
Backend API will be running at `http://127.0.0.1:8000`.

### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend will be running at `http://localhost:5173`.

---

## Production & Deployment Considerations

1. **Configurable API Base URL**:
   The frontend uses `import.meta.env.VITE_API_BASE_URL` (defaulting to `http://127.0.0.1:8000` for local development). For deployment, set `VITE_API_BASE_URL=https://your-backend-domain.com`.

2. **Backend CORS Configuration**:
   The backend reads `ALLOWED_ORIGINS` and `TASKPILOT_FRONTEND_URL` from environment variables to allow cross-origin requests from the deployed frontend domain.

3. **Google OAuth Redirect URI**:
   For Google Calendar integration in production, configure `GOOGLE_REDIRECT_URI=https://your-backend-domain.com/api/calendar/callback` in `backend/.env` and update the Google Cloud Console Authorized Redirect URIs.

4. **Database Persistence (SQLite)**:
   TaskPilot uses SQLite stored locally. When deploying to containerized cloud platforms (Render, Railway, Fly.io, AWS EC2, etc.), attach a **persistent disk/volume** to ensure data persistence across app restarts.

5. **File Upload Storage**:
   Uploaded documents are stored in `backend/uploads/`. Ensure persistent disk storage is mounted to `backend/uploads/` on cloud deployment platforms.

---

## Security Best Practices

- All API keys, secrets, and credentials remain in `.env` files which are strictly excluded from Git tracking via `.gitignore`.
- Password hashing using bcrypt.
- JWT tokens with expiration handling.
- Strict per-user isolation enforced across all database queries for tasks, documents, memories, and run history.

---

## Author

**TaskPilot Development Team**
