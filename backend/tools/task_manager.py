import sqlite3
from pathlib import Path
import hashlib
from contextvars import ContextVar


DB_PATH = Path(__file__).resolve().parent / "tasks.db"

current_user_id = ContextVar("current_user_id", default=None)


def set_current_user(user_id):
    current_user_id.set(user_id)


def get_current_user_id():
    user_id = current_user_id.get()

    if user_id is None:
        raise RuntimeError("No authenticated user context available.")

    return user_id

    if user_id is None:
        raise ValueError("No authenticated user is set.")

    return user_id

def get_connection():
    return sqlite3.connect(DB_PATH)

def add_user_id_column(table_name: str):
    connection = get_connection()

    columns = connection.execute(
        f"PRAGMA table_info({table_name})"
    ).fetchall()

    column_names = [column[1] for column in columns]

    if "user_id" not in column_names:
        connection.execute(
            f"ALTER TABLE {table_name} ADD COLUMN user_id INTEGER"
        )

    connection.commit()
    connection.close()


def migrate_existing_data():
    connection = get_connection()

    user = connection.execute(
        "SELECT id FROM users ORDER BY id LIMIT 1"
    ).fetchone()

    if user is None:
        connection.close()
        return

    user_id = user[0]

    for table_name in [
        "tasks",
        "documents",
        "agent_memory",
        "agent_run_history"
    ]:
        connection.execute(
            f"""
            UPDATE {table_name}
            SET user_id = ?
            WHERE user_id IS NULL
            """,
            (user_id,)
        )

    connection.commit()
    connection.close()

def initialize_database():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            user_id INTEGER
        )
    """)

    connection.commit()
    connection.close()

def create_task(title: str):
    user_id = get_current_user_id()

    connection = get_connection()

    cursor = connection.execute(
        "INSERT INTO tasks (title, user_id) VALUES (?, ?)",
        (title, user_id)
    )

    task_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return {
        "id": task_id,
        "title": title,
        "completed": False
    }


def list_tasks():
    user_id = get_current_user_id()

    connection = get_connection()

    cursor = connection.execute(
        """
        SELECT id, title, completed
        FROM tasks
        WHERE user_id = ?
        ORDER BY id DESC
        """,
        (user_id,)
    )

    tasks = cursor.fetchall()
    connection.close()

    return [
        {
            "id": task_id,
            "title": title,
            "completed": bool(completed),
            "status": "completed" if completed else "pending"
        }
        for task_id, title, completed in tasks
    ]

def complete_task(task_id: int):
    user_id = get_current_user_id()

    connection = get_connection()

    cursor = connection.execute(
        """
        SELECT id, title, completed
        FROM tasks
        WHERE id = ? AND user_id = ?
        """,
        (task_id, user_id)
    )

    task = cursor.fetchone()

    if task is None:
        connection.close()
        return {
            "success": False,
            "error": f"Task with ID {task_id} does not exist."
        }

    if task[2]:
        connection.close()
        return {
            "success": True,
            "id": task[0],
            "title": task[1],
            "completed": True,
            "message": "Task was already completed."
        }

    connection.execute(
        """
        UPDATE tasks
        SET completed = 1
        WHERE id = ? AND user_id = ?
        """,
        (task_id, user_id)
    )

    connection.commit()
    connection.close()

    return {
        "success": True,
        "id": task[0],
        "title": task[1],
        "completed": True
    }

def toggle_task(task_id: int):
    user_id = get_current_user_id()

    connection = get_connection()

    cursor = connection.execute(
        """
        SELECT id, title, completed
        FROM tasks
        WHERE id = ? AND user_id = ?
        """,
        (task_id, user_id)
    )

    task = cursor.fetchone()

    if task is None:
        connection.close()
        return {
            "success": False,
            "error": f"Task with ID {task_id} does not exist."
        }

    new_completed = 0 if task[2] else 1

    connection.execute(
        """
        UPDATE tasks
        SET completed = ?
        WHERE id = ? AND user_id = ?
        """,
        (new_completed, task_id, user_id)
    )

    connection.commit()
    connection.close()

    return {
        "success": True,
        "id": task[0],
        "title": task[1],
        "completed": bool(new_completed),
        "status": "completed" if new_completed else "pending"
    }

def initialize_document_table():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id TEXT UNIQUE NOT NULL,
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            user_id INTEGER
        )
    """)

    connection.commit()
    connection.close()


def register_document(document_id: str, filename: str, file_path: str):
    user_id = get_current_user_id()

    connection = get_connection()

    connection.execute(
        """
        INSERT INTO documents
        (document_id, filename, file_path, user_id)
        VALUES (?, ?, ?, ?)
        """,
        (document_id, filename, file_path, user_id)
    )

    connection.commit()
    connection.close()

    return {
        "document_id": document_id,
        "filename": filename,
        "file_path": file_path
    }


def get_document(document_id: str):
    user_id = get_current_user_id()

    connection = get_connection()

    cursor = connection.execute(
        """
        SELECT document_id, filename, file_path
        FROM documents
        WHERE document_id = ? AND user_id = ?
        """,
        (document_id, user_id)
    )

    document = cursor.fetchone()
    connection.close()

    if document is None:
        return None

    return {
        "document_id": document[0],
        "filename": document[1],
        "file_path": document[2]
    }

