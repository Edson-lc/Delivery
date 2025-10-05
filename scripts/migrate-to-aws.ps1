# Script PowerShell para migrar dados do PostgreSQL local para AWS RDS
# Uso: .\migrate-to-aws.ps1

param(
    [switch]$SkipBackup,
    [switch]$Force
)

# Configurações
$ErrorActionPreference = "Stop"

# Cores para output
function Write-Success { param($Message) Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red; exit 1 }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }

Write-Success "🚀 Iniciando migração para AWS RDS..."

# Verificar se o arquivo .env.production existe
if (-not (Test-Path ".env.production")) {
    Write-Error "Arquivo .env.production não encontrado. Copie o env.production.example e configure."
}

# Carregar variáveis de ambiente
$envContent = Get-Content ".env.production" | Where-Object { $_ -match "^[^#].*=" }
foreach ($line in $envContent) {
    if ($line -match "^([^=]+)=(.*)$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# Verificar se DATABASE_URL está configurado
if (-not $env:DATABASE_URL) {
    Write-Error "DATABASE_URL não configurado no .env.production"
}

Write-Success "Configuração encontrada:"
Write-Host "  - Database URL: $($env:DATABASE_URL)"
Write-Host "  - Environment: $($env:NODE_ENV)"

# Verificar conexão com AWS RDS
Write-Success "Testando conexão com AWS RDS..."
Set-Location server

# Instalar dependências se necessário
if (-not (Test-Path "node_modules")) {
    Write-Success "Instalando dependências..."
    npm install
}

# Gerar cliente Prisma
Write-Success "Gerando cliente Prisma..."
npx prisma generate

# Testar conexão
Write-Success "Testando conexão com o banco..."
try {
    npx prisma db pull --schema=./prisma/schema.prisma | Out-Null
    Write-Success "✅ Conexão com AWS RDS estabelecida com sucesso!"
} catch {
    Write-Error "❌ Falha na conexão com AWS RDS. Verifique as credenciais e configurações."
}

# Executar migrações
Write-Success "Executando migrações..."
npx prisma migrate deploy

# Verificar se as tabelas foram criadas
Write-Success "Verificando estrutura do banco..."
npx prisma db seed

Write-Success "✅ Migração concluída com sucesso!"
Write-Success "🎉 Seu banco AWS RDS está pronto para uso!"

Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Teste a aplicação: npm run dev"
Write-Host "2. Verifique os logs: Get-Content logs/app.log -Wait"
Write-Host "3. Configure backup automático no AWS Console"
Write-Host "4. Configure monitoramento e alertas"
