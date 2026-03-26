@echo off
set ROOT_DIR=%~dp0..
set RUN_DIR=%ROOT_DIR%\scripts\run

if not exist "%RUN_DIR%" mkdir "%RUN_DIR%"

docker compose -f "%ROOT_DIR%\docker-compose.yml" up --build -d
docker compose -f "%ROOT_DIR%\docker-compose.yml" ps > "%RUN_DIR%\last-start.txt"

echo App started at http://localhost:8000