def list_documents():
    user_id = get_current_user_id()

    connection = get_connection()

    cursor = connection.execute(
        """
        SELECT document_id, filename, file_path
        FROM documents
        WHERE user_id = ?
        ORDER BY id DESC
        """,
        (user_id,)
    )

    documents = cursor.fetchall()
    connection.close()

    return [
        {
            "document_id": document_id,
            "filename": filename,
            "file_path": file_path
        }
        for document_id, filename, file_path in documents
    ]


def initialize_memory_table():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS agent_memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            goal TEXT NOT NULL,
            result TEXT NOT NULL,
            evaluation TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_id INTEGER
        )
    """)

    connection.commit()
    connection.close()

def initialize_run_history_table():
    connection = get_connection()
    connection.execute("""
        CREATE TABLE IF NOT EXISTS agent_run_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            goal TEXT NOT NULL,
            plan TEXT,
            result TEXT,
            evaluation TEXT,
            retry_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_id INTEGER
        )
    """)
    connection.commit()
    connection.close()

def save_run_history(
    goal: str,
    plan: str,
    result: str,
    evaluation: str,
    retry_count: int
):
    user_id = get_current_user_id()

    connection = get_connection()

    cursor = connection.execute(
        """
        INSERT INTO agent_run_history
        (goal, plan, result, evaluation, retry_count, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            goal,
            plan,
            result,
            evaluation,
            retry_count,
            user_id
        )
    )

    run_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return {
        "id": run_id,
        "goal": goal,
        "plan": plan,
        "result": result,
        "evaluation": evaluation,
        "retry_count": retry_count
    }

def list_run_history(limit: int = 20):
    user_id = get_current_user_id()

    connection = get_connection()

    cursor = connection.execute(
        """
        SELECT id, goal, plan, result, evaluation, retry_count, created_at
        FROM agent_run_history
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
        """,
        (user_id, limit)
    )

    runs = cursor.fetchall()
    connection.close()

    return [
        {
            "id": run_id,
            "goal": goal,
            "plan": plan,
            "result": result,
            "evaluation": evaluation,
            "retry_count": retry_count,
            "created_at": created_at
        }
        for run_id, goal, plan, result, evaluation, retry_count, created_at in runs
    ]

def get_run_history_item(run_id: int):
    user_id = get_current_user_id()

    connection = get_connection()

    cursor = connection.execute(
        """
        SELECT id, goal, plan, result, evaluation, retry_count, created_at
        FROM agent_run_history
        WHERE id = ? AND user_id = ?
        """,
        (run_id, user_id)
    )

    run = cursor.fetchone()
    connection.close()

    if run is None:
        return None

    return {
        "id": run[0],
        "goal": run[1],
        "plan": run[2],
        "result": run[3],
        "evaluation": run[4],
        "retry_count": run[5],
        "created_at": run[6]
    }

def save_memory(goal: str, result: str, evaluation: str):
    user_id = get_current_user_id()

    connection = get_connection()

    cursor = connection.execute(
        """
        INSERT INTO agent_memory
        (goal, result, evaluation, user_id)
        VALUES (?, ?, ?, ?)
        """,
        (goal, result, evaluation, user_id)
    )

    memory_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return {
        "id": memory_id,
        "goal": goal,
        "result": result,
        "evaluation": evaluation
    }



def list_memory(limit: int = 10):
    user_id = get_current_user_id()

    connection = get_connection()

    cursor = connection.execute(
        """
        SELECT id, goal, result, evaluation, created_at
        FROM agent_memory
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
        """,
        (user_id, limit)
    )

    memories = cursor.fetchall()
    connection.close()

    return [
        {
            "id": memory_id,
            "goal": goal,
            "result": result,
            "evaluation": evaluation,
            "created_at": created_at
        }
        for memory_id, goal, result, evaluation, created_at in memories
    ]

def initialize_user_table():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()


def hash_password(password: str, salt: str | None = None):
    if salt is None:
        salt = hashlib.sha256(
            hashlib.sha256(password.encode()).digest()
        ).hexdigest()[:32]

    password_hash = hashlib.scrypt(
        password.encode(),
        salt=bytes.fromhex(salt),
        n=16384,
        r=8,
        p=1
    ).hex()

    return password_hash, salt


def verify_password(password: str, password_hash: str, salt: str):
    calculated_hash, _ = hash_password(password, salt)
    return calculated_hash == password_hash


def create_user(email: str, password: str):
    password_hash, salt = hash_password(password)

    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            INSERT INTO users (email, password_hash, salt)
            VALUES (?, ?, ?)
            """,
            (email, password_hash, salt)
        )

        user_id = cursor.lastrowid
        connection.commit()

        return {
            "id": user_id,
            "email": email
        }

    except sqlite3.IntegrityError:
        return None

    finally:
        connection.close()


def authenticate_user(email: str, password: str):
    connection = get_connection()

    cursor = connection.execute(
        """
        SELECT id, email, password_hash, salt
        FROM users
        WHERE email = ?
        """,
        (email,)
    )

    user = cursor.fetchone()
    connection.close()

    if user is None:
        return None

    user_id, user_email, password_hash, salt = user

    if not verify_password(password, password_hash, salt):
        return None

    return {
        "id": user_id,
        "email": user_email
    }


initialize_user_table()
initialize_database()
initialize_document_table()
initialize_memory_table()
initialize_run_history_table()



add_user_id_column("tasks")
add_user_id_column("documents")
add_user_id_column("agent_memory")
add_user_id_column("agent_run_history")

migrate_existing_data()