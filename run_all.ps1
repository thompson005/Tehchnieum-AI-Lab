param(
  [switch]$SkipLab2Frontend,
  [switch]$SkipLab3,
  [switch]$SkipLab4,
  [switch]$SkipPortal
)

$ErrorActionPreference = "Stop"

function Write-Section($text) {
  Write-Host ""
  Write-Host "=== $text ===" -ForegroundColor Cyan
}

function Import-DotEnv([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing .env at: $Path"
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line) { return }
    if ($line.StartsWith("#")) { return }

    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }

    $name = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim()

    # Strip optional surrounding quotes
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}

function Ensure-VenvAndDeps([string]$WorkingDir, [string]$VenvDir, [string]$RequirementsPath) {
  if (-not (Test-Path -LiteralPath $WorkingDir)) { throw "Missing directory: $WorkingDir" }
  Push-Location $WorkingDir
  try {
    if (-not (Test-Path -LiteralPath $VenvDir)) {
      py -m venv $VenvDir | Out-Null
    }
    if ($RequirementsPath -and (Test-Path -LiteralPath $RequirementsPath)) {
      & (Join-Path $VenvDir "Scripts\python.exe") -m pip install -q --upgrade pip
      & (Join-Path $VenvDir "Scripts\pip.exe") install -q -r $RequirementsPath
    }
  } finally {
    Pop-Location
  }
}

function Start-Window([string]$Title, [string]$WorkingDir, [string]$Command) {
  if (-not (Test-Path -LiteralPath $WorkingDir)) { throw "Missing directory: $WorkingDir" }

  $escaped = $Command.Replace('"', '\"')
  $args = @(
    "-NoExit",
    "-Command",
    "Set-Location -LiteralPath `"$WorkingDir`"; `$Host.UI.RawUI.WindowTitle = `"$Title`"; $escaped"
  )

  Start-Process -FilePath "powershell.exe" -ArgumentList $args | Out-Null
}

function Require-Command([string]$Name, [string]$Hint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command '$Name'. $Hint"
  }
}

$labsRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootEnv = Join-Path $labsRoot ".env"

Write-Section "Loading environment (.env)"
Import-DotEnv -Path $rootEnv

# --- Preconditions (tools) ---
Require-Command -Name "py" -Hint "Install Python and ensure 'py' launcher is available."
if (-not $SkipLab2Frontend) { Require-Command -Name "npm" -Hint "Install Node.js 18+ and ensure 'npm' is on PATH." }

Write-Host "Note: This script does NOT start Postgres/Redis/Ollama for you." -ForegroundColor Yellow
Write-Host "Make sure these are already running locally:" -ForegroundColor Yellow
Write-Host "  - Postgres (LAB-2/LAB-3/LAB-4 databases created)" -ForegroundColor Yellow
Write-Host "  - Redis on localhost:6379 (LAB-2, LAB-4)" -ForegroundColor Yellow
Write-Host "  - Ollama on localhost:11434 (LAB-3)" -ForegroundColor Yellow

# --- Portal ---
if (-not $SkipPortal) {
  Write-Section "Portal (5555)"
  $portalDir = Join-Path $labsRoot "portal"
  Ensure-VenvAndDeps -WorkingDir $portalDir -VenvDir ".venv" -RequirementsPath (Join-Path $portalDir "requirements.txt")
  Start-Window -Title "PORTAL :5555" -WorkingDir $portalDir -Command @"
`$env:PORTAL_PORT = "5555"
`$env:PORTAL_DEBUG = "False"
`$env:LAB1_URL = "http://localhost:5000"
`$env:LAB2_URL = "http://localhost:3000"
`$env:LAB3_URL = "http://localhost:8080"
`$env:LAB4_URL = "http://localhost:3100"
.\.venv\Scripts\python.exe setup_db.py
.\.venv\Scripts\python.exe app.py
"@
}

# --- LAB-1 ---
Write-Section "LAB-1 (5000)"
$lab1Dir = Join-Path $labsRoot "LAB-1"
Ensure-VenvAndDeps -WorkingDir $lab1Dir -VenvDir ".venv" -RequirementsPath (Join-Path $lab1Dir "requirements.txt")
Start-Window -Title "LAB-1 :5000" -WorkingDir $lab1Dir -Command @"
`$env:OPENAI_API_KEY = [Environment]::GetEnvironmentVariable("OPENAI_API_KEY","Process")
`$env:PORT = "5000"
.\.venv\Scripts\python.exe setup_database.py
.\.venv\Scripts\python.exe app.py
"@

