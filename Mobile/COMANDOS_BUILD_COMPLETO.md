# Comandos Completos para Build do APK

## ✅ Status: Projeto EAS Configurado!

Agora você precisa gerar as credenciais Android antes do primeiro build.

## Passo 1: Gerar Credenciais Android

Execute no terminal:

```powershell
cd Mobile
eas credentials
```

Quando solicitado:
- Escolha **Android**
- Escolha **Generate a new Android Keystore**

## Passo 2: Fazer o Build

Após as credenciais serem geradas, execute:

```powershell
eas build --platform android --profile preview
```

OU use o script automatizado:

```powershell
.\build-apk.ps1
```

## Processo Completo (se ainda não fez):

1. ✅ Login: `eas login` (já feito)
2. ✅ Configurar projeto: `eas build:configure` (já feito)
3. ⏳ Gerar credenciais: `eas credentials` (execute agora)
4. ⏳ Build: `eas build --platform android --profile preview`

## Tempo estimado:
- Geração de credenciais: ~1-2 minutos
- Build na nuvem: 15-30 minutos
- Total: ~20-35 minutos

## Notas:
- As credenciais precisam ser geradas apenas uma vez
- Builds futuros usarão as mesmas credenciais
- Você receberá email quando o build estiver pronto

