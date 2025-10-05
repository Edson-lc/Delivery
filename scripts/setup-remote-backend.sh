#!/bin/bash

# Script para configurar e executar backend remoto
# Use este script no servidor onde o backend está rodando

set -e

echo "🚀 Configurando Backend Remoto para Frontend Local..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto"
fi

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    warning "Arquivo .env não encontrado. Copiando exemplo..."
    cp env.backend-remote.example .env
    warning "Configure o arquivo .env com suas credenciais antes de continuar"
    exit 1
fi

# Instalar dependências
log "Instalando dependências..."
npm install

# Gerar cliente Prisma
log "Gerando cliente Prisma..."
cd server
npm install
npx prisma generate

# Testar conexão com banco
log "Testando conexão com AWS RDS..."
if node test-connection.js; then
    log "✅ Conexão com banco estabelecida"
else
    error "❌ Falha na conexão com banco"
fi

# Voltar ao diretório raiz
cd ..

# Build da aplicação
log "Fazendo build da aplicação..."
npm run build

# Verificar se o build foi bem-sucedido
if [ -d "dist" ]; then
    log "✅ Build concluído com sucesso"
else
    error "❌ Falha no build"
fi

# Configurar PM2 (se disponível)
if command -v pm2 &> /dev/null; then
    log "Configurando PM2..."
    pm2 delete amadelivery-backend 2>/dev/null || true
    pm2 start dist/server.js --name amadelivery-backend
    pm2 save
    log "✅ Backend iniciado com PM2"
else
    warning "PM2 não encontrado. Iniciando com Node.js..."
    log "Para parar o servidor, use Ctrl+C"
    node dist/server.js
fi

log "🎉 Backend remoto configurado e rodando!"
log "📡 API disponível em: http://localhost:4000"
log "🔍 Health check: http://localhost:4000/health"
log "📊 Logs: tail -f logs/app.log"
