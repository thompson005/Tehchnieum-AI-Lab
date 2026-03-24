param(
  [switch]$SkipPortChecks
)

$ErrorActionPreference = "Stop"

function Write-Ok([string]$Message) {
  Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn([string]$Message) {
  Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Fail([string]$Message) {
  Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Get-EnvMap([string]$Path) {
  $map = @{}

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }

    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }

    $name = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim()

    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    $map[$name] = $value
  }

  return $map
}

function Test-RequiredFile([string]$Path) {
  if (Test-Path -LiteralPath $Path) {
    Write-Ok "Found $Path"
    return $true
  }

  Write-Fail "Missing required file: $Path"
  return $false
}

function Test-Port([int]$Port) {
  $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
  if ($connection.TcpTestSucceeded) {
    Write-Warn "Port $Port is already in use"
  }
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$envPath = Join-Path $root ".env"
$hasFailures = $false

Write-Host "TECHNIEUM preflight checks" -ForegroundColor Cyan
Write-Host "Root: $root"
Write-Host ""

# Docker readiness
try {
  docker info | Out-Null
  Write-Ok "Docker daemon is available"
} catch {
  Write-Fail "Docker is not available. Start Docker Desktop and try again."
  $hasFailures = $true
}

# Required files
$requiredFiles = @(
  (Join-Path $root "docker-compose.yml"),
  (Join-Path $root "LAB-2/database/init.sql"),
  (Join-Path $root "LAB-4/database/init.sql"),
  (Join-Path $root "LAB-5/database/init.sql"),
  (Join-Path $root "LAB-3/backend/database/seed_data.py")
)

foreach ($file in $requiredFiles) {
  if (-not (Test-RequiredFile -Path $file)) {
    $hasFailures = $true
  }
}

# Environment validation
if (-not (Test-Path -LiteralPath $envPath)) {
  Write-Fail "Missing .env file at repo root"
  $hasFailures = $true
} else {
  Write-Ok "Found $envPath"
  $envMap = Get-EnvMap -Path $envPath

  if (-not $envMap.ContainsKey("OPENAI_API_KEY") -or [string]::IsNullOrWhiteSpace($envMap["OPENAI_API_KEY"])) {
    Write-Fail "OPENAI_API_KEY is missing or empty in .env"
    $hasFailures = $true
  } else {
    $key = $envMap["OPENAI_API_KEY"]
    if ($key -match "^REPLACE_" -or $key -match "YOUR_" -or $key -eq "sk-..." -or $key -eq "<YOUR_KEY_HERE>") {
      Write-Fail "OPENAI_API_KEY still uses a placeholder value"
      $hasFailures = $true
    } else {
      Write-Ok "OPENAI_API_KEY is configured"
    }
  }
}

# Optional port usage warnings
if (-not $SkipPortChecks) {
  Write-Host ""
  Write-Host "Checking common lab ports for conflicts..."
  @(5555, 5000, 3000, 8000, 8080, 8083, 3001, 3100, 8090, 9000, 3200, 8100) | ForEach-Object {
    Test-Port -Port $_
  }
}

Write-Host ""
if ($hasFailures) {
  Write-Fail "Preflight failed. Resolve issues above before running docker compose up."
  exit 1
}

Write-Ok "Preflight passed. You can start the platform."
exit 0
