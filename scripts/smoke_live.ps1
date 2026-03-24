param(
  [string]$BaseUrl = "http://13.232.249.249"
)

$required = @(
  ":5555/health",
  ":5000/health",
  ":8000/health"
)

$optional = @(
  ":3000",
  ":8080/health",
  ":8090/health",
  ":9000/health",
  ":3001",
  ":3100",
  ":3200",
  ":8100/health"
)

function Get-StatusCode([string]$Url) {
  $code = & curl.exe -sS -o NUL -w "%{http_code}" --max-time 15 $Url
  if ($LASTEXITCODE -ne 0) { return "000" }
  return $code
}

$failures = 0

Write-Host "Required endpoints"
foreach ($ep in $required) {
  $url = "$BaseUrl$ep"
  $code = Get-StatusCode -Url $url
  if ($code -match '^2\d\d$') {
    Write-Host "OK   $code $url"
  } else {
    Write-Host "FAIL $code $url"
    $failures++
  }
}

Write-Host ""
Write-Host "Optional endpoints"
foreach ($ep in $optional) {
  $url = "$BaseUrl$ep"
  $code = Get-StatusCode -Url $url
  if ($code -match '^2\d\d$') {
    Write-Host "OK   $code $url"
  } else {
    Write-Host "WARN $code $url"
  }
}

if ($failures -gt 0) {
  Write-Host ""
  Write-Host "Smoke test failed with $failures required endpoint failure(s)."
  exit 1
}

Write-Host ""
Write-Host "Smoke test passed."