# --- LAB-2 ---
Write-Section "LAB-2 (API 8000 + UI 3000)"
$lab2BackendDir = Join-Path $labsRoot "LAB-2\backend"
Ensure-VenvAndDeps -WorkingDir $lab2BackendDir -VenvDir ".venv" -RequirementsPath (Join-Path $lab2BackendDir "requirements.txt")
Start-Window -Title "LAB-2 API :8000" -WorkingDir $lab2BackendDir -Command @"
`$env:OPENAI_API_KEY = [Environment]::GetEnvironmentVariable("OPENAI_API_KEY","Process")
if (-not `$env:DATABASE_URL) { `$env:DATABASE_URL = "postgresql://bankadmin:SecureBank2024!@localhost:5432/securebank" }
if (-not `$env:REDIS_URL) { `$env:REDIS_URL = "redis://localhost:6379" }
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
"@

if (-not $SkipLab2Frontend) {
  $lab2FrontendDir = Join-Path $labsRoot "LAB-2\frontend"
  Start-Window -Title "LAB-2 UI :3000" -WorkingDir $lab2FrontendDir -Command @"
if (-not (Test-Path -LiteralPath ".\node_modules")) { npm install }
`$env:REACT_APP_API_URL = "http://localhost:8000"
npm start
"@
}

# --- LAB-3 ---
if (-not $SkipLab3) {
  Write-Section "LAB-3 (ShopSec API gateway 8080)"
  $lab3Dir = Join-Path $labsRoot "LAB-3"
  Ensure-VenvAndDeps -WorkingDir $lab3Dir -VenvDir ".venv" -RequirementsPath (Join-Path $lab3Dir "requirements.txt")

  # Seed DB (idempotent-enough: it clears/recreates rows each time)
  Start-Window -Title "LAB-3 SEED" -WorkingDir $lab3Dir -Command @"
`$env:DATABASE_URL = "postgresql://shopsec:shopsec123@localhost:5432/shopsec_db"
.\.venv\Scripts\python.exe .\backend\database\seed_data.py
Write-Host "Seed complete. You can close this window." -ForegroundColor Green
"@

  $lab3OrderDir = Join-Path $labsRoot "LAB-3\backend\services\order_service"
  Start-Window -Title "LAB-3 Order :8001" -WorkingDir $lab3OrderDir -Command @"
`$env:DATABASE_URL = "postgresql://shopsec:shopsec123@localhost:5432/shopsec_db"
`$env:PAYMENT_SERVICE_URL = "http://localhost:8004"
..\..\..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
"@

  $lab3SearchDir = Join-Path $labsRoot "LAB-3\backend\services\search_service"
  Start-Window -Title "LAB-3 Search :8002" -WorkingDir $lab3SearchDir -Command @"
`$env:DATABASE_URL = "postgresql://shopsec:shopsec123@localhost:5432/shopsec_db"
..\..\..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8002 --reload
"@

  $lab3AgentDir = Join-Path $labsRoot "LAB-3\backend\services\agent_core"
  Start-Window -Title "LAB-3 Agent :8003" -WorkingDir $lab3AgentDir -Command @"
`$env:DATABASE_URL = "postgresql://shopsec:shopsec123@localhost:5432/shopsec_db"
`$env:OLLAMA_BASE_URL = "http://localhost:11434"
`$env:OLLAMA_MODEL = "llama3"
`$env:ORDER_SERVICE_URL = "http://localhost:8001"
`$env:SEARCH_SERVICE_URL = "http://localhost:8002"
..\..\..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8003 --reload
"@

  $lab3GatewayDir = Join-Path $labsRoot "LAB-3\backend"
  Start-Window -Title "LAB-3 Gateway :8080" -WorkingDir $lab3GatewayDir -Command @"
`$env:ORDER_SERVICE_URL = "http://localhost:8001"
`$env:SEARCH_SERVICE_URL = "http://localhost:8002"
`$env:AGENT_SERVICE_URL = "http://localhost:8003"
..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8080 --reload
"@
}

