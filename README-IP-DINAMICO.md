# 🌐 Soluções para IP Dinâmico - AmaDelivery

## 🎯 Problema

Você tem uma configuração para rodar em rede local e pela internet, mas o IP dinâmico está causando problemas:

- ✅ Configuração de rede local funcionando
- ❌ IP muda constantemente (DHCP dinâmico)
- ❌ Precisa atualizar `.env.local` manualmente
- ❌ URLs ficam quebradas quando IP muda

## 🚀 Soluções Rápidas

### **1. Solução Imediata**
```bash
# Execute sempre que o IP mudar
.\scripts\auto-detect-ip.ps1
```

### **2. Solução Automática**
```bash
# Inicie o monitor em background
.\scripts\ip-monitor.ps1 -Background
```

### **3. Solução Definitiva**
```bash
# Configure IP fixo (recomendado)
.\scripts\setup-fixed-ip.ps1
```

### **4. Solução Completa**
```bash
# Use o script principal com menu interativo
.\scripts\solve-ip-issues.ps1
```

## 📋 Scripts Disponíveis

| Script | Descrição | Uso |
|--------|-----------|-----|
| `auto-detect-ip.ps1` | Detecta IP e atualiza configurações | Sempre que IP mudar |
| `ip-monitor.ps1` | Monitora mudanças automaticamente | Background contínuo |
| `setup-fixed-ip.ps1` | Configura IP fixo no Windows | Uma vez (requer admin) |
| `setup-dynamic-dns.ps1` | Configura DNS dinâmico | Acesso externo |
| `solve-ip-issues.ps1` | Menu principal com todas as soluções | Solução completa |

## 🔧 Como Usar

### **Opção 1: Detecção Manual**
1. Execute `.\scripts\auto-detect-ip.ps1`
2. Script detecta IP atual
3. Atualiza configurações automaticamente
4. Mostra URLs de acesso

### **Opção 2: Monitor Automático**
1. Execute `.\scripts\ip-monitor.ps1 -Background`
2. Script roda em background
3. Monitora mudanças de IP
4. Atualiza configurações automaticamente

### **Opção 3: IP Fixo**
1. Execute `.\scripts\setup-fixed-ip.ps1` como Administrador
2. Script configura IP fixo
3. Remove configuração DHCP
4. Atualiza configurações do projeto

### **Opção 4: DNS Dinâmico**
1. Execute `.\scripts\setup-dynamic-dns.ps1` como Administrador
2. Escolha provedor DNS (No-IP, DuckDNS, etc.)
3. Configure hostname
4. Configure port forwarding

## 🌐 URLs de Acesso

Após executar qualquer solução:

- **Frontend**: `http://SEU_IP:5173`
- **Backend**: `http://SEU_IP:4000`
- **Local**: `http://localhost:5173`

## 🔍 Verificação

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

## 🛠️ Troubleshooting

### **❌ "Não é possível detectar IP"**
- ✅ Execute como Administrador
- ✅ Verifique conexão de rede
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

## 📊 Monitoramento

### **Status dos Serviços**
```bash
# Verificar processos
Get-Process -Name "node"

# Verificar portas
netstat -an | findstr :5173
netstat -an | findstr :4000
```

### **Logs do Sistema**
```bash
# Ver logs do backend
tail -f server/logs/app.log

# Ver logs do frontend
# Verifique o console do navegador
```

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

## 🔒 Segurança

### **Rede Local**
- ✅ Configure firewall adequadamente
- ✅ Use apenas em redes confiáveis
- ✅ Não exponha para internet

### **Acesso Externo**
- ✅ Use HTTPS obrigatório
- ✅ Configure autenticação robusta
- ✅ Monitore acessos

## 📞 Suporte

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

### **Problemas Comuns**
1. **IP não detectado**: Execute como Administrador
2. **Serviços não iniciam**: Verifique portas e dependências
3. **CORS errors**: Verifique configurações do backend
4. **Conectividade falha**: Verifique firewall e rede

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
