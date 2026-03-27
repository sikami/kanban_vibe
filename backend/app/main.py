from __future__ import annotations

import json
import sqlite3
import urllib.error
import urllib.request
from pathlib import Path
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, ValidationError, model_validator

app = FastAPI(title="Project Management MVP")

STATIC_DIR = Path(__file__).resolve().parent / "static"
INDEX_FILE = STATIC_DIR / "index.html"
SESSION_COOKIE = "pm_session"
SESSION_VALUE = "authenticated"
DEMO_USERNAME = "user"
DEMO_PASSWORD = "password"
BOARD_VERSION = 1
DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "data" / "pm.db"
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "openai/gpt-oss-120b"


class LoginRequest(BaseModel):
    username: str
    password: str


class CardModel(BaseModel):
    id: str
    title: str
    details: str


class ColumnModel(BaseModel):
    id: str
    title: str
    cardIds: list[str]


class BoardModel(BaseModel):
    columns: list[ColumnModel]
    cards: dict[str, CardModel]

    @model_validator(mode="after")
    def validate_card_references(self) -> "BoardModel":
        seen_card_ids: set[str] = set()

        for column in self.columns:
            for card_id in column.cardIds:
                if card_id not in self.cards:
                    raise ValueError(f"Column references missing card '{card_id}'.")
                if card_id in seen_card_ids:
                    raise ValueError(f"Card '{card_id}' appears in multiple columns.")
                seen_card_ids.add(card_id)

        extra_cards = set(self.cards) - seen_card_ids
        if extra_cards:
            extra_card = sorted(extra_cards)[0]
            raise ValueError(
                f"Card '{extra_card}' is not assigned to any column."
            )

        return self


class BoardResponse(BaseModel):
    board: BoardModel


class BoardUpdateRequest(BaseModel):
    board: BoardModel


class StoredBoardRecord(BaseModel):
    board: BoardModel
    board_version: int = Field(alias="boardVersion")


class AIConnectivityResponse(BaseModel):
    model: str
    prompt: str
    response: str


class AIConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AIChatRequest(BaseModel):
    message: str
    conversationHistory: list[AIConversationMessage] = Field(default_factory=list)


class AIModelResponse(BaseModel):
    assistantMessage: str
    boardUpdate: Optional[BoardModel] = None


class AIChatResponse(BaseModel):
    assistantMessage: str
    boardUpdated: bool
    board: Optional[BoardModel] = None


DEFAULT_BOARD = BoardModel(
    columns=[
        ColumnModel(id="col-backlog", title="Backlog", cardIds=["card-1", "card-2"]),
        ColumnModel(id="col-discovery", title="Discovery", cardIds=["card-3"]),
        ColumnModel(
            id="col-progress",
            title="In Progress",
            cardIds=["card-4", "card-5"],
        ),
        ColumnModel(id="col-review", title="Review", cardIds=["card-6"]),
        ColumnModel(id="col-done", title="Done", cardIds=["card-7", "card-8"]),
    ],
    cards={
        "card-1": CardModel(
            id="card-1",
            title="Align roadmap themes",
            details="Draft quarterly themes with impact statements and metrics.",
        ),
        "card-2": CardModel(
            id="card-2",
            title="Gather customer signals",
            details="Review support tags, sales notes, and churn feedback.",
        ),
        "card-3": CardModel(
            id="card-3",
            title="Prototype analytics view",
            details="Sketch initial dashboard layout and key drill-downs.",
        ),
        "card-4": CardModel(
            id="card-4",
            title="Refine status language",
            details="Standardize column labels and tone across the board.",
        ),
        "card-5": CardModel(
            id="card-5",
            title="Design card layout",
            details="Add hierarchy and spacing for scanning dense lists.",
        ),
        "card-6": CardModel(
            id="card-6",
            title="QA micro-interactions",
            details="Verify hover, focus, and loading states.",
        ),
        "card-7": CardModel(
            id="card-7",
            title="Ship marketing page",
            details="Final copy approved and asset pack delivered.",
        ),
        "card-8": CardModel(
            id="card-8",
            title="Close onboarding sprint",
            details="Document release notes and share internally.",
        ),
    },
)


def get_database_path() -> Path:
    configured_path = getattr(app.state, "db_path", DEFAULT_DB_PATH)
    return Path(configured_path)


def load_env_file() -> dict[str, str]:
    if not ENV_FILE.exists():
        return {}

    values: dict[str, str] = {}
    for raw_line in ENV_FILE.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip("\"'")

    return values


