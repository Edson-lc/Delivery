# 🌐 Acesso pela Internet - AmaDelivery

## 📊 Suas Informações de Rede

- **IP Público**: `82.155.88.172`
- **IP Local**: `192.168.1.229`
- **Gateway**: `192.168.1.254`

## 🚀 Soluções Implementadas

### **1. 🔥 Solução Rápida: Ngrok (Para testes)**

**Como usar:**
```powershell
# Execute o script
.\scripts\start-ngrok.ps1
```

**O que acontece:**
- ✅ Cria túneis seguros para frontend e backend
- ✅ Gera URLs públicas automaticamente
- ✅ Funciona imediatamente sem configuração
- ✅ Ideal para testes e demonstrações

**URLs de exemplo:**
- Frontend: `https://abc123.ngrok.io`
- Backend: `https://def456.ngrok.io`

### **2. 🌐 Solução Permanente: DNS Dinâmico**

**Como usar:**
```powershell
# Execute o script
.\scripts\setup-duckdns.ps1
```

**O que acontece:**
- ✅ Configura hostname fixo (ex: `amadelivery.duckdns.org`)
- ✅ Atualiza automaticamente quando IP muda
- ✅ URLs permanentes e profissionais
- ✅ Ideal para uso contínuo

**URLs de exemplo:**
- Frontend: `http://amadelivery.duckdns.org:5173`
- Backend: `http://amadelivery.duckdns.org:4000`

### **3. 🔧 Solução Manual: IP Público**

**Como usar:**
```powershell
# Execute o script
.\scripts\setup-internet-access.ps1
# Escolha opção 1
```

**O que acontece:**
- ✅ Usa IP público diretamente
- ✅ Requer configuração de port forwarding
- ✅ URLs baseadas no IP público
- ✅ Ideal para uso temporário

**URLs de exemplo:**
- Frontend: `http://82.155.88.172:5173`
- Backend: `http://82.155.88.172:4000`

## 🎯 Recomendação para Você

### **Para Testes Rápidos:**
1. **Baixe o Ngrok:** https://ngrok.com/download
2. **Execute:** `.\scripts\start-ngrok.ps1`
3. **Use as URLs geradas**

### **Para Uso Contínuo:**
1. **Configure DuckDNS:** `.\scripts\setup-duckdns.ps1`
2. **Configure port forwarding no roteador**
3. **Configure firewall do Windows**

## 📋 Scripts Disponíveis

| Script | Descrição | Uso |
|--------|-----------|-----|
| `start-ngrok.ps1` | Inicia Ngrok para testes | Testes rápidos |
| `setup-duckdns.ps1` | Configura DNS dinâmico | Uso permanente |
| `setup-internet-access.ps1` | Menu completo | Todas as opções |
| `update-duckdns.ps1` | Atualiza DNS automaticamente | Manutenção |

## 🔧 Configuração do Roteador

### **Port Forwarding Necessário:**
- **Porta 5173** → `192.168.1.229:5173` (Frontend)
- **Porta 4000** → `192.168.1.229:4000` (Backend)

### **Como Configurar:**
1. Acesse o roteador: `http://192.168.1.254`
2. Vá em "Port Forwarding" ou "Redirecionamento de Porta"
3. Adicione as regras acima
4. Salve as configurações

## 🔒 Configuração do Firewall

### **Comandos PowerShell (Execute como Administrador):**
```powershell
netsh advfirewall firewall add rule name="AmaDelivery Frontend Internet" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="AmaDelivery Backend Internet" dir=in action=allow protocol=TCP localport=4000
```

## 📱 Teste de Acesso

### **Teste Local:**
- `http://localhost:5173`

### **Teste de Rede:**
- `http://192.168.1.229:5173`

### **Teste pela Internet:**
- URLs do Ngrok (após executar script)
- URLs do DNS dinâmico (após configurar)
- URLs do IP público (após configurar port forwarding)

## 🎉 Próximos Passos

### **1. Teste com Ngrok (Hoje):**
```powershell
.\scripts\start-ngrok.ps1
```

### **2. Configure DNS Dinâmico (Esta semana):**
```powershell
.\scripts\setup-duckdns.ps1
```

### **3. Configure Port Forwarding (Esta semana):**
- Acesse o roteador
- Configure port forwarding
- Teste o acesso

### **4. Configure SSL/HTTPS (Futuro):**
- Para produção
- Certificados SSL
- Segurança avançada

## 🔍 Troubleshooting

### **❌ "Não consegue acessar pela internet"**
- ✅ Verifique port forwarding no roteador
- ✅ Verifique firewall do Windows
- ✅ Teste com Ngrok primeiro

### **❌ "CORS Error"**
- ✅ Atualize CORS_ORIGIN no backend
- ✅ Inclua URLs externas

### **❌ "IP mudou"**
- ✅ Use DNS dinâmico
- ✅ Configure atualização automática

## 🎯 Resumo Final

**Agora você tem 3 soluções completas para acesso pela internet:**

1. **🔥 Ngrok** - Solução rápida para testes
2. **🌐 DNS Dinâmico** - Solução permanente e profissional
3. **🔧 IP Público** - Solução manual e direta

**Escolha a que melhor se adapta ao seu caso de uso!** 🚀

---

*Documentação criada em 27 de Janeiro de 2025*
*Sistema: AmaDeliveryNew v1.0*
