param(
  [int]$Port = 5001
)

$ErrorActionPreference = 'Stop'

function Wait-PortListening {
  param([int]$p)
  $maxTries = 30
  for ($i=0; $i -lt $maxTries; $i++) {
    $conn = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($conn) { return $true }
    Start-Sleep -Seconds 1
  }
  return $false
}

Write-Host "[1/5] Iniciando backend (porta $Port)..."
$backendDir = Join-Path $PSScriptRoot '..' | Join-Path 'backend'
if (-not (Test-Path "$backendDir\node_modules")) {
  Write-Host 'Instalando dependências do backend...'
  Push-Location $backendDir
  npm install
  Pop-Location
}

$logsDir = Join-Path $backendDir 'logs'
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }

$backendOut = Join-Path $logsDir 'server.out.log'
$backendErr = Join-Path $logsDir 'server.err.log'

# Mata processos antigos do node rodando server.js
Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*server.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Start-Process -FilePath 'node' -ArgumentList 'server.js' -WorkingDirectory $backendDir -RedirectStandardOutput $backendOut -RedirectStandardError $backendErr -WindowStyle Minimized

if (-not (Wait-PortListening -p $Port)) {
  Write-Error "Backend não iniciou na porta $Port. Verifique os logs em $backendErr"
  exit 1
}
Write-Host "Backend ativo na porta $Port."

Write-Host "[2/5] Verificando ngrok..."
$ngrok = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrok) {
  Write-Host 'ngrok não encontrado. Tentando instalar via winget...'
  winget install --id Ngrok.Ngrok -e --accept-source-agreements --accept-package-agreements | Out-Null
}

Write-Host '[3/5] Iniciando túnel ngrok (IPv4)...'
# Fecha instâncias antigas
Get-Process -Name ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Process -FilePath 'ngrok' -ArgumentList "http http://127.0.0.1:$Port" -WindowStyle Minimized

# Espera API de inspeção subir
$maxTries = 30
$publicUrl = $null
for ($i=0; $i -lt $maxTries; $i++) {
  try {
    $tunnels = Invoke-RestMethod -UseBasicParsing -Uri 'http://127.0.0.1:4040/api/tunnels'
    $publicUrl = ($tunnels.tunnels | Where-Object { $_.proto -eq 'https' }).public_url
    if ($publicUrl) { break }
  } catch { }
  Start-Sleep -Seconds 1
}
if (-not $publicUrl) {
  Write-Error 'Não foi possível obter a URL pública do ngrok.'
  exit 1
}
Write-Host "ngrok público: $publicUrl"

Write-Host '[4/5] Atualizando frontend .env com VITE_API_URL...'
$frontendDir = Join-Path $PSScriptRoot '..' | Join-Path 'frontend'
$envFile = Join-Path $frontendDir '.env'
if (-not (Test-Path $envFile)) {
  Copy-Item (Join-Path $frontendDir '.env.example') $envFile -ErrorAction SilentlyContinue
}
Set-Content -Path $envFile -Value "VITE_API_URL=$publicUrl"
Write-Host "Atualizado $envFile"

Write-Host '[5/5] Gerando build do frontend...'
Push-Location $frontendDir
npm install | Out-Null
npm run build
Pop-Location

Write-Host "\nTudo pronto!" -ForegroundColor Green
Write-Host "- Backend rodando em http://127.0.0.1:$Port"
Write-Host "- API pública: $publicUrl"
Write-Host "- Pasta de deploy: $frontendDir\dist (faça upload no Netlify)"