def get_openrouter_api_key() -> str:
    if hasattr(app.state, "openrouter_api_key"):
        configured_key = app.state.openrouter_api_key
        if configured_key:
            return configured_key
        raise RuntimeError("OPENROUTER_API_KEY is not configured.")

    env_values = load_env_file()
    api_key = env_values.get("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not configured.")

    return api_key


def extract_openrouter_text(payload: dict[str, object]) -> str:
    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        raise RuntimeError("OpenRouter response did not include choices.")

    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        raise RuntimeError("OpenRouter response choice was malformed.")

    message = first_choice.get("message")
    if not isinstance(message, dict):
        raise RuntimeError("OpenRouter response message was malformed.")

    content = message.get("content")
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        text_parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text = item.get("text")
                if isinstance(text, str):
                    text_parts.append(text)

        combined_text = "".join(text_parts).strip()
        if combined_text:
            return combined_text

    raise RuntimeError("OpenRouter response did not include text content.")


def call_openrouter_messages(messages: list[dict[str, str]]) -> str:
    payload = json.dumps(
        {
            "model": OPENROUTER_MODEL,
            "messages": messages,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        OPENROUTER_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {get_openrouter_api_key()}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore").strip()
        raise RuntimeError(
            f"OpenRouter request failed with status {exc.code}: {detail or exc.reason}"
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"OpenRouter request failed: {exc.reason}") from exc

    return extract_openrouter_text(response_payload)


def call_openrouter(prompt: str) -> str:
    return call_openrouter_messages([{"role": "user", "content": prompt}])


def extract_json_payload(raw_text: str) -> dict[str, object]:
    stripped = raw_text.strip()

    if stripped.startswith("```"):
        lines = stripped.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        stripped = "\n".join(lines).strip()

    try:
        payload = json.loads(stripped)
    except json.JSONDecodeError as exc:
        raise RuntimeError("AI response was not valid JSON.") from exc

    if not isinstance(payload, dict):
        raise RuntimeError("AI response root must be a JSON object.")

    return payload


def build_ai_messages(
    board: BoardModel,
    conversation_history: list[AIConversationMessage],
    user_message: str,
) -> list[dict[str, str]]:
    system_prompt = (
        "You are assisting with a kanban board. "
        "Return only valid JSON with this exact shape: "
        '{"assistantMessage":"string","boardUpdate":null}. '
        "If you want to change the board, replace null with a full board object "
        "matching the provided schema. If no board change is needed, keep "
        '"boardUpdate" as null.'
    )
    board_payload = json.dumps(board.model_dump(), separators=(",", ":"))
    history_payload = json.dumps(
        [message.model_dump() for message in conversation_history],
        separators=(",", ":"),
    )

    user_payload = (
        "Current board JSON:\n"
        f"{board_payload}\n\n"
        "Conversation history JSON:\n"
        f"{history_payload}\n\n"
        "Latest user message:\n"
        f"{user_message}"
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_payload},
    ]


def get_db_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(get_database_path())
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def serialize_board(board: BoardModel) -> str:
    return json.dumps(board.model_dump(), separators=(",", ":"))


def initialize_database() -> None:
    db_path = get_database_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)

    with get_db_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL UNIQUE,
              password TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS boards (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL UNIQUE,
              board_json TEXT NOT NULL,
              board_version INTEGER NOT NULL DEFAULT 1,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """
        )

        connection.execute(
            """
            INSERT INTO users (username, password)
            VALUES (?, ?)
            ON CONFLICT(username) DO NOTHING
            """,
            (DEMO_USERNAME, DEMO_PASSWORD),
        )

        user_row = connection.execute(
            "SELECT id FROM users WHERE username = ?",
            (DEMO_USERNAME,),
        ).fetchone()
        if user_row is None:
            raise RuntimeError("Failed to initialize the demo user.")

        connection.execute(
            """
            INSERT INTO boards (user_id, board_json, board_version)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO NOTHING
            """,
            (user_row["id"], serialize_board(DEFAULT_BOARD), BOARD_VERSION),
        )
        connection.commit()


@app.on_event("startup")
def startup_event() -> None:
    initialize_database()


def is_authenticated(request: Request) -> bool:
    return request.cookies.get(SESSION_COOKIE) == SESSION_VALUE


def require_authenticated_user(request: Request) -> str:
    if not is_authenticated(request):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )
    return DEMO_USERNAME


def get_user_id(username: str) -> int:
    initialize_database()
    with get_db_connection() as connection:
        row = connection.execute(
            "SELECT id FROM users WHERE username = ?",
            (username,),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="User not found.")

    return int(row["id"])


def fetch_board_record(user_id: int) -> StoredBoardRecord:
    initialize_database()
    with get_db_connection() as connection:
        row = connection.execute(
            """
            SELECT board_json, board_version
            FROM boards
            WHERE user_id = ?
            """,
            (user_id,),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Board not found.")

    board_record = StoredBoardRecord(
        boardVersion=int(row["board_version"]),
        board=BoardModel.model_validate_json(row["board_json"]),
    )

    if board_record.board_version != BOARD_VERSION:
        raise HTTPException(
            status_code=500,
            detail="Unsupported board version in storage.",
        )

    return board_record


def save_board_record(user_id: int, board: BoardModel) -> None:
    initialize_database()
    with get_db_connection() as connection:
        connection.execute(
            """
            UPDATE boards
            SET board_json = ?, board_version = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            """,
            (serialize_board(board), BOARD_VERSION, user_id),
        )
        connection.commit()


@app.get("/")
def read_root():
    if not INDEX_FILE.exists():
        return JSONResponse(
            status_code=503,
            content={"detail": "Frontend assets have not been built yet."},
        )
    return FileResponse(INDEX_FILE)


@app.get("/api/health")
def read_health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/session")
def read_session(request: Request) -> dict[str, object]:
    authenticated = is_authenticated(request)
    return {
        "authenticated": authenticated,
        "username": DEMO_USERNAME if authenticated else None,
    }


@app.post("/api/login")
def login(payload: LoginRequest, response: Response):
    if payload.username != DEMO_USERNAME or payload.password != DEMO_PASSWORD:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Invalid username or password."},
        )

    initialize_database()
    response.set_cookie(
        key=SESSION_COOKIE,
        value=SESSION_VALUE,
        httponly=True,
        samesite="lax",
        path="/",
    )
    return {"authenticated": True, "username": DEMO_USERNAME}


@app.post("/api/logout")
def logout(response: Response) -> dict[str, bool]:
    response.delete_cookie(key=SESSION_COOKIE, path="/")
    return {"authenticated": False}


@app.get("/api/board", response_model=BoardResponse)
def read_board(request: Request) -> BoardResponse:
    username = require_authenticated_user(request)
    user_id = get_user_id(username)
    board_record = fetch_board_record(user_id)
    return BoardResponse(board=board_record.board)


@app.put("/api/board", response_model=BoardResponse)
def update_board(request: Request, payload: BoardUpdateRequest) -> BoardResponse:
    username = require_authenticated_user(request)
    user_id = get_user_id(username)
    save_board_record(user_id, payload.board)
    return BoardResponse(board=payload.board)


@app.post("/api/ai/connectivity-check", response_model=AIConnectivityResponse)
def run_ai_connectivity_check(request: Request) -> AIConnectivityResponse:
    require_authenticated_user(request)
    prompt = "2+2"

    try:
        ai_response = call_openrouter(prompt)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    return AIConnectivityResponse(
        model=OPENROUTER_MODEL,
        prompt=prompt,
        response=ai_response,
    )


@app.post("/api/ai/chat", response_model=AIChatResponse)
def run_ai_chat(request: Request, payload: AIChatRequest) -> AIChatResponse:
    username = require_authenticated_user(request)
    user_id = get_user_id(username)
    current_board = fetch_board_record(user_id).board

    try:
        raw_response = call_openrouter_messages(
            build_ai_messages(
                current_board,
                payload.conversationHistory,
                payload.message,
            )
        )
        parsed_response = AIModelResponse.model_validate(
            extract_json_payload(raw_response)
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI response did not match the expected schema.",
        ) from exc

    if parsed_response.boardUpdate is None:
        return AIChatResponse(
            assistantMessage=parsed_response.assistantMessage,
            boardUpdated=False,
            board=None,
        )

    save_board_record(user_id, parsed_response.boardUpdate)
    return AIChatResponse(
        assistantMessage=parsed_response.assistantMessage,
        boardUpdated=True,
        board=parsed_response.boardUpdate,
    )


@app.get("/api/hello")
def read_hello() -> dict[str, str]:
    return {"greetings": "Hello, world"}


@app.get("/{file_path:path}")
def read_static_asset(file_path: str):
    if not STATIC_DIR.exists():
        return JSONResponse(
            status_code=503,
            content={"detail": "Frontend assets have not been built yet."},
        )

    asset_path = (STATIC_DIR / file_path).resolve()
    if STATIC_DIR not in asset_path.parents and asset_path != STATIC_DIR:
        return JSONResponse(status_code=404, content={"detail": "Not found"})

    if asset_path.is_file():
        return FileResponse(asset_path)

    return JSONResponse(status_code=404, content={"detail": "Not found"})
