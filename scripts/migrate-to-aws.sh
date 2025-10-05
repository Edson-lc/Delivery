#!/bin/bash

# Script para migrar dados do PostgreSQL local para AWS RDS
# Uso: ./migrate-to-aws.sh

set -e

echo "🚀 Iniciando migração para AWS RDS..."

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

# Verificar se o arquivo .env.production existe
if [ ! -f ".env.production" ]; then
    error "Arquivo .env.production não encontrado. Copie o env.production.example e configure."
fi

# Carregar variáveis de ambiente
source .env.production

# Verificar se DATABASE_URL está configurado
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL não configurado no .env.production"
fi

log "Configuração encontrada:"
echo "  - Database URL: ${DATABASE_URL}"
echo "  - Environment: ${NODE_ENV}"

# Verificar conexão com AWS RDS
log "Testando conexão com AWS RDS..."
cd server

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    log "Instalando dependências..."
    npm install
fi

# Gerar cliente Prisma
log "Gerando cliente Prisma..."
npx prisma generate

# Testar conexão
log "Testando conexão com o banco..."
if npx prisma db pull --schema=./prisma/schema.prisma > /dev/null 2>&1; then
    log "✅ Conexão com AWS RDS estabelecida com sucesso!"
else
    error "❌ Falha na conexão com AWS RDS. Verifique as credenciais e configurações."
fi

# Executar migrações
log "Executando migrações..."
npx prisma migrate deploy

# Verificar se as tabelas foram criadas
log "Verificando estrutura do banco..."
npx prisma db seed

log "✅ Migração concluída com sucesso!"
log "🎉 Seu banco AWS RDS está pronto para uso!"

echo ""
echo "📋 Próximos passos:"
echo "1. Teste a aplicação: npm run dev"
echo "2. Verifique os logs: tail -f logs/app.log"
echo "3. Configure backup automático no AWS Console"
echo "4. Configure monitoramento e alertas"
