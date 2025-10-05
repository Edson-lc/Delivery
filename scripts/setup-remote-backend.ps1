# Script PowerShell para configurar e executar backend remoto
# Use este script no servidor Windows onde o backend está rodando

param(
    [switch]$SkipBuild,
    [switch]$SkipTest
)

$ErrorActionPreference = "Stop"

# Cores para output
function Write-Success { param($Message) Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red; exit 1 }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }

Write-Success "🚀 Configurando Backend Remoto para Frontend Local..."

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Error "Execute este script no diretório raiz do projeto"
}

# Verificar se o arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Warning "Arquivo .env não encontrado. Copiando exemplo..."
    Copy-Item "env.backend-remote.example" ".env"
    Write-Warning "Configure o arquivo .env com suas credenciais antes de continuar"
    exit 1
}

# Instalar dependências
Write-Success "Instalando dependências..."
npm install

# Gerar cliente Prisma
Write-Success "Gerando cliente Prisma..."
Set-Location server
npm install
npx prisma generate

# Testar conexão com banco
if (-not $SkipTest) {
    Write-Success "Testando conexão com AWS RDS..."
    if (node test-connection.js) {
        Write-Success "✅ Conexão com banco estabelecida"
    } else {
        Write-Error "❌ Falha na conexão com banco"
    }
}

# Voltar ao diretório raiz
Set-Location ..

# Build da aplicação
if (-not $SkipBuild) {
    Write-Success "Fazendo build da aplicação..."
    npm run build

    # Verificar se o build foi bem-sucedido
    if (Test-Path "dist") {
        Write-Success "✅ Build concluído com sucesso"
    } else {
        Write-Error "❌ Falha no build"
    }
}

# Verificar se PM2 está disponível
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    Write-Success "Configurando PM2..."
    pm2 delete amadelivery-backend 2>$null
    pm2 start dist/server.js --name amadelivery-backend
    pm2 save
    Write-Success "✅ Backend iniciado com PM2"
} else {
    Write-Warning "PM2 não encontrado. Iniciando com Node.js..."
    Write-Success "Para parar o servidor, use Ctrl+C"
    node dist/server.js
}

Write-Success "🎉 Backend remoto configurado e rodando!"
Write-Success "📡 API disponível em: http://localhost:4000"
Write-Success "🔍 Health check: http://localhost:4000/health"
Write-Success "📊 Logs: Get-Content logs/app.log -Wait"
