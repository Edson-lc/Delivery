# 🌐 Acesso em Rede Local - AmaDelivery

Este guia explica como configurar o AmaDelivery para ser acessível por outros dispositivos na sua rede local.

## 🎯 **Objetivo**

Permitir que outros dispositivos (celulares, tablets, outros computadores) na mesma rede Wi-Fi acessem o sistema AmaDelivery rodando no seu computador.

## 📋 **Pré-requisitos**

- ✅ Todos os dispositivos devem estar na **mesma rede Wi-Fi**
- ✅ Firewall do Windows configurado para permitir conexões
- ✅ Backend e frontend configurados corretamente

## 🚀 **Configuração Automática (Recomendado)**

### **Windows (PowerShell)**
```powershell
# Execute na raiz do projeto
.\scripts\start-network.ps1
```

### **Linux/Mac (Bash)**
```bash
# Execute na raiz do projeto
./scripts/start-network.sh
```

## 🔧 **Configuração Manual**

### **1. Configurar Frontend (Vite)**

O arquivo `vite.config.js` já foi configurado para aceitar conexões de rede:

```javascript
server: {
  host: '0.0.0.0', // Permite acesso de qualquer IP na rede
  port: 5173, // Porta padrão do Vite
  allowedHosts: true,
}
```

### **2. Configurar Backend (Express)**

O arquivo `server/src/server.ts` já foi configurado:

```typescript
app.listen(port, '0.0.0.0', () => {
  console.log(`AmaEats API running on http://localhost:${port}`);
  console.log(`AmaEats API accessible on network at http://192.168.1.229:${port}`);
});
```

### **3. Configurar Variáveis de Ambiente**

Crie o arquivo `.env.local` na raiz do projeto:

```env
# Substitua 192.168.1.229 pelo IP da sua máquina
VITE_API_URL=http://192.168.1.229:4000/api
```

## 🌐 **Como Descobrir seu IP**

### **Windows**
```cmd
ipconfig
```
Procure por "Adaptador Ethernet" ou "Wi-Fi" e anote o "Endereço IPv4"

### **Linux/Mac**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## 🚀 **Como Iniciar**

### **1. Iniciar Backend**
```bash
cd server
npm run dev
```

### **2. Iniciar Frontend**
```bash
# Na raiz do projeto
npm run dev:network
```

## 📱 **Acessar de Outros Dispositivos**

### **URLs de Acesso:**
- **Frontend:** `http://SEU_IP:5173`
- **Backend:** `http://SEU_IP:4000`

### **Exemplo:**
Se seu IP for `192.168.1.229`:
- Frontend: `http://192.168.1.229:5173`
- Backend: `http://192.168.1.229:4000`

## 🔥 **Configurar Firewall (Windows)**

### **1. Abrir Portas no Firewall**
```cmd
# Execute como Administrador
netsh advfirewall firewall add rule name="AmaDelivery Frontend" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="AmaDelivery Backend" dir=in action=allow protocol=TCP localport=4000
```

### **2. Ou via Interface Gráfica**
1. Abra "Windows Defender Firewall"
2. Clique em "Configurações avançadas"
3. Clique em "Regras de entrada" → "Nova regra"
4. Selecione "Porta" → "TCP" → "Portas específicas"
5. Digite `5173,4000` → "Permitir conexão"
6. Aplique para todos os perfis

## 🐛 **Solução de Problemas**

### **❌ "Não é possível acessar"**
- ✅ Verifique se todos os dispositivos estão na mesma rede
- ✅ Confirme se o firewall está configurado
- ✅ Teste se o IP está correto

### **❌ "CORS Error"**
- ✅ Verifique se o backend está rodando
- ✅ Confirme se a URL da API está correta no `.env.local`

### **❌ "Connection Refused"**
- ✅ Verifique se as portas 5173 e 4000 estão abertas
- ✅ Confirme se o backend está escutando em `0.0.0.0`

### **❌ "Site não carrega"**
- ✅ Aguarde alguns segundos para o Vite compilar
- ✅ Verifique o console do navegador para erros
- ✅ Teste primeiro no localhost

## 📊 **Verificar se Está Funcionando**

### **1. Teste Local**
```bash
# Acesse no mesmo computador
http://localhost:5173
```

### **2. Teste de Rede**
```bash
# Acesse de outro dispositivo
http://SEU_IP:5173
```

### **3. Teste de API**
```bash
# Teste direto da API
curl http://SEU_IP:4000/api/public/restaurants
```

## 🎯 **URLs Importantes**

| Serviço | URL Local | URL Rede |
|---------|-----------|----------|
| **Frontend** | `http://localhost:5173` | `http://SEU_IP:5173` |
| **Backend** | `http://localhost:4000` | `http://SEU_IP:4000` |
| **API Docs** | `http://localhost:4000/api` | `http://SEU_IP:4000/api` |

## 🔒 **Considerações de Segurança**

⚠️ **Importante:** Esta configuração é apenas para **desenvolvimento local**. Para produção:

- ✅ Use HTTPS
- ✅ Configure CORS adequadamente
- ✅ Implemente autenticação robusta
- ✅ Use proxy reverso (Nginx)
- ✅ Configure SSL/TLS

## 📝 **Comandos Úteis**

### **Verificar Portas em Uso**
```bash
# Windows
netstat -an | findstr :5173
netstat -an | findstr :4000

# Linux/Mac
lsof -i :5173
lsof -i :4000
```

### **Testar Conectividade**
```bash
# Testar se a porta está aberta
telnet SEU_IP 5173
telnet SEU_IP 4000
```

### **Reiniciar Serviços**
```bash
# Parar processos
Ctrl + C

# Reiniciar
npm run dev:network
```

## 🎉 **Pronto!**

Agora você pode acessar o AmaDelivery de qualquer dispositivo na sua rede local! 

**Lembre-se:** Sempre teste primeiro no localhost antes de acessar pela rede.

---

*Documentação criada em 27 de Janeiro de 2025*
