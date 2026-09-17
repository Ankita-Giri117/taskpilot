import json

from .task_manager import get_connection, get_current_user_id


def initialize_calendar_table():
    connection = get_connection()

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS calendar_credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            token_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    connection.commit()
    connection.close()


def save_calendar_credentials(token_data: dict):
    user_id = get_current_user_id()

    connection = get_connection()

    existing = connection.execute(
        """
        SELECT id
        FROM calendar_credentials
        WHERE user_id = ?
        """,
        (user_id,),
    ).fetchone()

    token_json = json.dumps(token_data)

    if existing:
        connection.execute(
            """
            UPDATE calendar_credentials
            SET token_data = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            """,
            (token_json, user_id),
        )
    else:
        connection.execute(
            """
            INSERT INTO calendar_credentials
            (user_id, token_data)
            VALUES (?, ?)
            """,
            (user_id, token_json),
        )

    connection.commit()
    connection.close()


def get_calendar_credentials():
    user_id = get_current_user_id()

    connection = get_connection()

    row = connection.execute(
        """
        SELECT token_data
        FROM calendar_credentials
        WHERE user_id = ?
        """,
        (user_id,),
    ).fetchone()

    connection.close()

    if row is None:
        return None

    return json.loads(row[0])


def delete_calendar_credentials():
    user_id = get_current_user_id()

    connection = get_connection()

    connection.execute(
        """
        DELETE FROM calendar_credentials
        WHERE user_id = ?
        """,
        (user_id,),
    )

    connection.commit()
    connection.close()