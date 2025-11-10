# Configuração da URL da API

## Problema

O APK não está conseguindo conectar à API porque a URL não está configurada corretamente para produção.

## Solução Implementada

A URL da API agora é configurada em **3 níveis de prioridade**:

1. **Variável de ambiente** `EXPO_PUBLIC_API_BASE_URL` (desenvolvimento)
2. **Configuração no `app.json`** (produção/build)
3. **Fallback** para IP local (se nenhuma das anteriores estiver configurada)

## Como Configurar a URL da API

### Opção 1: Editar `app.json` (Recomendado para APK)

Edite o arquivo `Mobile/app.json` e altere o valor de `apiBaseUrl`:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "http://SEU_IP_AQUI:4000/api"
    }
  }
}
```

**Exemplos:**
- IP local da rede: `"http://192.168.1.229:4000/api"`
- Servidor de produção: `"https://api.amadelivery.com/api"`
- IP diferente: `"http://192.168.0.100:4000/api"`

### Opção 2: Variável de Ambiente (Desenvolvimento)

Crie um arquivo `.env` na pasta `Mobile/`:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.229:4000/api
```

### Opção 3: Fallback no Código

Edite `Mobile/src/constants/index.ts` e altere o fallback:

```typescript
return 'http://SEU_IP_AQUI:4000/api';
```

## Como Descobrir o IP Correto

### No Windows (PowerShell):
```powershell
ipconfig | findstr IPv4
```

### No Linux/Mac:
```bash
ifconfig | grep inet
```

**Importante:** Use o IP da sua máquina na rede local, não `localhost` ou `127.0.0.1`.

## Após Alterar a Configuração

1. **Para desenvolvimento:**
   ```powershell
   cd Mobile
   npm start
   ```

2. **Para gerar novo APK:**
   ```powershell
   cd Mobile
   # Edite app.json primeiro
   cd android
   .\gradlew.bat assembleRelease
   ```

## Verificar se Funcionou

1. Abra o app no dispositivo
2. Verifique os logs (se estiver em modo debug)
3. Tente carregar os restaurantes
4. Se ainda não funcionar, verifique:
   - Se o servidor está rodando na porta 4000
   - Se o dispositivo está na mesma rede
   - Se o firewall não está bloqueando a conexão

## Troubleshooting

### Erro: "Network request failed"
- Verifique se o IP está correto
- Verifique se o servidor está rodando
- Verifique se o dispositivo está na mesma rede Wi-Fi

### Erro: "Connection refused"
- Verifique se a porta 4000 está acessível
- Verifique se o firewall permite conexões na porta 4000

### Erro: "CORS error" (se testar no navegador)
- Configure o CORS no servidor para aceitar requisições do app

## URLs Comuns

- **Localhost (emulador):** `http://10.0.2.2:4000/api`
- **IP local (dispositivo físico):** `http://192.168.X.X:4000/api`
- **Produção:** `https://api.amadelivery.com/api`

