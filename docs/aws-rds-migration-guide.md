# Configuração de Migrações para Produção - AWS RDS

## 📋 Checklist de Migração

### ✅ Pré-requisitos
- [ ] Instância AWS RDS PostgreSQL criada
- [ ] Grupo de segurança configurado
- [ ] Arquivo `.env.production` configurado
- [ ] Backup do banco local realizado

### 🚀 Passos da Migração

#### 1. **Preparar Ambiente**
```bash
# Copiar arquivo de exemplo
cp env.production.example .env.production

# Editar configurações
nano .env.production
```

#### 2. **Configurar Variáveis de Ambiente**
```env
# Database - AWS RDS PostgreSQL
DATABASE_URL="postgresql://username:password@endpoint.region.rds.amazonaws.com:5432/database"

# JWT Configuration
JWT_SECRET="sua-chave-jwt-super-secreta-minimo-64-caracteres"

# Server Configuration
NODE_ENV="production"
PORT=4000

# CORS Configuration
CORS_ORIGIN="https://seudominio.com"
```

#### 3. **Executar Migração**
```bash
# Usar script automatizado
./scripts/migrate-to-aws.sh

# Ou manualmente:
cd server
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

#### 4. **Verificar Migração**
```bash
# Testar conexão
npx prisma db pull

# Verificar tabelas
npx prisma studio
```

### 🔧 Configurações AWS RDS Recomendadas

#### **Instância de Desenvolvimento**
- **Classe**: db.t3.micro
- **Storage**: 20 GB gp2
- **Backup**: 7 dias
- **Multi-AZ**: Não

#### **Instância de Produção**
- **Classe**: db.t3.small ou maior
- **Storage**: 100+ GB gp3
- **Backup**: 30 dias
- **Multi-AZ**: Sim
- **Encryption**: Sim

### 📊 Monitoramento

#### **Métricas Importantes**
- CPU Utilization
- Database Connections
- Free Storage Space
- Read/Write IOPS
- Replica Lag (se Multi-AZ)

#### **Alertas Recomendados**
- CPU > 80%
- Connections > 80% do limite
- Free Storage < 20%
- Replica Lag > 5 segundos

### 🔒 Segurança

#### **Configurações de Segurança**
- [ ] VPC configurada
- [ ] Security Groups restritivos
- [ ] Encryption at rest habilitada
- [ ] Encryption in transit habilitada
- [ ] Backup encryption habilitada
- [ ] Deletion protection habilitada

#### **Acesso ao Banco**
- [ ] Usuário master com senha forte
- [ ] Usuários específicos para aplicação
- [ ] Rotação de senhas configurada
- [ ] Acesso apenas de IPs autorizados

### 🚨 Troubleshooting

#### **Problemas Comuns**

1. **Erro de Conexão**
   ```bash
   # Verificar security groups
   # Verificar VPC/subnet
   # Verificar credenciais
   ```

2. **Timeout de Conexão**
   ```bash
   # Aumentar timeout no Prisma
   # Verificar network latency
   # Verificar instância RDS
   ```

3. **Erro de Migração**
   ```bash
   # Verificar permissões do usuário
   # Verificar schema existente
   # Executar migrações uma por vez
   ```

### 📈 Otimizações

#### **Performance**
- [ ] Connection pooling configurado
- [ ] Índices otimizados
- [ ] Query performance monitorada
- [ ] Slow query log habilitado

#### **Custos**
- [ ] Instância adequada ao uso
- [ ] Storage otimizado
- [ ] Backup retention adequado
- [ ] Reserved instances (se aplicável)

### 🔄 Backup e Recovery

#### **Estratégia de Backup**
- [ ] Backup automático diário
- [ ] Backup manual antes de mudanças
- [ ] Teste de restore regular
- [ ] Backup cross-region (se necessário)

#### **Recovery Time Objective (RTO)**
- **Desenvolvimento**: 4 horas
- **Produção**: 1 hora

#### **Recovery Point Objective (RPO)**
- **Desenvolvimento**: 24 horas
- **Produção**: 15 minutos
