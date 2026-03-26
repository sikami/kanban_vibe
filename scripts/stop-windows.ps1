$RootDir = Split-Path -Parent $PSScriptRoot

docker compose -f (Join-Path $RootDir "docker-compose.yml") down --remove-orphans

Write-Host "App stopped"
