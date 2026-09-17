import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bot,
  RefreshCw,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CalendarDays,
  ExternalLink,
  FileText,
  Globe,
  Layers,
  LayoutDashboard,
  Loader2,
  Menu,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  Wrench,
  X,
  Zap,
  LogOut,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function App() {
  const [goal, setGoal] = useState("");
  const [status, setStatus] = useState("Idle");
  const [running, setRunning] = useState(false);
  const [plan, setPlan] = useState([]);
  const [memories, setMemories] = useState([]);
  const [runHistory, setRunHistory] = useState([]);
  const [activities, setActivities] = useState([]);
  const [evaluation, setEvaluation] = useState("");
  const [result, setResult] = useState("");
  const [tasks, setTasks] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [backendStatus, setBackendStatus] = useState("checking");
  const [activeView, setActiveView] = useState("dashboard");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [runDetailLoading, setRunDetailLoading] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarEventsLoading, setCalendarEventsLoading] = useState(false);
  const [calendarEventsError, setCalendarEventsError] = useState("");

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("taskpilot-theme") !== "light";
  });

  const [showLanding, setShowLanding] = useState(() => {
    return !localStorage.getItem("taskpilot-token");
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("taskpilot-token");

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  };
  const handleUnauthorized = (response) => {
    if (response.status === 401) {
      handleLogout();
      return true;
    }

    return false;
  };

  const [authMode, setAuthMode] = useState("login");
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem("taskpilot-token"));
  });
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const handleAuth = async (event) => {
    event.preventDefault();

    setAuthError("");

    if (!authEmail.trim() || !authPassword) {
      setAuthError("Please enter your email and password.");
      return;
    }

    setAuthLoading(true);

    try {
      const endpoint =
        authMode === "login"
          ? `${API_BASE_URL}/api/auth/login`
          : `${API_BASE_URL}/api/auth/signup`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed.");
      }

      localStorage.setItem("taskpilot-token", data.token);

      setCurrentUser(data.user);
      setIsAuthenticated(true);
      setAuthEmail("");
      setAuthPassword("");
      setAuthError("");
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("taskpilot-token");

    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthEmail("");
    setAuthPassword("");
    setAuthError("");
    setAuthMode("login");
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend unavailable");
        }

        return response.json();
      })
      .then(() => {
        setBackendStatus("connected");
      })
      .catch(() => {
        setBackendStatus("offline");
      });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light-mode", !isDarkMode);
    localStorage.setItem("taskpilot-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const loadTasks = async () => {
    setTasksLoading(true);
    setTaskError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        headers: getAuthHeaders(),
      });
      if (handleUnauthorized(response)) {
        return;
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load tasks");
      }

      const allTasks = data.tasks || [];

      setTasks(allTasks.filter((task) => !task.completed).slice(0, 7));
      setTaskHistory(allTasks.filter((task) => task.completed));
    } catch (error) {
      console.error("Task loading failed:", error);
      setTaskError(error.message);
    } finally {
      setTasksLoading(false);
    }
  };

  const loadDocuments = async () => {
    setDocumentsLoading(true);
    setDocumentError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        headers: getAuthHeaders(),
      });
      if (handleUnauthorized(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load documents");
      }

      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Document loading failed:", error);
      setDocumentError(error.message);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile || documentUploading) return;

    setDocumentUploading(true);
    setDocumentError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/documents/upload`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        },
      );
      if (handleUnauthorized(response)) {
        return;
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to upload document");
      }

      setSelectedFile(null);

      const fileInput = document.getElementById("document-upload");
      if (fileInput) {
        fileInput.value = "";
      }

      await loadDocuments();
    } catch (error) {
      console.error("Document upload failed:", error);
      setDocumentError(error.message);
    } finally {
      setDocumentUploading(false);
    }
  };

  const addTask = async () => {
    if (!taskTitle.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          title: taskTitle.trim(),
        }),
      });
      if (handleUnauthorized(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to create task");
      }

      setTaskTitle("");

      const newTask = data.message;

      setTasks((currentTasks) => [newTask, ...currentTasks].slice(0, 7));
    } catch (error) {
      console.error("Task creation failed:", error);
      setTaskError(error.message);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode((current) => !current);
  };

  const toggleTask = async (taskId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tasks/${taskId}/toggle`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        },
      );
      if (handleUnauthorized(response)) {
        return;
      }
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to update task");
      }

      const updatedTask = data.message;

      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === taskId ? updatedTask : task)),
      );

      if (updatedTask.completed) {
        setTaskHistory((currentHistory) => [
          updatedTask,
          ...currentHistory.filter((task) => task.id !== taskId),
        ]);
      } else {
        setTaskHistory((currentHistory) =>
          currentHistory.filter((task) => task.id !== taskId),
        );
      }
    } catch (error) {
      console.error("Task update failed:", error);
      setTaskError(error.message);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: getAuthHeaders(),
      });

      if (handleUnauthorized(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch current user");
      }

      setCurrentUser(data);
    } catch (error) {
      console.error("Current user fetch failed:", error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    loadTasks();
    loadDocuments();
    fetchMemories();
    fetchRunHistory();
    fetchCalendarStatus();
    fetchCalendarEvents();

    const calendarParams = new URLSearchParams(window.location.search);

    if (calendarParams.get("calendar") === "connected") {
      fetchCalendarStatus();
      fetchCalendarEvents();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isAuthenticated]);

  const fetchMemories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memory`, {
        headers: getAuthHeaders(),
      });
      if (handleUnauthorized(response)) {
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch memory");
      }

      const data = await response.json();
      setMemories(data);
    } catch (error) {
      console.error("Memory fetch failed:", error);
    }
  };

  const fetchRunHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/run-history`, {
        headers: getAuthHeaders(),
      });

      if (handleUnauthorized(response)) {
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch run history");
      }

      const data = await response.json();
      setRunHistory(data);
    } catch (error) {
      console.error("Run history fetch failed:", error);
    }
  };

  const fetchRunDetails = async (runId) => {
    setRunDetailLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/run-history/${runId}`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (handleUnauthorized(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch run details");
      }

      setSelectedRun(data);
    } catch (error) {
      console.error("Run detail fetch failed:", error);
      setSelectedRun(null);
    } finally {
      setRunDetailLoading(false);
    }
  };

  const fetchCalendarStatus = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/calendar/status`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (handleUnauthorized(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch calendar status");
      }

      setCalendarConnected(Boolean(data.connected));
    } catch (error) {
      console.error("Calendar status fetch failed:", error);
    }
  };

  const connectGoogleCalendar = async () => {
    setCalendarLoading(true);
    setCalendarError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/calendar/connect`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (handleUnauthorized(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to connect Google Calendar");
      }

      if (!data.authorization_url) {
        throw new Error("Google authorization URL was not returned.");
      }

      window.location.href = data.authorization_url;
    } catch (error) {
      console.error("Google Calendar connection failed:", error);
      setCalendarError(error.message);
    } finally {
      setCalendarLoading(false);
    }
  };

  const fetchCalendarEvents = async () => {
    setCalendarEventsLoading(true);
    setCalendarEventsError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/calendar/events`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (handleUnauthorized(response)) {
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load Google Calendar events");
      }

      setCalendarEvents(data.events || []);
    } catch (error) {
      console.error("Calendar events fetch failed:", error);
      setCalendarEventsError(error.message);
      setCalendarEvents([]);
    } finally {
      setCalendarEventsLoading(false);
    }
  };

  const runAgent = async () => {
    if (!goal.trim() || running) return;

    setActivities([]);
    setRunning(true);
    setPlan([]);
    setEvaluation("");
    setResult("");
    setStatus("Connecting");

    try {
      setStatus("Planning");

      const response = await fetch(`${API_BASE_URL}/api/agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          goal: goal.trim(),
          document_ids: selectedDocumentId ? [selectedDocumentId] : [],
        }),
      });

      if (handleUnauthorized(response)) {
        return;
      }

      const data = await response.json();

      console.log("AGENT RESPONSE STATUS:", response.status);
      console.log("AGENT RESPONSE DATA:", data);

      setActivities(
        (data.activity || []).map((event) => ({
          type: event.type,
          status: event.status,
          text: event.message,
        })),
      );
      setResult(data.result || "");
      setEvaluation(data.evaluation || "");
      setPlan(data.plan || []);
      await fetchMemories();
      await fetchRunHistory();

      if (!response.ok) {
        throw new Error(
          data.detail || `Agent request failed (${response.status})`,
        );
      }

      setEvaluation(data.evaluation || "");
      setResult(data.result || "The agent returned no final result.");
      setStatus("Completed");
    } catch (error) {
      console.error("Agent request failed:", error);

      setStatus("Error");

      if (
        error.message.includes("429") ||
        error.message.toLowerCase().includes("quota") ||
        error.message.toLowerCase().includes("credits")
      ) {
        setResult(
          `OpenRouter provider quota or rate limit is temporarily unavailable.\n\nDetails: ${error.message}`,
        );
      } else {
        setResult(
          `The agent could not complete the request.\n\nReason: ${error.message}`,
        );
      }
    } finally {
      setRunning(false);
    }
  };

  const resetAgent = () => {
    setGoal("");
    setStatus("Idle");
    setPlan([]);
    setActivities([]);
    setEvaluation("");
    setResult("");
    setRunning(false);
  };

  if (showLanding) {
    return (
      <LandingPage
        onLaunchApp={() => setShowLanding(false)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0d12] px-4 py-8 relative">
        <button
          type="button"
          onClick={() => setShowLanding(true)}
          className="mb-6 sm:absolute sm:top-6 sm:left-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} /> Public Landing Page
        </button>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black text-lg font-bold">
              TP
            </div>

            <h1 className="text-3xl font-semibold text-white">TaskPilot</h1>

            <p className="mt-2 text-sm text-gray-400">
              Your intelligent task management workspace
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#11141b] p-6 shadow-xl">
            <div className="mb-6 flex rounded-xl bg-white/5 p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  authMode === "login"
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setAuthError("");
                }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  authMode === "signup"
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Email
                </label>

                <input
                  type="email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Password
                </label>

                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete={
                    authMode === "login" ? "current-password" : "new-password"
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-white/30"
                />
              </div>

              {authError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {authLoading
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Login"
                    : "Create account"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-gray-500">
              {authMode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setAuthError("");
                }}
                className="text-gray-300 hover:text-white"
              >
                {authMode === "login" ? "Sign up" : "Login"}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 p-4 lg:flex lg:flex-col">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
              <Bot size={21} />
            </div>

            <div>
              <h1 className="font-semibold tracking-tight">TaskPilot</h1>
              <p className="text-xs text-zinc-500">Agentic workspace</p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetAgent}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          >
            <Plus size={17} />
            New goal
          </button>

          <nav className="space-y-1">
            <NavItem
              icon={<LayoutDashboard size={17} />}
              label="Dashboard"
              active={activeView === "dashboard"}
              onClick={() => setActiveView("dashboard")}
              aria-current={activeView === "dashboard" ? "page" : undefined}
            />

            <NavItem
              icon={<Activity size={17} />}
              label="Agent activity"
              active={activeView === "activity"}
              onClick={() => setActiveView("activity")}
              aria-current={activeView === "activity" ? "page" : undefined}
            />

            <NavItem
              icon={<Clock3 size={17} />}
              label="Agent history"
              active={activeView === "agent-history"}
              onClick={() => {
                setActiveView("agent-history");
                setSelectedRun(null);
              }}
            />

            <NavItem
              icon={<FileText size={17} />}
              label="Documents"
              active={activeView === "documents"}
              onClick={() => setActiveView("documents")}
            />

            <NavItem
              icon={<CheckCircle2 size={17} />}
              label="Task history"
              active={activeView === "task-history"}
              onClick={() => setActiveView("task-history")}
            />

            <NavItem
              icon={<Globe size={17} />}
              label="Public page"
              active={false}
              onClick={() => setShowLanding(true)}
            />
          </nav>

          <button
            type="button"
            onClick={toggleTheme}
            className="mt-auto flex w-full items-center gap-3 rounded-xl border border-zinc-800 px-3 py-2.5 text-sm text-zinc-400 transition hover:border-blue-500/40 hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          >
            {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            <span>{isDarkMode ? "Light mode" : "Dark mode"}</span>
          </button>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            onClick={() => setIsProfileMenuOpen((previous) => !previous)}
            className="flex w-full items-center text-left"
          >
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <div className="flex items-center gap-3 rounded-xl p-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold">
                  {currentUser?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">Workspace</p>
                  <p className="truncate text-xs text-zinc-500">
                    {currentUser?.email || "User"}
                  </p>
                </div>
              </div>
            </div>
          </button>

          {isProfileMenuOpen && (
            <div className="mt-2 rounded-xl border border-white/10 bg-[#11141b] p-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </aside>

        {/* Mobile navigation */}
        <nav
          aria-label="Mobile navigation"
          className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 px-3 py-2 backdrop-blur lg:hidden"
        >
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveView("dashboard")}
              aria-current={activeView === "dashboard" ? "page" : undefined}
              title="Dashboard"
              className={`shrink-0 rounded-lg px-2.5 py-2 text-xs transition ${
                activeView === "dashboard"
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              }`}
            >
              <LayoutDashboard size={15} />
            </button>

            <button
              type="button"
              onClick={() => setActiveView("activity")}
              title="Agent activity"
              className={`shrink-0 rounded-lg px-2.5 py-2 text-xs transition ${
                activeView === "activity"
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              }`}
            >
              <Activity size={15} />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView("agent-history");
                setSelectedRun(null);
              }}
              title="Agent history"
              className={`shrink-0 rounded-lg px-2.5 py-2 text-xs transition ${
                activeView === "agent-history"
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              }`}
            >
              <Clock3 size={15} />
            </button>

            <button
              type="button"
              onClick={() => setActiveView("documents")}
              title="Documents"
              className={`shrink-0 rounded-lg px-2.5 py-2 text-xs transition ${
                activeView === "documents"
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              }`}
            >
              <FileText size={15} />
            </button>

            <button
              type="button"
              onClick={() => setActiveView("task-history")}
              title="Task history"
              aria-current={activeView === "task-history" ? "page" : undefined}
              className={`shrink-0 rounded-lg px-2.5 py-2 text-xs transition ${
                activeView === "task-history"
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              }`}
            >
              <CheckCircle2 size={15} />
            </button>

            <div className="ml-auto flex shrink-0 items-center gap-1 border-l border-zinc-800 pl-2">
              <button
                type="button"
                onClick={toggleTheme}
                title={isDarkMode ? "Light mode" : "Dark mode"}
                aria-label={
                  isDarkMode ? "Switch to light mode" : "Switch to dark mode"
                }
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-300"
              >
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-red-400"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </nav>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {activeView === "activity" ? (
            <ActivityView
              activities={activities}
              evaluation={evaluation}
              plan={plan}
              result={result}
              runHistory={runHistory}
            />
          ) : activeView === "documents" ? (
            <DocumentsView
              documents={documents}
              documentsLoading={documentsLoading}
              documentUploading={documentUploading}
              documentError={documentError}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              setDocumentError={setDocumentError}
              loadDocuments={loadDocuments}
              uploadDocument={uploadDocument}
              selectedDocumentId={selectedDocumentId}
              setSelectedDocumentId={setSelectedDocumentId}
            />
          ) : activeView === "task-history" ? (
            <TaskHistoryView
              taskHistory={taskHistory}
              tasksLoading={tasksLoading}
              loadTasks={loadTasks}
            />
          ) : activeView === "agent-history" ? (
            <AgentHistoryView
              runHistory={runHistory}
              selectedRun={selectedRun}
              runDetailLoading={runDetailLoading}
              fetchRunDetails={fetchRunDetails}
              setSelectedRun={setSelectedRun}
            />
          ) : (
            <>
              {/* Top bar */}
              <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-6 lg:px-8">
                <div>
                  <p className="text-sm text-zinc-500">Workspace</p>
                  <h2 className="font-medium">Agent Dashboard</h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden items-center gap-2 rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 sm:flex">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        running
                          ? "animate-pulse bg-amber-400"
                          : backendStatus === "connected"
                            ? "bg-emerald-400"
                            : backendStatus === "checking"
                              ? "animate-pulse bg-yellow-400"
                              : "bg-red-400"
                      }`}
                    />

                    {running
                      ? "Agent running"
                      : backendStatus === "connected"
                        ? "Backend connected"
                        : backendStatus === "checking"
                          ? "Connecting..."
                          : "Backend offline"}
                  </div>
                </div>
              </header>

              <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
                {/* Hero */}
                <section className="pt-4">
                  <div className="mb-3 flex items-center gap-2 text-sm text-blue-400">
                    <Sparkles size={15} />
                    Autonomous task execution
                  </div>

                  <h2 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                    What do you want your agent to accomplish?
                  </h2>

                  <p className="mt-3 max-w-2xl text-zinc-500">
                    Give TaskPilot a goal. It will plan the work, use the right
                    tools, evaluate the result, and re-plan when necessary.
                  </p>
                </section>
                {/* Goal input */}
                <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-2xl shadow-black/20">
                  <textarea
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                    disabled={running}
                    placeholder="Describe a goal for your agent..."
                    className="min-h-28 w-full resize-none bg-transparent p-2 text-base text-zinc-100 outline-none placeholder:text-zinc-600 disabled:opacity-50"
                  />

                  <div className="mt-3 flex flex-col gap-3 border-t border-zinc-800 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Terminal size={14} />
                      OpenRouter-powered agent
                    </div>

                    <button
                      onClick={runAgent}
                      type="button"
                      disabled={!goal.trim() || running}
                      className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {running ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Running
                        </>
                      ) : (
                        <>
                          Run agent
                          <ChevronRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </section>
                {/* Dashboard grid */}
                <section className="grid gap-6 xl:grid-cols-3">
                  {/* Agent status */}
                  <DashboardCard
                    title="Agent status"
                    icon={<Activity size={17} />}
                  >
                    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          running
                            ? "bg-amber-500/10"
                            : status === "Completed"
                              ? "bg-emerald-500/10"
                              : "bg-blue-500/10"
                        }`}
                      >
                        {running ? (
                          <Loader2 size={19} className="animate-spin" />
                        ) : status === "Completed" ? (
                          <CheckCircle2
                            size={19}
                            className="text-emerald-400"
                          />
                        ) : (
                          <Bot size={19} />
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium">{status}</p>
                        <p className="text-xs text-zinc-500">
                          {running
                            ? "Agent is processing your goal"
                            : status === "Completed"
                              ? "Task execution finished"
                              : "Waiting for a goal"}
                        </p>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Current plan */}
                  <DashboardCard
                    title="Current plan"
                    icon={<CheckCircle2 size={17} />}
                  >
                    {plan.length === 0 ? (
                      <p className="text-sm text-zinc-600">
                        Plan will appear after execution starts.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {plan.map((step, index) => (
                          <div
                            key={`${index}-${step}`}
                            className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-xs text-zinc-500">
                              {index + 1}
                            </span>

                            <span className="pt-0.5 text-sm leading-6 text-zinc-400">
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </DashboardCard>

                  {/* Tools */}
                  <DashboardCard
                    title="Available tools"
                    icon={<Terminal size={17} />}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <ToolBadge label="Calculator" />
                      <ToolBadge label="Task manager" />
                      <ToolBadge label="Documents" />
                      <ToolBadge label="Web research" />
                      <ToolBadge label="Google Calendar" />
                    </div>
                  </DashboardCard>
                </section>
                {/* Task manager */}
                <section className="rounded-2xl border border-blue-500/20 bg-zinc-900/50 shadow-lg shadow-blue-500/5">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={17} className="text-zinc-400" />
                      <h3 className="text-sm font-medium">Task manager</h3>
                    </div>

                    <button
                      type="button"
                      onClick={loadTasks}
                      disabled={tasksLoading}
                      className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {tasksLoading ? "Loading..." : "Refresh"}
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={taskTitle}
                        onChange={(event) => setTaskTitle(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            addTask();
                          }
                        }}
                        placeholder="Add a task..."
                        className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                      />

                      <button
                        type="button"
                        onClick={addTask}
                        disabled={!taskTitle.trim()}
                        className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>

                    {taskError && (
                      <div className="mt-3 rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3">
                        <p className="text-xs text-red-400">{taskError}</p>
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      {tasksLoading && tasks.length === 0 ? (
                        <div className="flex min-h-32 items-center justify-center text-sm text-zinc-600">
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Loading tasks...
                        </div>
                      ) : tasks.length === 0 ? (
                        <div className="min-h-32 flex flex-col items-center justify-center text-center">
                          <p className="text-sm text-zinc-500">No tasks yet.</p>
                          <p className="mt-1 text-xs text-zinc-700">
                            Add your first task above.
                          </p>
                        </div>
                      ) : (
                        tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                  task.completed ? "bg-zinc-800" : "bg-zinc-900"
                                }`}
                              >
                                <CheckCircle2
                                  size={15}
                                  className={
                                    task.completed
                                      ? "text-emerald-400"
                                      : "text-zinc-600"
                                  }
                                />
                              </div>

                              <p
                                className={`truncate text-sm ${
                                  task.completed
                                    ? "text-zinc-600 line-through"
                                    : "text-zinc-300"
                                }`}
                              >
                                {task.title}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleTask(task.id)}
                              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs transition ${
                                task.completed
                                  ? "border-zinc-800 text-zinc-500 hover:border-blue-500/40 hover:text-blue-400"
                                  : "border-zinc-800 text-zinc-500 hover:border-emerald-500/40 hover:text-emerald-400"
                              }`}
                            >
                              {task.completed ? "Undo" : "Complete"}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>
                {/* Document manager */}
                <section className="rounded-2xl border border-blue-500/20 bg-zinc-900/50 shadow-lg shadow-blue-500/5">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <FileText size={17} className="text-zinc-400" />
                      <h3 className="text-sm font-medium">Documents</h3>
                    </div>

                    <button
                      type="button"
                      onClick={loadDocuments}
                      disabled={documentsLoading}
                      className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {documentsLoading ? "Loading..." : "Refresh"}
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 p-5">
                      <input
                        id="document-upload"
                        type="file"
                        accept=".txt,.md,.pdf"
                        onChange={(event) => {
                          setSelectedFile(event.target.files?.[0] || null);
                          setDocumentError("");
                        }}
                        className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-medium file:text-zinc-950 hover:file:bg-zinc-200"
                      />

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-zinc-600">
                          Supported: PDF, TXT, MD
                        </p>

                        <button
                          type="button"
                          onClick={uploadDocument}
                          disabled={!selectedFile || documentUploading}
                          className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-xs font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {documentUploading ? "Uploading..." : "Upload"}
                        </button>
                      </div>
                    </div>

                    {documentError && (
                      <div className="mt-3 rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3">
                        <p className="text-xs text-red-400">{documentError}</p>
                      </div>
                    )}

                    <div className="mt-5 space-y-2">
                      {documentsLoading && documents.length === 0 ? (
                        <div className="flex min-h-32 items-center justify-center text-sm text-zinc-600">
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Loading documents...
                        </div>
                      ) : documents.length === 0 ? (
                        <div className="min-h-32 flex flex-col items-center justify-center text-center">
                          <FileText
                            size={20}
                            className="mx-auto mb-3 text-zinc-700"
                          />

                          <p className="text-sm text-zinc-500">
                            No documents uploaded.
                          </p>

                          <p className="mt-1 text-xs text-zinc-700">
                            Upload a document to give your agent additional
                            context.
                          </p>
                        </div>
                      ) : (
                        documents.map((document) => (
                          <button
                            type="button"
                            key={document.document_id}
                            onClick={() =>
                              setSelectedDocumentId(document.document_id)
                            }
                            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                              selectedDocumentId === document.document_id
                                ? "border-blue-500/50 bg-blue-500/10"
                                : "border-zinc-800 bg-zinc-950/30 hover:border-zinc-700"
                            }`}
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900">
                              <FileText size={16} className="text-zinc-400" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm text-zinc-300">
                                {document.filename}
                              </p>

                              <p className="truncate font-mono text-[10px] text-zinc-600">
                                {document.document_id}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </section>
                {/* Google Calendar */}
                <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <CalendarDays size={17} />
                        <h3 className="text-sm font-medium text-zinc-200">
                          Google Calendar
                        </h3>
                      </div>

                      <p className="mt-1 text-xs text-zinc-500">
                        Connect your calendar so TaskPilot can work with your
                        events.
                      </p>
                    </div>

                    {calendarConnected ? (
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                        Connected
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={connectGoogleCalendar}
                        disabled={calendarLoading}
                        className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {calendarLoading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CalendarDays size={14} />
                        )}

                        {calendarLoading ? "Connecting..." : "Connect Calendar"}
                      </button>
                    )}
                  </div>

                  {calendarError && (
                    <p className="mt-3 text-xs text-red-400">{calendarError}</p>
                  )}

                  {calendarConnected && (
                    <div className="mt-5 border-t border-zinc-800 pt-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                          Upcoming events
                        </p>

                        <div className="flex items-center gap-2">
                          {calendarEvents.length > 0 && (
                            <span className="text-[10px] text-zinc-600">
                              {calendarEvents.length} shown
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={fetchCalendarEvents}
                            disabled={calendarEventsLoading}
                            title="Refresh calendar"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Refresh calendar events"
                          >
                            <RefreshCw
                              size={12}
                              className={
                                calendarEventsLoading ? "animate-spin" : ""
                              }
                            />
                          </button>
                        </div>
                      </div>

                      {calendarEventsLoading ? (
                        <div className="flex min-h-24 items-center justify-center text-xs text-zinc-600">
                          <Loader2 size={14} className="mr-2 animate-spin" />
                          Loading events...
                        </div>
                      ) : calendarEventsError ? (
                        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-3">
                          <p className="text-xs text-red-400">
                            {calendarEventsError}
                          </p>
                        </div>
                      ) : calendarEvents.length === 0 ? (
                        <div className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 text-center">
                          <CalendarDays
                            size={18}
                            className="mx-auto mb-2 text-zinc-700"
                          />
                          <p className="text-xs text-zinc-500">
                            No upcoming events found.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {calendarEvents.map((event) => (
                            <div
                              key={event.id}
                              className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm text-zinc-300">
                                    {event.summary || "Untitled event"}
                                  </p>

                                  <p className="mt-1 text-xs text-zinc-600">
                                    {event.start || "No start time"}
                                  </p>

                                  {event.location && (
                                    <p className="mt-1 truncate text-xs text-zinc-600">
                                      {event.location}
                                    </p>
                                  )}
                                </div>

                                {event.html_link && (
                                  <a
                                    href={event.html_link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 text-[10px] text-zinc-500 transition hover:text-zinc-300"
                                  >
                                    Open
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Evaluation */}
                {evaluation && (
                  <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {evaluation === "PASS" ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <RefreshCw size={18} />
                        )}

                        <div>
                          <p className="text-sm font-medium">Evaluation</p>
                          <p className="text-xs text-zinc-500">
                            Agent result quality check
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium">
                        {evaluation}
                      </span>
                    </div>

                    <div className="mt-4 text-sm text-zinc-400">
                      {evaluation === "PASS"
                        ? "The agent determined that the result satisfies the goal."
                        : "The agent determined that the result needs improvement and may require replanning."}
                    </div>
                  </section>
                )}

                {/* Agent Memory */}
                {memories.length > 0 && (
                  <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Agent Memory</p>
                        <p className="text-xs text-zinc-500">
                          Previous successful agent runs
                        </p>
                      </div>

                      <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
                        {memories.length}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {memories.map((memory) => (
                        <div
                          key={memory.id}
                          className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium text-zinc-300">
                              {memory.goal}
                            </p>

                            <span className="shrink-0 rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-500">
                              {memory.evaluation}
                            </span>
                          </div>

                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-500">
                            {memory.result}
                          </p>

                          <p className="mt-2 text-xs text-zinc-600">
                            {memory.created_at}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {/* Run History */}
                {runHistory.length > 0 && (
                  <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Run History</p>
                        <p className="text-xs text-zinc-500">
                          Previous agent executions
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveView("agent-history");
                            setSelectedRun(null);
                          }}
                          className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-200"
                        >
                          View all
                        </button>

                        <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
                          {runHistory.length}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {runHistory.map((run) => (
                        <div
                          key={run.id}
                          className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium text-zinc-300">
                              {run.goal}
                            </p>

                            <span className="shrink-0 rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-500">
                              {run.evaluation}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-zinc-500">
                            Retries: {run.retry_count}
                          </p>

                          <p className="mt-2 text-xs text-zinc-600">
                            {run.created_at}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {/* Activity */}
                <section className="rounded-2xl border border-blue-500/20 bg-zinc-900/50 shadow-lg shadow-blue-500/5">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Clock3 size={17} className="text-zinc-400" />
                      <h3 className="text-sm font-medium">Agent activity</h3>
                    </div>

                    <span className="text-xs text-zinc-600">
                      {activities.length
                        ? `${activities.length} events`
                        : "No recent runs"}
                    </span>
                  </div>

                  <div className="p-5">
                    {activities.length === 0 ? (
                      <div className="flex min-h-32 items-center justify-center">
                        <div className="text-center">
                          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
                            <Activity size={18} className="text-zinc-600" />
                          </div>

                          <p className="text-sm text-zinc-400">
                            Your agent activity will appear here.
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            Run a goal to see the agent workflow.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activities.map((activity, index) => (
                          <div
                            key={`${activity.text}-${index}`}
                            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
                              {activity.type === "tool" ? (
                                <Wrench size={15} />
                              ) : activity.type === "evaluator" ? (
                                <CheckCircle2 size={15} />
                              ) : (
                                <Bot size={15} />
                              )}
                            </div>

                            <p className="text-sm text-zinc-400">
                              {activity.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
                {/* Final result */}
                {result && (
                  <section className="rounded-2xl border border-blue-500/20 bg-zinc-900/50 shadow-lg shadow-blue-500/5">
                    <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Sparkles size={17} />
                        <h3 className="text-sm font-medium">Final result</h3>
                      </div>

                      {evaluation && (
                        <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium">
                          {evaluation}
                        </span>
                      )}
                    </div>

                    <div className="whitespace-pre-wrap p-5 text-sm leading-7 text-zinc-400">
                      {result}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}
        </main>
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        active
          ? "bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20"
          : "text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ActivityView({ activities, evaluation, plan, result, runHistory }) {
  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Agent Activity
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Follow how TaskPilot plans, executes, evaluates, and improves its
            work.
          </p>
        </div>

        <section className="rounded-2xl border border-blue-500/20 bg-zinc-900/50 shadow-lg shadow-blue-500/5">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <div className="flex items-center gap-2">
              <Activity size={17} className="text-zinc-400" />
              <h2 className="text-sm font-medium">Execution timeline</h2>
            </div>

            <span className="text-xs text-zinc-600">
              {activities.length
                ? `${activities.length} events`
                : "No recent activity"}
            </span>
          </div>

          <div className="p-5">
            {activities.length === 0 ? (
              <div className="flex min-h-48 items-center justify-center">
                <div className="text-center">
                  <Activity size={24} className="mx-auto mb-3 text-zinc-700" />
                  <p className="text-sm text-zinc-400">
                    No agent activity yet.
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Run a goal from the Dashboard to see the workflow here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div
                    key={`${activity.text}-${index}`}
                    className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900">
                      {activity.type === "tool" ? (
                        <Wrench size={16} />
                      ) : activity.type === "evaluator" ? (
                        <CheckCircle2 size={16} />
                      ) : activity.type === "web_research" ? (
                        <Search size={16} />
                      ) : activity.type === "decision" ? (
                        <Sparkles size={16} />
                      ) : (
                        <Bot size={16} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium capitalize text-zinc-300">
                          {activity.type.replace("_", " ")}
                        </p>

                        <span className="shrink-0 text-[10px] uppercase tracking-wider text-zinc-600">
                          {activity.status || "completed"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm leading-6 text-zinc-500">
                        {activity.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {plan.length > 0 && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={17} className="text-zinc-400" />
              <h2 className="text-sm font-medium">Execution plan</h2>
            </div>

            <div className="mt-4 space-y-2">
              {plan.map((step, index) => (
                <div
                  key={`${index}-${step}`}
                  className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-xs text-zinc-500">
                    {index + 1}
                  </span>

                  <span className="pt-0.5 text-sm leading-6 text-zinc-400">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {evaluation && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Latest evaluation</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Result quality check
                </p>
              </div>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  evaluation === "PASS"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                }`}
              >
                {evaluation}
              </span>
            </div>
          </section>
        )}

        {result && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h2 className="text-sm font-medium">Latest result</h2>
            </div>

            <div className="whitespace-pre-wrap p-5 text-sm leading-7 text-zinc-400">
              {result}
            </div>
          </section>
        )}

        {runHistory.length > 0 && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Recent runs</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Previous agent executions
                </p>
              </div>

              <span className="text-xs text-zinc-600">
                {runHistory.length} runs
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {runHistory.slice(0, 5).map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3"
                >
                  <p className="truncate text-sm text-zinc-400">{run.goal}</p>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-zinc-600">
                      Retries: {run.retry_count}
                    </span>
                    <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-500">
                      {run.evaluation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
function AgentHistoryView({
  runHistory,
  selectedRun,
  runDetailLoading,
  fetchRunDetails,
  setSelectedRun,
}) {
  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Workspace
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Agent History
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Continue from your previous agent conversations.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          {/* Previous conversations */}
          <section
            className={`rounded-2xl border border-zinc-800 bg-zinc-900/40 ${
              selectedRun ? "hidden lg:block" : "block"
            }`}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <h2 className="text-sm font-medium">Conversations</h2>
                <p className="mt-1 text-xs text-zinc-600">
                  Previous agent runs
                </p>
              </div>

              <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-500">
                {runHistory.length}
              </span>
            </div>

            <div className="max-h-[650px] overflow-y-auto p-3">
              {runHistory.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center px-3 py-10 text-center">
                  <Clock3 size={22} className="mx-auto mb-3 text-zinc-700" />

                  <p className="text-sm text-zinc-500">No conversations yet.</p>

                  <p className="mt-1 text-xs text-zinc-700">
                    Your agent runs will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {runHistory.map((run) => (
                    <button
                      key={run.id}
                      type="button"
                      onClick={() => fetchRunDetails(run.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        selectedRun?.id === run.id
                          ? "border-blue-500/50 bg-blue-500/10"
                          : "border-zinc-800 bg-zinc-950/30 hover:border-zinc-700"
                      }`}
                    >
                      <p className="line-clamp-2 text-sm font-medium text-zinc-300">
                        {run.goal}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-zinc-600">
                          {run.created_at}
                        </span>

                        <span className="shrink-0 rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-500">
                          {run.evaluation}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Conversation */}
          <section
            className={`rounded-2xl border border-zinc-800 bg-zinc-900/40 ${
              selectedRun ? "block" : "hidden lg:block"
            }`}
          >
            <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-4">
              <button
                type="button"
                onClick={() => setSelectedRun(null)}
                className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 lg:hidden"
              >
                <ArrowLeft size={17} />
              </button>

              <div className="flex items-center gap-2">
                <Bot size={17} className="text-zinc-400" />

                <div>
                  <h2 className="text-sm font-medium">Agent conversation</h2>

                  <p className="mt-1 text-xs text-zinc-600">
                    Previous execution
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {runDetailLoading ? (
                <div className="flex min-h-64 items-center justify-center text-sm text-zinc-600">
                  <Loader2 size={17} className="mr-2 animate-spin" />
                  Loading conversation...
                </div>
              ) : !selectedRun ? (
                <div className="flex min-h-64 items-center justify-center">
                  <div className="text-center">
                    <Bot size={24} className="mx-auto mb-3 text-zinc-700" />

                    <p className="text-sm text-zinc-500">
                      Select a conversation
                    </p>

                    <p className="mt-1 text-xs text-zinc-700">
                      Your previous agent interaction will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-zinc-800 px-4 py-3">
                      <p className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">
                        You
                      </p>

                      <p className="text-sm leading-6 text-zinc-200">
                        {selectedRun.goal}
                      </p>
                    </div>
                  </div>

                  {/* Agent response */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
                      <Bot size={15} className="text-zinc-400" />
                    </div>

                    <div className="min-w-0 max-w-[90%]">
                      <p className="mb-2 text-xs font-medium text-zinc-500">
                        TaskPilot
                      </p>

                      <div className="whitespace-pre-wrap rounded-2xl rounded-tl-md border border-zinc-800 bg-zinc-950/50 p-4 text-sm leading-7 text-zinc-400">
                        {selectedRun.result || "No result recorded."}
                      </div>
                    </div>
                  </div>

                  {/* Execution information */}
                  <div className="border-t border-zinc-800 pt-5">
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles size={15} className="text-zinc-500" />

                      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Execution details
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                        <p className="text-xs text-zinc-600">Evaluation</p>

                        <p className="mt-1 text-sm font-medium text-zinc-300">
                          {selectedRun.evaluation}
                        </p>
                      </div>

                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                        <p className="text-xs text-zinc-600">Retries</p>

                        <p className="mt-1 text-sm font-medium text-zinc-300">
                          {selectedRun.retry_count}
                        </p>
                      </div>

                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                        <p className="text-xs text-zinc-600">Created</p>

                        <p className="mt-1 truncate text-sm font-medium text-zinc-300">
                          {selectedRun.created_at}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Plan */}
                  <details className="group rounded-xl border border-zinc-800 bg-zinc-950/30">
                    <summary className="cursor-pointer list-none px-4 py-3 text-sm text-zinc-400 transition hover:text-zinc-200">
                      <div className="flex items-center justify-between">
                        <span>View execution plan</span>
                        <span className="text-xs text-zinc-600 group-open:rotate-180">
                          ↓
                        </span>
                      </div>
                    </summary>

                    <div className="border-t border-zinc-800 px-4 py-4">
                      <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-500">
                        {selectedRun.plan || "No plan recorded."}
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function TaskHistoryView({ taskHistory, tasksLoading, loadTasks }) {
  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Task History
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Completed tasks stored by TaskPilot.
          </p>
        </div>
        <section className="rounded-2xl border border-blue-500/20 bg-zinc-900/50 shadow-lg shadow-blue-500/5">
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <div>
              <h2 className="text-sm font-medium">Completed tasks</h2>
              <p className="mt-1 text-xs text-zinc-600">
                Your completed task history
              </p>
            </div>

            <button
              type="button"
              onClick={loadTasks}
              disabled={tasksLoading}
              className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {tasksLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="p-5">
            {tasksLoading && taskHistory.length === 0 ? (
              <div className="flex min-h-36 items-center justify-center text-sm text-zinc-600">
                <Loader2 size={16} className="mr-2 animate-spin" />
                Loading task history...
              </div>
            ) : taskHistory.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2
                  size={22}
                  className="mx-auto mb-3 text-zinc-700"
                />
                <p className="text-sm text-zinc-500">No completed tasks yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {taskHistory.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                      <CheckCircle2 size={15} className="text-emerald-400" />
                    </div>

                    <p className="min-w-0 flex-1 truncate text-sm text-zinc-500 line-through">
                      {task.title}
                    </p>

                    <span className="shrink-0 text-xs text-zinc-600">
                      Completed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function DocumentsView({
  documents,
  documentsLoading,
  documentUploading,
  documentError,
  selectedFile,
  setSelectedFile,
  setDocumentError,
  loadDocuments,
  uploadDocument,
  selectedDocumentId,
  setSelectedDocumentId,
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
          Workspace
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Documents
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Upload and manage documents for your agent.
        </p>
      </div>

      <section className="rounded-2xl border border-blue-500/20 bg-zinc-900/50 shadow-lg shadow-blue-500/5">
        <div className="flex items-center justify-between border-b border-blue-500/20 px-5 py-4">
          <div>
            <h2 className="text-sm font-medium text-zinc-200">
              Document library
            </h2>
            <p className="mt-1 text-xs text-zinc-600">
              PDF, TXT and Markdown files
            </p>
          </div>

          <button
            type="button"
            onClick={loadDocuments}
            disabled={documentsLoading}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {documentsLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="p-5">
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 p-5">
            <input
              id="document-upload"
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] || null);
                setDocumentError("");
              }}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-xs file:text-zinc-300 hover:file:bg-zinc-700"
            />

            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-xs text-zinc-600">
                {selectedFile
                  ? `Selected: ${selectedFile.name}`
                  : "Choose a document to upload"}
              </p>

              <button
                onClick={uploadDocument}
                disabled={!selectedFile || documentUploading}
                className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {documentUploading ? "Uploading..." : "Upload document"}
              </button>
            </div>
          </div>

          {documentError && (
            <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-xs text-red-400">
              {documentError}
            </div>
          )}

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Uploaded documents
              </h3>

              <span className="text-xs text-zinc-600">
                {documents.length}{" "}
                {documents.length === 1 ? "document" : "documents"}
              </span>
            </div>

            {documentsLoading && documents.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 px-4 py-8 text-center text-sm text-zinc-500">
                Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/30 px-4 py-8 text-center">
                <p className="text-sm text-zinc-400">
                  No documents uploaded yet.
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  Upload a document to make it available to TaskPilot.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((document) => (
                  <button
                    type="button"
                    key={document.document_id}
                    onClick={() => setSelectedDocumentId(document.document_id)}
                    aria-pressed={selectedDocumentId === document.document_id}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      selectedDocumentId === document.document_id
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-zinc-800 bg-zinc-950/30 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400">
                      <FileText size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-200">
                        {document.filename}
                      </p>

                      <p className="mt-1 truncate font-mono text-[10px] text-zinc-600">
                        {document.document_id}
                      </p>
                      {selectedDocumentId === document.document_id && (
                        <p className="mt-1 text-[10px] text-emerald-400">
                          Selected for agent
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardCard({ title, icon, children }) {
  return (
    <div className="min-h-40 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="mb-4 flex items-center gap-2 text-zinc-400">
        {icon}
        <h3 className="text-sm font-medium text-zinc-200">{title}</h3>
      </div>

      {children}
    </div>
  );
}

function ToolBadge({ label }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-400">
      {label}
    </div>
  );
}

function LandingPage({
  onLaunchApp,
  isDarkMode,
  toggleTheme,
  isAuthenticated,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("calculator");

  const demoScenarios = {
    calculator: {
      goal: "Calculate 27 * 19 for budget estimation",
      plan: [
        "Parse mathematical expression",
        "Invoke calculator tool",
        "Return result 513",
      ],
      tool: "calculator",
      result: "513",
      eval: "PASS",
    },
    tasks: {
      goal: "Create a task called 'Finish TaskPilot Documentation'",
      plan: [
        "Check active task list",
        "Create task in database",
        "Confirm task creation",
      ],
      tool: "create_task",
      result: "Task 'Finish TaskPilot Documentation' created successfully.",
      eval: "PASS",
    },
    documents: {
      goal: "Read and summarize selected project manual",
      plan: [
        "Access uploaded document content",
        "Extract core technical specifications",
        "Synthesize concise summary",
      ],
      tool: "read_document",
      result:
        "Document contains deployment guide, CORS parameters, and environment requirements.",
      eval: "PASS",
    },
    research: {
      goal: "Research latest OpenRouter AI model releases",
      plan: [
        "Formulate web search query",
        "Execute web_search tool",
        "Summarize external results",
      ],
      tool: "web_search",
      result:
        "Retrieved latest OpenRouter model releases and zero-cost free model router details.",
      eval: "PASS",
    },
  };

  const currentDemo = demoScenarios[activeTab];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 transition-colors duration-300">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/25">
              <Bot size={22} />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                TaskPilot
              </span>
              <span className="ml-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400">
                Agentic AI
              </span>
            </div>
          </div>

          {/* Desktop Links */}
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#home"
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              Home
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              About
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              How It Works
            </a>
          </nav>

          {/* Actions */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-zinc-800 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
              title={
                isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
              }
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              type="button"
              onClick={onLaunchApp}
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400"
            >
              {isAuthenticated ? "Go to Workspace" : "Launch TaskPilot"}
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Mobile buttons */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-zinc-400 hover:text-white"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-zinc-400 hover:text-white"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="space-y-3 border-b border-zinc-800 bg-zinc-950 px-4 py-4 md:hidden">
            <a
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-zinc-300"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-zinc-300"
            >
              About
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-zinc-300"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-zinc-300"
            >
              How It Works
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunchApp();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white"
            >
              {isAuthenticated ? "Go to Workspace" : "Launch TaskPilot"}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[450px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/2 right-0 -z-10 h-[300px] w-[300px] rounded-full bg-purple-600/10 blur-[100px]" />

        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-400">
                <Sparkles size={14} />
                <span>Autonomous Agentic AI Task System</span>
              </div>

              <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Your Intelligent AI Task Assistant.
              </h1>

              <p className="text-base leading-relaxed text-zinc-400 sm:text-lg">
                TaskPilot formulates structured execution plans, invokes local
                tools and web research, analyzes uploaded documents, evaluates
                outputs, and replans autonomously.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onLaunchApp}
                  className="flex items-center justify-center gap-2.5 rounded-xl bg-blue-500 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-blue-500/25 transition hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                >
                  {isAuthenticated ? "Open Workspace" : "Launch TaskPilot"}
                  <ArrowRight size={18} />
                </button>

                <a
                  href="#features"
                  className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-3.5 text-base font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                >
                  Explore Capabilities
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-zinc-800/60 pt-6 sm:grid-cols-4">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                  <span>LangGraph Loop</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                  <span>OpenRouter LLM</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                  <span>PDF & Doc Reader</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                  <span>Google Calendar</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-2xl backdrop-blur">
              <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 font-mono text-xs text-zinc-500">
                    taskpilot-agent-trace.json
                  </span>
                </div>

                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  Live Preview
                </span>
              </div>

              {/* Tab Selector */}
              <div className="mb-4 flex rounded-xl border border-zinc-800 bg-zinc-950 p-1">
                {Object.keys(demoScenarios).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition ${
                      activeTab === key
                        ? "bg-blue-500 text-white shadow"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Execution Display */}
              <div className="space-y-3 font-sans">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    User Goal
                  </p>
                  <p className="mt-1 text-xs font-medium text-zinc-200">
                    {currentDemo.goal}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Execution Plan
                  </p>
                  <div className="space-y-1.5">
                    {currentDemo.plan.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-zinc-300"
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-400">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-400">
                      <Wrench size={13} />
                      Tool Executed: {currentDemo.tool}
                    </span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                      {currentDemo.eval}
                    </span>
                  </div>

                  <p className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-2.5 font-mono text-xs text-zinc-300">
                    {currentDemo.result}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="border-t border-zinc-800/80 bg-zinc-900/30 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl space-y-4 text-center">
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
              ABOUT TASKPILOT
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              An Autonomous Agentic System
            </h2>
            <p className="text-base leading-relaxed text-zinc-400">
              TaskPilot is an agentic AI task management system designed to take a user&apos;s goal, create a multi-step execution plan, select tools, execute actions, evaluate results, and replan when necessary.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:border-zinc-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Sparkles size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Goal-Oriented Planning
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Provide a natural language goal. TaskPilot builds a structured 3-5 step plan and executes it cleanly.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:border-zinc-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Wrench size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Integrated Tools
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Calculator, task manager, document reader, web research, and Google Calendar tools integrated into one agent loop.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:border-zinc-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Isolated User Security
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Multi-user JWT authentication guaranteeing per-user isolation for tasks, documents, memories, and history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
              FEATURES & CAPABILITIES
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything You Need to Get Things Done
            </h2>
            <p className="text-base text-zinc-400">
              Built with essential features to support task execution and document parsing.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="group space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-blue-500/40 hover:bg-zinc-900/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition group-hover:bg-blue-500 group-hover:text-white">
                <Sparkles size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">
                Agentic Planning
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Autonomous LangGraph workflow that plans, executes, evaluates results, and replans when feedback requires adjustments.
              </p>
            </div>

            <div className="group space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-emerald-500/40 hover:bg-zinc-900/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition group-hover:bg-emerald-500 group-hover:text-white">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">
                Task Management
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Create, list, complete, and track tasks via agent tool calling or direct dashboard interactions.
              </p>
            </div>

            <div className="group space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-purple-500/40 hover:bg-zinc-900/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 transition group-hover:bg-purple-500 group-hover:text-white">
                <FileText size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">
                Document Intelligence
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Upload TXT, MD, and PDF files. Select documents for agent execution to extract facts and technical summaries.
              </p>
            </div>

            <div className="group space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-amber-500/40 hover:bg-zinc-900/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 transition group-hover:bg-amber-500 group-hover:text-white">
                <Search size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">
                Web Research
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Web search capability allowing the agent to gather live external information and technical answers.
              </p>
            </div>

            <div className="group space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-indigo-500/40 hover:bg-zinc-900/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition group-hover:bg-indigo-500 group-hover:text-white">
                <Clock3 size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">
                Memory & History
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Saves memory of successful runs to guide future goals and maintains an interactive conversation history.
              </p>
            </div>

            <div className="group space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-cyan-500/40 hover:bg-zinc-900/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 transition group-hover:bg-cyan-500 group-hover:text-white">
                <CalendarDays size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">
                Google Calendar
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Connect Google Calendar to let TaskPilot view upcoming events and schedule new appointments automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="border-t border-zinc-800/80 bg-zinc-900/30 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
              WORKFLOW PIPELINE
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              How TaskPilot Executes Your Goals
            </h2>
            <p className="text-base text-zinc-400">
              A transparent, self-correcting agent loop designed for accuracy.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
              <span className="font-mono text-xs font-bold text-blue-400">
                STEP 01
              </span>
              <h4 className="text-sm font-semibold text-white">Goal Input</h4>
              <p className="text-[11px] text-zinc-400">
                Describe desired task
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
              <span className="font-mono text-xs font-bold text-blue-400">
                STEP 02
              </span>
              <h4 className="text-sm font-semibold text-white">Planner</h4>
              <p className="text-[11px] text-zinc-400">
                Formulates execution plan
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
              <span className="font-mono text-xs font-bold text-blue-400">
                STEP 03
              </span>
              <h4 className="text-sm font-semibold text-white">Choose Tools</h4>
              <p className="text-[11px] text-zinc-400">
                Selects local/web tools
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
              <span className="font-mono text-xs font-bold text-blue-400">
                STEP 04
              </span>
              <h4 className="text-sm font-semibold text-white">Execute</h4>
              <p className="text-[11px] text-zinc-400">
                Runs tool functions
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
              <span className="font-mono text-xs font-bold text-blue-400">
                STEP 05
              </span>
              <h4 className="text-sm font-semibold text-white">Evaluate</h4>
              <p className="text-[11px] text-zinc-400">
                Checks PASS / REPLAN
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-blue-500/40 bg-blue-500/10 p-4 text-center">
              <span className="font-mono text-xs font-bold text-emerald-400">
                STEP 06
              </span>
              <h4 className="text-sm font-semibold text-white">Final Result</h4>
              <p className="text-[11px] text-zinc-400">
                Saves memory & history
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-900/40 via-zinc-900/80 to-purple-900/40 p-8 text-center shadow-2xl sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to get things done?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-base text-zinc-300">
            Launch TaskPilot to start planning goals, executing tasks, and analyzing documents.
          </p>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onLaunchApp}
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-blue-500/30 transition hover:bg-blue-400"
            >
              {isAuthenticated ? "Go to Workspace" : "Launch TaskPilot"}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 px-4 py-10 text-xs text-zinc-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-xs font-bold text-white">
              TP
            </div>
            <span className="text-sm font-semibold text-zinc-300">
              TaskPilot
            </span>
            <span className="text-zinc-600">|</span>
            <span>Agentic AI Task Management System</span>
          </div>

          <div className="flex items-center gap-6 text-zinc-400">
            <a href="#about" className="transition hover:text-white">
              About
            </a>
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How It Works
            </a>
            <button
              type="button"
              onClick={onLaunchApp}
              className="text-blue-400 transition hover:text-blue-300"
            >
              {isAuthenticated ? "Workspace" : "Launch TaskPilot"}
            </button>
          </div>

          <p>© {new Date().getFullYear()} TaskPilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
