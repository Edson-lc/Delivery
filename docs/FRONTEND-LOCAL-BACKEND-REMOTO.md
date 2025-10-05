# 🚀 Guia Completo: Frontend Local + Backend Remoto AWS

## 📋 Visão Geral

Este guia configura o AmaDelivery para rodar com:
- **Frontend**: Localmente (localhost:5173)
- **Backend**: Em servidor remoto com AWS RDS
- **Banco**: AWS RDS PostgreSQL

## 🎯 Cenário de Uso

Ideal para:
- ✅ Desenvolvimento local do frontend
- ✅ Backend em servidor dedicado
- ✅ Banco de dados na nuvem (AWS RDS)
- ✅ Testes de integração
- ✅ Deploy gradual

## 🔧 Configuração Passo a Passo

### **1. Configurar Backend Remoto**

#### **1.1 No Servidor Remoto**

```bash
# Copiar arquivo de configuração
cp env.backend-remote.example .env

# Editar configurações
nano .env
```

**Configuração do `.env` no servidor:**
```env
# Ambiente
NODE_ENV="production"
PORT=4000

# Database - AWS RDS
DATABASE_URL="postgresql://amadelivery:amadelivery@amadelivery.cro6yo4wqcvr.eu-south-2.rds.amazonaws.com:5432/amadelivery"

# JWT
JWT_SECRET="amadelivery-super-secret-jwt-key-for-production-minimum-64-characters-long-for-security-purposes"
JWT_EXPIRES_IN="1h"

# CORS - Permitir frontend local
CORS_ORIGIN="http://localhost:5173,http://localhost:5174,http://localhost:3000,https://seu-dominio.com"

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### **1.2 Executar Backend**

```bash
# Usar script automatizado
./scripts/setup-remote-backend.sh

# Ou manualmente
npm install
cd server && npm install && npx prisma generate
npm run build
npm start
```

### **2. Configurar Frontend Local**

#### **2.1 Variáveis de Ambiente**

```bash
# Copiar arquivo de exemplo
cp env.local.example .env.local

# Editar configurações
nano .env.local
```

**Configuração do `.env.local`:**
```env
# URL da API - Backend Remoto
VITE_API_URL="http://seu-servidor.com:4000/api"

# Para desenvolvimento local do backend (comentado)
# VITE_API_URL="http://localhost:4000/api"
```

#### **2.2 Executar Frontend**

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Acessar: http://localhost:5173
```

### **3. Configurar Proxy/Nginx (Opcional)**

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

## 🧪 Testes de Integração

### **1. Teste Automatizado**

```bash
# Testar integração completa
node scripts/test-local-remote-integration.js

# Com URLs específicas
BACKEND_URL="http://seu-servidor.com:4000" FRONTEND_URL="http://localhost:5173" node scripts/test-local-remote-integration.js
```

### **2. Testes Manuais**

#### **2.1 Testar Backend**

```bash
# Health check
curl http://seu-servidor.com:4000/health

# API de restaurantes
curl http://seu-servidor.com:4000/api/public/restaurants

# Testar CORS
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://seu-servidor.com:4000/api/public/restaurants
```

#### **2.2 Testar Frontend**

```bash
# Executar frontend
npm run dev

# Acessar no navegador
# http://localhost:5173

# Verificar console do navegador para erros
# Testar funcionalidades: login, restaurantes, etc.
```

## 🔒 Configurações de Segurança

### **1. CORS**

- ✅ Permitir apenas domínios específicos
- ✅ Incluir localhost para desenvolvimento
- ✅ Não usar `*` em produção

### **2. Rate Limiting**

- ✅ Configurar limites adequados
- ✅ Monitorar uso da API

### **3. SSL/HTTPS**

- ✅ Usar HTTPS em produção
- ✅ Configurar certificados SSL

## 📊 Monitoramento

### **1. Logs do Backend**

```bash
# Ver logs em tempo real
tail -f logs/app.log

# Ver logs do PM2
pm2 logs amadelivery-backend

# Ver logs do Nginx
tail -f /var/log/nginx/access.log
```

### **2. Health Checks**

```bash
# Verificar status do backend
curl http://seu-servidor.com:4000/health

# Verificar métricas
curl http://seu-servidor.com:4000/api/health/detailed
```

### **3. Monitoramento AWS RDS**

- CPU Utilization
- Database Connections
- Free Storage Space
- Read/Write IOPS

## 🚨 Troubleshooting

### **Problemas Comuns**

#### **1. CORS Error**

```
Access to fetch at 'http://seu-servidor.com:4000/api/restaurants' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solução:**
```env
# No .env do backend
CORS_ORIGIN="http://localhost:5173,http://localhost:5174"
```

#### **2. Connection Refused**

```
Failed to fetch
```

**Soluções:**
- Verificar se backend está rodando
- Verificar firewall/portas
- Verificar URL da API

#### **3. Database Connection**

```
Database connection failed
```

**Soluções:**
- Verificar DATABASE_URL
- Testar conexão com AWS RDS
- Verificar security groups

### **Comandos de Debug**

```bash
# Verificar status do backend
curl http://seu-servidor.com:4000/health

# Verificar logs
tail -f logs/app.log

# Testar banco
cd server && node test-connection.js

# Verificar processos
pm2 list
ps aux | grep node
```

## 🚀 Deploy e Produção

### **1. Configurar Domínio**

```env
# Frontend
VITE_API_URL="https://api.seudominio.com"

# Backend
CORS_ORIGIN="https://seudominio.com,https://www.seudominio.com"
```

### **2. Configurar SSL**

```bash
# Usando Let's Encrypt
certbot --nginx -d api.seudominio.com
```

### **3. Configurar Backup**

```bash
# Backup automático do banco
aws rds create-db-snapshot \
  --db-instance-identifier amadelivery-prod \
  --db-snapshot-identifier amadelivery-backup-$(date +%Y%m%d)
```

## 📈 Próximos Passos

1. **Configurar domínio** personalizado
2. **Configurar SSL** com Let's Encrypt
3. **Configurar backup** automático
4. **Configurar monitoramento** com alertas
5. **Otimizar performance** com cache
6. **Implementar CI/CD** para deploy automático

## 🎉 Conclusão

Com esta configuração, você tem:

- ✅ **Frontend local** para desenvolvimento rápido
- ✅ **Backend remoto** com AWS RDS
- ✅ **CORS configurado** corretamente
- ✅ **Testes automatizados** de integração
- ✅ **Monitoramento** e logs
- ✅ **Preparado para produção**

**Sua aplicação está pronta para desenvolvimento e produção!** 🚀
