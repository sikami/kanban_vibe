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