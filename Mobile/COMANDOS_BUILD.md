# Comandos para Build do APK

## Passo 1: Login (Execute manualmente)
```bash
cd Mobile
eas login
```
*Insira seu email e senha do Expo quando solicitado*

## Passo 2: Configurar projeto (primeira vez)
```bash
eas build:configure
```

## Passo 3: Build do APK
```bash
eas build --platform android --profile preview
```

## Alternativa: Usar script automatizado

Após fazer login, você pode executar:

**Windows (PowerShell):**
```powershell
.\build-apk.ps1
```

**Linux/Mac:**
```bash
chmod +x build-apk.sh
./build-apk.sh
```

## Comandos úteis

Ver status dos builds:
```bash
eas build:list
```

Baixar APK após build estar pronto:
```bash
eas build:download [BUILD_ID]
```

Ver informações da conta:
```bash
eas whoami
```

## Notas
- O build leva 15-30 minutos na nuvem
- Você receberá uma notificação por email quando estiver pronto
- O APK será baixável via link ou comando `eas build:download`

