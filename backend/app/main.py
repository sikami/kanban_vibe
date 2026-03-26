from pathlib import Path

from fastapi import FastAPI, Request, Response, status
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

app = FastAPI(title="Project Management MVP")

STATIC_DIR = Path(__file__).resolve().parent / "static"
INDEX_FILE = STATIC_DIR / "index.html"
SESSION_COOKIE = "pm_session"
SESSION_VALUE = "authenticated"
DEMO_USERNAME = "user"
DEMO_PASSWORD = "password"


class LoginRequest(BaseModel):
    username: str
    password: str


def is_authenticated(request: Request) -> bool:
    return request.cookies.get(SESSION_COOKIE) == SESSION_VALUE


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
def read_session(request: Request) -> dict[str, bool | str | None]:
    authenticated = is_authenticated(request)
    return {
        "authenticated": authenticated,
        "username": DEMO_USERNAME if authenticated else None,
    }


@app.post("/api/login")
def login(payload: LoginRequest, response: Response):
    if (
        payload.username != DEMO_USERNAME
        or payload.password != DEMO_PASSWORD
    ):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Invalid username or password."},
        )

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
