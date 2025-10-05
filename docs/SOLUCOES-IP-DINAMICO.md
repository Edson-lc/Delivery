# 🌐 Soluções para IP Dinâmico - AmaDelivery

## 🎯 Problema Identificado

Você tem uma configuração para rodar em rede local e pela internet, mas o IP dinâmico está causando problemas:

- ✅ Configuração de rede local funcionando
- ❌ IP muda constantemente (DHCP dinâmico)
- ❌ Precisa atualizar `.env.local` manualmente
- ❌ URLs ficam quebradas quando IP muda

## 💡 Soluções Implementadas

### 🚀 **Solução 1: Detecção Automática de IP**

**Script:** `scripts/auto-detect-ip.ps1` (Windows) / `scripts/auto-detect-ip.sh` (Linux/Mac)

**Como usar:**
```bash
# Windows PowerShell
.\scripts\auto-detect-ip.ps1

# Linux/Mac
./scripts/auto-detect-ip.sh
```

**O que faz:**
- ✅ Detecta automaticamente o IP atual
- ✅ Atualiza `.env.local` com o novo IP
- ✅ Atualiza configurações do backend
- ✅ Mostra URLs de acesso atualizadas

---

### 🔄 **Solução 2: Monitor Automático de IP**

**Script:** `scripts/ip-monitor.ps1`

**Como usar:**
```bash
# Executar em foreground
.\scripts\ip-monitor.ps1

# Executar em background
.\scripts\ip-monitor.ps1 -Background
```

**O que faz:**
- ✅ Monitora mudanças de IP automaticamente
- ✅ Atualiza configurações quando IP muda
- ✅ Roda em background (opcional)
- ✅ Verifica a cada 30 segundos

---

### 🔧 **Solução 3: IP Fixo**

**Script:** `scripts/setup-fixed-ip.ps1`

**Como usar:**
```bash
# Execute como Administrador
.\scripts\setup-fixed-ip.ps1
```

**O que faz:**
- ✅ Configura IP fixo no Windows
- ✅ Remove configuração DHCP
- ✅ Atualiza configurações do projeto
- ✅ Evita mudanças de IP

**Requisitos:**
- ⚠️ Precisa executar como Administrador
- ⚠️ Requer reinicialização do computador

---

### 🌐 **Solução 4: DNS Dinâmico**

**Script:** `scripts/setup-dynamic-dns.ps1`

**Como usar:**
```bash
# Execute como Administrador
.\scripts\setup-dynamic-dns.ps1
```

**O que faz:**
- ✅ Configura DNS dinâmico para acesso externo
- ✅ Suporte a No-IP, DuckDNS, Dynu, Cloudflare
- ✅ Configura port forwarding
- ✅ Cria script de atualização automática

**Requisitos:**
- ⚠️ Precisa executar como Administrador
- ⚠️ Requer configuração no roteador

---

### 🎯 **Solução 5: Script Principal**

**Script:** `scripts/solve-ip-issues.ps1`

**Como usar:**
```bash
.\scripts\solve-ip-issues.ps1
```

**O que faz:**
- ✅ Menu interativo com todas as soluções
- ✅ Detecção automática de problemas
- ✅ Testes de conectividade
- ✅ Informações detalhadas da rede

---

## 🚀 Como Usar

### **Opção 1: Solução Rápida**
```bash
# Execute sempre que o IP mudar
.\scripts\auto-detect-ip.ps1
```

### **Opção 2: Solução Automática**
```bash
# Inicie o monitor em background
.\scripts\ip-monitor.ps1 -Background
```

### **Opção 3: Solução Definitiva**
```bash
# Configure IP fixo (recomendado)
.\scripts\setup-fixed-ip.ps1
```

### **Opção 4: Solução Completa**
```bash
# Use o script principal
.\scripts\solve-ip-issues.ps1
```

---

## 📋 Configurações Atualizadas

