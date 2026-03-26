$RootDir = Split-Path -Parent $PSScriptRoot
$RunDir = Join-Path $RootDir "scripts/run"

New-Item -ItemType Directory -Force -Path $RunDir | Out-Null

docker compose -f (Join-Path $RootDir "docker-compose.yml") up --build -d
docker compose -f (Join-Path $RootDir "docker-compose.yml") ps | Out-File -FilePath (Join-Path $RunDir "last-start.txt")

Write-Host "App started at http://localhost:8000"
