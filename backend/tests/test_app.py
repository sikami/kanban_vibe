from fastapi.testclient import TestClient

from app.main import INDEX_FILE, app


client = TestClient(app)


def test_root_serves_frontend_html_when_available() -> None:
    if not INDEX_FILE.exists():
        return

    response = client.get("/")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Kanban Studio" in response.text


def test_root_reports_missing_assets_when_frontend_not_built() -> None:
    if INDEX_FILE.exists():
        return

    response = client.get("/")

    assert response.status_code == 503
    assert response.json() == {"detail": "Frontend assets have not been built yet."}


def test_health_endpoint_returns_ok() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_hello_endpoint_returns_greeting() -> None:
    response = client.get("/api/hello")

    assert response.status_code == 200
    assert response.json() == {"greetings": "Hello, world"}


def test_session_is_unauthenticated_by_default() -> None:
    response = client.get("/api/session")

    assert response.status_code == 200
    assert response.json() == {"authenticated": False, "username": None}


def test_login_rejects_invalid_credentials() -> None:
    response = client.post(
        "/api/login",
        json={"username": "wrong", "password": "credentials"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid username or password."}


def test_login_sets_cookie_and_session() -> None:
    auth_client = TestClient(app)

    login_response = auth_client.post(
        "/api/login",
        json={"username": "user", "password": "password"},
    )

    assert login_response.status_code == 200
    assert login_response.json() == {"authenticated": True, "username": "user"}

    session_response = auth_client.get("/api/session")

    assert session_response.status_code == 200
    assert session_response.json() == {"authenticated": True, "username": "user"}


def test_logout_clears_session() -> None:
    auth_client = TestClient(app)
    auth_client.post("/api/login", json={"username": "user", "password": "password"})

    logout_response = auth_client.post("/api/logout")

    assert logout_response.status_code == 200
    assert logout_response.json() == {"authenticated": False}

    session_response = auth_client.get("/api/session")
    assert session_response.json() == {"authenticated": False, "username": None}
