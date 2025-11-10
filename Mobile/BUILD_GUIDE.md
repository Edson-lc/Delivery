# Guia de Build - APK de Teste

## Pré-requisitos
1. Conta no Expo (gratuita)
2. Node.js instalado
3. EAS CLI instalado (já foi verificado)

## Passos para Build

### 1. Login no Expo
```bash
cd Mobile
npx eas login
```

### 2. Configurar o projeto (primeira vez)
```bash
npx eas build:configure
```

### 3. Fazer build do APK para teste
```bash
# Build local (mais rápido, mas requer Android SDK)
npx eas build --platform android --profile preview --local

# OU Build na nuvem (recomendado para primeira vez)
npx eas build --platform android --profile preview
```

### 4. Aguardar o build
- Build na nuvem: leva cerca de 15-30 minutos
- Você receberá uma notificação quando estiver pronto

### 5. Download do APK
```bash
# Baixar o APK após o build estar pronto
npx eas build:list
# Use o ID do build para baixar
npx eas build:download [BUILD_ID]
```

## Opções de Build

### Preview (APK para teste)
```bash
npx eas build --platform android --profile preview
```

### Production (APK de produção)
```bash
npx eas build --platform android --profile production
```

## Notas Importantes
- O primeiro build pode demorar mais
- Builds na nuvem são gratuitos com conta Expo
- APK preview pode ser instalado diretamente no dispositivo
- Para distribuição na Play Store, use build de produção

## Troubleshooting
- Se tiver erro de autenticação, faça `npx eas login` novamente
- Verifique se o `app.json` está correto
- Certifique-se de que todos os assets existem

