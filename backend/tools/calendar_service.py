from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import os

from .calendar_manager import (
    get_calendar_credentials,
    save_calendar_credentials,
)

def get_calendar_service():
    token_data = get_calendar_credentials()

    if token_data is None:
        raise RuntimeError("Google Calendar is not connected.")

    credentials = Credentials(
    token=token_data.get("token"),
    refresh_token=token_data.get("refresh_token"),
    token_uri=token_data.get("token_uri"),
    client_id=token_data.get("client_id"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    scopes=token_data.get("scopes"),
)

    if not credentials.valid:
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())

            refreshed_token_data = {
    "token": credentials.token,
    "refresh_token": credentials.refresh_token,
    "token_uri": credentials.token_uri,
    "client_id": credentials.client_id,
    "scopes": credentials.scopes,
    }

            save_calendar_credentials(refreshed_token_data)

        else:
            raise RuntimeError(
                "Google Calendar credentials are invalid. Please reconnect Google Calendar."
            )

    return build("calendar", "v3", credentials=credentials)