### **Frontend (.env.local)**
```env
# Configuração automática para rede local
VITE_API_URL=http://SEU_IP:4000/api

# URLs de acesso
# Frontend: http://SEU_IP:5173
# Backend:  http://SEU_IP:4000
# Local:    http://localhost:5173
```

### **Backend (server/.env)**
```env
# CORS - Permitir acesso da rede local
CORS_ORIGIN=http://SEU_IP:5173,http://localhost:5173
```

---

## 🔍 Verificação de Status

### **Teste Local**
```bash
# Acesse no mesmo computador
http://localhost:5173
```

### **Teste de Rede**
```bash
# Acesse de outro dispositivo
http://SEU_IP:5173
```

### **Teste de API**
```bash
# Teste direto da API
curl http://SEU_IP:4000/api/public/restaurants
```

---

## 🛠️ Troubleshooting

### **❌ "Não é possível detectar IP"**
- ✅ Verifique se está conectado à rede
- ✅ Execute como Administrador
- ✅ Verifique firewall/antivírus

### **❌ "Backend não está rodando"**
- ✅ Execute: `cd server && npm run dev`
- ✅ Verifique se a porta 4000 está livre
- ✅ Verifique logs de erro

### **❌ "Frontend não está rodando"**
- ✅ Execute: `npm run dev:network`
- ✅ Verifique se a porta 5173 está livre
- ✅ Verifique se o Vite está configurado

### **❌ "CORS Error"**
- ✅ Verifique se o backend está rodando
- ✅ Confirme se a URL da API está correta
- ✅ Verifique configuração CORS_ORIGIN

---

## 📊 Monitoramento

### **Logs do Sistema**
```bash
# Ver logs do backend
tail -f server/logs/app.log

# Ver logs do frontend
# Verifique o console do navegador
```

### **Status dos Serviços**
```bash
# Verificar processos
Get-Process -Name "node"

# Verificar portas
netstat -an | findstr :5173
netstat -an | findstr :4000
```

---

## 🎯 Recomendações

### **Para Desenvolvimento**
1. ✅ Use **IP fixo** (Solução 3)
2. ✅ Configure no roteador
3. ✅ Teste regularmente

### **Para Produção**
1. ✅ Use **DNS dinâmico** (Solução 4)
2. ✅ Configure SSL/HTTPS
3. ✅ Configure backup automático

### **Para Testes**
1. ✅ Use **detecção automática** (Solução 1)
2. ✅ Execute sempre que necessário
3. ✅ Monitore conectividade

---

## 🔒 Segurança

### **Rede Local**
- ✅ Configure firewall adequadamente
- ✅ Use apenas em redes confiáveis
- ✅ Não exponha para internet

### **Acesso Externo**
- ✅ Use HTTPS obrigatório
- ✅ Configure autenticação robusta
- ✅ Monitore acessos

---

## 📞 Suporte

### **Problemas Comuns**
1. **IP não detectado**: Execute como Administrador
2. **Serviços não iniciam**: Verifique portas e dependências
3. **CORS errors**: Verifique configurações do backend
4. **Conectividade falha**: Verifique firewall e rede

### **Comandos de Debug**
```bash
# Verificar IP atual
ipconfig

# Testar conectividade
ping 8.8.8.8

# Verificar portas
netstat -an | findstr :5173
netstat -an | findstr :4000
```

---

## 🎉 Conclusão

Com essas soluções, você pode:

- ✅ **Resolver problemas de IP dinâmico** automaticamente
- ✅ **Manter configurações atualizadas** sem intervenção manual
- ✅ **Configurar IP fixo** para evitar mudanças
- ✅ **Configurar DNS dinâmico** para acesso externo
- ✅ **Monitorar conectividade** em tempo real

**Escolha a solução que melhor se adapta ao seu caso de uso!** 🚀

---

*Documentação criada em 27 de Janeiro de 2025*
*Sistema: AmaDeliveryNew v1.0*
