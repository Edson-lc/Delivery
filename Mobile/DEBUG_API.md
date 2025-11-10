# Debug da Conexão com a API

## Problema
O app não está conectando à API mesmo com o servidor rodando normalmente.

## Correções Aplicadas

### 1. Permissão para HTTP (Cleartext Traffic)
Adicionado `android:usesCleartextTraffic="true"` no `AndroidManifest.xml` para permitir conexões HTTP não seguras.

### 2. Logs de Debug
Adicionados logs detalhados para verificar qual URL está sendo usada.

## Como Verificar os Logs

### Opção 1: Via ADB (Recomendado)

1. **Conecte o dispositivo via USB** e habilite "Depuração USB"

2. **Verifique se o dispositivo está conectado:**
   ```powershell
   adb devices
   ```

3. **Visualize os logs do app:**
   ```powershell
   adb logcat | Select-String "API"
   ```

   Ou para ver todos os logs do React Native:
   ```powershell
   adb logcat | Select-String "ReactNativeJS"
   ```

4. **Procure pelos logs:**
   - `🌐 [API]` - logs relacionados à URL da API
   - `✅ [API] URL final configurada` - mostra a URL que está sendo usada
   - `⚠️ [API] Usando URL fallback` - se estiver usando fallback

### Opção 2: Via Metro Bundler (Desenvolvimento)

Se estiver rodando em modo desenvolvimento, os logs aparecerão no terminal do Metro.

### Opção 3: Via React Native Debugger

Se estiver usando React Native Debugger, os logs aparecerão no console.

## O que Verificar nos Logs

1. **URL da API:**
   - Deve mostrar: `http://192.168.1.229:4000/api`
   - Se mostrar fallback, significa que a configuração do `app.json` não foi lida

2. **Erros de Conexão:**
   - `Network request failed` - problema de rede ou URL incorreta
   - `Connection refused` - servidor não está acessível
   - `CLEARTEXT communication not permitted` - problema de cleartext (já corrigido)

## Verificações Adicionais

### 1. Verificar se o Servidor está Acessível

No dispositivo Android, abra um navegador e tente acessar:
```
http://192.168.1.229:4000/api/public/restaurants
```

Se não funcionar no navegador, o problema é de rede/firewall.

### 2. Verificar IP do Servidor

No computador onde está o servidor:
```powershell
ipconfig | findstr IPv4
```

Certifique-se de que o IP está correto no `app.json`.

### 3. Verificar Firewall

No Windows, certifique-se de que:
- A porta 4000 está aberta no firewall
- O firewall permite conexões na rede local

### 4. Verificar Rede Wi-Fi

- O dispositivo Android deve estar na mesma rede Wi-Fi do servidor
- Não use dados móveis

## Teste Rápido

1. Instale o APK no dispositivo
2. Abra o app
3. Execute no terminal (com dispositivo conectado):
   ```powershell
   adb logcat -c  # Limpar logs
   adb logcat | Select-String "API"
   ```
4. Abra o app e tente carregar os restaurantes
5. Verifique os logs para ver:
   - Qual URL está sendo usada
   - Qual erro está ocorrendo (se houver)

## Solução Alternativa: Hardcode Temporário

Se a configuração via `app.json` não funcionar, você pode temporariamente hardcodear a URL no código:

Edite `Mobile/src/constants/index.ts` e force a URL:
```typescript
const getApiBaseUrl = (): string => {
  // FORÇAR URL (TEMPORÁRIO PARA DEBUG)
  return 'http://192.168.1.229:4000/api';
};
```

Depois recompile o APK.

## Próximos Passos

1. Instale o novo APK
2. Execute os logs via ADB
3. Compartilhe os logs que aparecem quando tenta carregar os restaurantes
4. Com os logs, podemos identificar exatamente qual é o problema

