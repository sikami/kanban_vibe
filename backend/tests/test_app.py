import sqlite3
import urllib.error
from json import dumps
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import (
    BOARD_VERSION,
    DEFAULT_BOARD,
    DEMO_PASSWORD,
    DEMO_USERNAME,
    INDEX_FILE,
    OPENROUTER_MODEL,
    app,
)


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    app.state.db_path = tmp_path / "pm.db"
    app.state.openrouter_api_key = "test-openrouter-key"
    with TestClient(app) as test_client:
        yield test_client

    if hasattr(app.state, "openrouter_api_key"):
        delattr(app.state, "openrouter_api_key")
    if hasattr(app.state, "db_path"):
        delattr(app.state, "db_path")


def login(client: TestClient) -> None:
    response = client.post(
        "/api/login",
        json={"username": DEMO_USERNAME, "password": DEMO_PASSWORD},
    )
    assert response.status_code == 200


def test_root_serves_frontend_html_when_available(client: TestClient) -> None:
    if not INDEX_FILE.exists():
        return

    response = client.get("/")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Kanban Studio" in response.text


def test_root_reports_missing_assets_when_frontend_not_built(client: TestClient) -> None:
    if INDEX_FILE.exists():
        return

    response = client.get("/")

    assert response.status_code == 503
    assert response.json() == {"detail": "Frontend assets have not been built yet."}


def test_health_endpoint_returns_ok(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_hello_endpoint_returns_greeting(client: TestClient) -> None:
    response = client.get("/api/hello")

    assert response.status_code == 200
    assert response.json() == {"greetings": "Hello, world"}


def test_database_is_initialized_and_seeded_on_startup(client: TestClient) -> None:
    db_path = Path(app.state.db_path)

    assert db_path.exists()

    with sqlite3.connect(db_path) as connection:
        users = connection.execute(
            "SELECT username, password FROM users WHERE username = ?",
            (DEMO_USERNAME,),
        ).fetchone()
        board = connection.execute(
            """
            SELECT board_json, board_version
            FROM boards
            JOIN users ON users.id = boards.user_id
            WHERE users.username = ?
            """,
            (DEMO_USERNAME,),
        ).fetchone()

    assert users == (DEMO_USERNAME, DEMO_PASSWORD)
    assert board is not None
    assert board[1] == BOARD_VERSION


def test_session_is_unauthenticated_by_default(client: TestClient) -> None:
    response = client.get("/api/session")

    assert response.status_code == 200
    assert response.json() == {"authenticated": False, "username": None}


def test_login_rejects_invalid_credentials(client: TestClient) -> None:
    response = client.post(
        "/api/login",
        json={"username": "wrong", "password": "credentials"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid username or password."}


def test_login_sets_cookie_and_session(client: TestClient) -> None:
    login_response = client.post(
        "/api/login",
        json={"username": DEMO_USERNAME, "password": DEMO_PASSWORD},
    )

    assert login_response.status_code == 200
    assert login_response.json() == {"authenticated": True, "username": DEMO_USERNAME}

    session_response = client.get("/api/session")

    assert session_response.status_code == 200
    assert session_response.json() == {"authenticated": True, "username": DEMO_USERNAME}


def test_logout_clears_session(client: TestClient) -> None:
    login(client)

    logout_response = client.post("/api/logout")

    assert logout_response.status_code == 200
    assert logout_response.json() == {"authenticated": False}

    session_response = client.get("/api/session")
    assert session_response.json() == {"authenticated": False, "username": None}


def test_board_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/board")

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required."}


def test_board_returns_seeded_default_board(client: TestClient) -> None:
    login(client)

    response = client.get("/api/board")

    assert response.status_code == 200
    assert response.json() == {"board": DEFAULT_BOARD.model_dump()}


def test_board_update_persists_for_authenticated_user(client: TestClient) -> None:
    login(client)

    updated_board = DEFAULT_BOARD.model_copy(deep=True)
    updated_board.columns[0].title = "Research"
    updated_board.cards["card-1"].title = "Updated roadmap themes"

    update_response = client.put(
        "/api/board",
        json={"board": updated_board.model_dump()},
    )

    assert update_response.status_code == 200
    assert update_response.json() == {"board": updated_board.model_dump()}

    get_response = client.get("/api/board")
    assert get_response.status_code == 200
    assert get_response.json() == {"board": updated_board.model_dump()}


def test_board_update_rejects_invalid_payload(client: TestClient) -> None:
    login(client)

    response = client.put(
        "/api/board",
        json={
            "board": {
                "columns": [{"id": "col-1", "title": "Col 1", "cardIds": ["card-1"]}],
                "cards": {},
            }
        },
    )

    assert response.status_code == 422


def test_board_update_requires_authentication(client: TestClient) -> None:
    response = client.put(
        "/api/board",
        json={"board": DEFAULT_BOARD.model_dump()},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required."}


def test_ai_connectivity_check_returns_model_response(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    class DummyResponse:
        def __enter__(self) -> "DummyResponse":
            return self

        def __exit__(self, exc_type, exc, tb) -> None:
            return None

        def read(self) -> bytes:
            return dumps(
                {
                    "choices": [
                        {
                            "message": {
                                "content": "4",
                            }
                        }
                    ]
                }
            ).encode("utf-8")

    def fake_urlopen(request, timeout):
        assert request.full_url == "https://openrouter.ai/api/v1/chat/completions"
        assert request.get_method() == "POST"
        assert timeout == 30
        assert request.headers["Authorization"] == "Bearer test-openrouter-key"
        return DummyResponse()

    monkeypatch.setattr("app.main.urllib.request.urlopen", fake_urlopen)

    login(client)
    response = client.post("/api/ai/connectivity-check")

    assert response.status_code == 200
    assert response.json() == {
        "model": OPENROUTER_MODEL,
        "prompt": "2+2",
        "response": "4",
    }


def test_ai_connectivity_check_requires_config(client: TestClient) -> None:
    app.state.openrouter_api_key = None
    login(client)

    response = client.post("/api/ai/connectivity-check")

    assert response.status_code == 503
    assert response.json() == {"detail": "OPENROUTER_API_KEY is not configured."}


def test_ai_connectivity_check_surfaces_upstream_errors(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_urlopen(request, timeout):
        raise urllib.error.URLError("network unavailable")

    monkeypatch.setattr("app.main.urllib.request.urlopen", fake_urlopen)

    login(client)
    response = client.post("/api/ai/connectivity-check")

    assert response.status_code == 503
    assert response.json() == {
        "detail": "OpenRouter request failed: network unavailable"
    }