# --- LAB-4 ---
if (-not $SkipLab4) {
  Write-Section "LAB-4 (TravelNest 3100/8090/9000)"
  $lab4BackendDir = Join-Path $labsRoot "LAB-4\backend"
  Ensure-VenvAndDeps -WorkingDir $lab4BackendDir -VenvDir ".venv" -RequirementsPath (Join-Path $lab4BackendDir "requirements.txt")

  # Start ChromaDB server (required for rag_setup + AI agent)
  Start-Window -Title "LAB-4 Chroma :8000" -WorkingDir $lab4BackendDir -Command @"
.\.venv\Scripts\python.exe -m pip show chromadb | Out-Null
.\.venv\Scripts\chroma.exe run --host localhost --port 8000 --path .\chroma_data
"@

  $dbUrl = "postgresql://travelnest:travelnest123@localhost:5432/travelnest"

  # Microservices 8001-8006
  $svc = @(
    @{name="User";      dir="user_service";      port=8001},
    @{name="Flight";    dir="flight_service";    port=8002},
    @{name="Hotel";     dir="hotel_service";     port=8003},
    @{name="Booking";   dir="booking_service";   port=8004},
    @{name="Payment";   dir="payment_service";   port=8005},
    @{name="Transport"; dir="transport_service"; port=8006}
  )
  foreach ($s in $svc) {
    $svcDir = Join-Path $lab4BackendDir $s.dir
    Start-Window -Title ("LAB-4 {0} :{1}" -f $s.name, $s.port) -WorkingDir $svcDir -Command @"
`$env:DATABASE_URL = "$dbUrl"
..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port $($s.port)
"@
  }

  # RAG seed (safe to re-run; will skip if already populated)
  $aiDir = Join-Path $lab4BackendDir "ai_agent"
  Start-Window -Title "LAB-4 RAG setup" -WorkingDir $aiDir -Command @"
`$env:CHROMA_HOST="localhost"
`$env:CHROMA_PORT="8000"
..\.venv\Scripts\python.exe rag_setup.py
Write-Host "RAG setup complete. You can close this window." -ForegroundColor Green
"@

  # AI Agent :9000
  Start-Window -Title "LAB-4 AI Agent :9000" -WorkingDir $aiDir -Command @"
`$env:DATABASE_URL = "$dbUrl"
`$env:OPENAI_API_KEY = [Environment]::GetEnvironmentVariable("OPENAI_API_KEY","Process")
`$env:OPENAI_MODEL = "gpt-4o-mini"
`$env:FLIGHT_SERVICE_URL="http://localhost:8002"
`$env:HOTEL_SERVICE_URL="http://localhost:8003"
`$env:BOOKING_SERVICE_URL="http://localhost:8004"
`$env:PAYMENT_SERVICE_URL="http://localhost:8005"
`$env:TRANSPORT_SERVICE_URL="http://localhost:8006"
`$env:REDIS_URL = "redis://localhost:6379"
`$env:CHROMA_HOST="localhost"
`$env:CHROMA_PORT="8000"
..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 9000
"@

  # Gateway :8090
  $gwDir = Join-Path $lab4BackendDir "gateway"
  Start-Window -Title "LAB-4 Gateway :8090" -WorkingDir $gwDir -Command @"
`$env:USER_SERVICE_URL="http://localhost:8001"
`$env:FLIGHT_SERVICE_URL="http://localhost:8002"
`$env:HOTEL_SERVICE_URL="http://localhost:8003"
`$env:BOOKING_SERVICE_URL="http://localhost:8004"
`$env:PAYMENT_SERVICE_URL="http://localhost:8005"
`$env:TRANSPORT_SERVICE_URL="http://localhost:8006"
`$env:AI_AGENT_URL="http://localhost:9000"
..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8090
"@

  # Frontend :3100 (static)
  $lab4FrontendDir = Join-Path $labsRoot "LAB-4\frontend"
  Start-Window -Title "LAB-4 UI :3100" -WorkingDir $lab4FrontendDir -Command @"
py -m http.server 3100
"@
}

Write-Section "Done"
Write-Host "Open the portal at: http://localhost:5555" -ForegroundColor Green
Write-Host "Close services by closing their windows or pressing Ctrl+C inside them." -ForegroundColor Gray

