# Configuração para Frontend Local + Backend Remoto AWS

## 🎯 Cenário
- **Frontend**: Rodando localmente (localhost:5173)
- **Backend**: Rodando em servidor remoto com AWS RDS
- **Banco**: AWS RDS PostgreSQL

## 🔧 Configuração

### 1. Variáveis de Ambiente do Frontend

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Frontend Local - Backend Remoto
VITE_API_URL="https://seu-servidor.com/api"

# Para desenvolvimento local do backend (opcional)
# VITE_API_URL="http://localhost:4000/api"
```

### 2. Configuração do Backend Remoto

No servidor onde o backend está rodando, configure:

```env
# Backend Remoto
NODE_ENV="production"
PORT=4000

# Database - AWS RDS
DATABASE_URL="postgresql://amadelivery:amadelivery@amadelivery.cro6yo4wqcvr.eu-south-2.rds.amazonaws.com:5432/amadelivery"

# JWT
JWT_SECRET="amadelivery-super-secret-jwt-key-for-production-minimum-64-characters-long-for-security-purposes"
JWT_EXPIRES_IN="1h"

# CORS - Permitir frontend local
CORS_ORIGIN="http://localhost:5173,http://localhost:5174,https://seu-dominio.com"

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Configuração do Servidor Web (Nginx)

Se usando Nginx no servidor remoto:

```nginx
server {
    listen 80;
    server_name seu-servidor.com;

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:4000;
    }
}
```

## 🚀 Como Executar

### Frontend Local
```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
# Acesse: http://localhost:5173
```

### Backend Remoto
```bash
# No servidor remoto
cd server
npm install
npm run build
npm start
```

## 🔒 Configurações de Segurança

### 1. CORS
- Permitir apenas domínios específicos
- Não usar `*` em produção
- Incluir localhost apenas para desenvolvimento

### 2. Rate Limiting
- Configurar limites adequados
- Monitorar uso da API

### 3. SSL/HTTPS
- Usar HTTPS em produção
- Configurar certificados SSL

## 📊 Monitoramento

### 1. Logs
```bash
# Ver logs do backend
tail -f logs/app.log

# Ver logs do Nginx
tail -f /var/log/nginx/access.log
```

### 2. Health Check
```bash
# Testar API
curl https://seu-servidor.com/health

# Testar endpoint específico
curl https://seu-servidor.com/api/public/restaurants
```

## 🧪 Testes

### 1. Testar Frontend Local
```bash
# Executar frontend
npm run dev

# Acessar no navegador
# http://localhost:5173
```

### 2. Testar API Remota
```bash
# Testar conexão
curl https://seu-servidor.com/api/public/restaurants

# Testar autenticação
curl -X POST https://seu-servidor.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@amaeats.com","password":"admin123"}'
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **CORS Error**
   - Verificar configuração CORS_ORIGIN
   - Incluir localhost:5173

2. **Connection Refused**
   - Verificar se backend está rodando
   - Verificar firewall/portas

3. **Database Connection**
   - Verificar DATABASE_URL
   - Testar conexão com AWS RDS

### Comandos de Debug

```bash
# Verificar status do backend
curl https://seu-servidor.com/health

# Verificar logs
tail -f logs/app.log

# Testar banco
node test-connection.js
```

## 📈 Próximos Passos

1. **Configurar domínio** personalizado
2. **Configurar SSL** com Let's Encrypt
3. **Configurar backup** automático
4. **Configurar monitoramento** com alertas
5. **Otimizar performance** com cache
