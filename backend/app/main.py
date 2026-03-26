from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse

app = FastAPI(title="Project Management MVP")

STATIC_DIR = Path(__file__).resolve().parent / "static"
INDEX_FILE = STATIC_DIR / "index.html"


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
