# Setup para Primeiro Build

## Passo 1: Inicializar Projeto EAS
Execute no terminal (na pasta Mobile):

```bash
eas init
```

Quando solicitado:
- Escolha criar um novo projeto
- Escolha seu nome de usuário/organização

## Passo 2: Executar o Build
Após inicializar, execute:

```bash
.\build-apk.ps1
```

OU execute os comandos manualmente:

```bash
# Configurar build
eas build:configure

# Fazer build
eas build --platform android --profile preview
```

## Alternativa Rápida (tudo em um)
Se preferir, execute todos os comandos:

```bash
eas init
eas build:configure
eas build --platform android --profile preview
```

Depois disso, o script `build-apk.ps1` funcionará normalmente para builds futuros.

