# Build Local do APK - Guia Completo

## Pré-requisitos

1. **Android Studio** instalado
2. **Android SDK** configurado (variável `ANDROID_HOME`)
3. **Java JDK** instalado (versão 17 ou superior)
4. **Node.js** e npm instalados

## Passo a Passo

### 1. Instalar Dependências

```powershell
cd Mobile
npm install --legacy-peer-deps
```

### 2. Gerar Projeto Android Nativo

```powershell
npx expo prebuild --platform android --clean
```

Isso criará a pasta `android/` com o projeto nativo.

### 3. Compilar o APK

**Opção A - Usando o script automatizado:**
```powershell
.\build-local.ps1
```

**Opção B - Manualmente:**
```powershell
cd android
.\gradlew.bat assembleRelease
```

### 4. Localizar o APK

O APK será gerado em:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Build Debug (para testes)

Para gerar um APK de debug (mais rápido, não assinado):

```powershell
cd android
.\gradlew.bat assembleDebug
```

APK de debug estará em:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Assinar o APK (para distribuição)

O APK gerado não está assinado. Para assinar:

1. Gere uma keystore (primeira vez):
```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Configure em `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('my-upload-key.keystore')
            storePassword 'sua-senha'
            keyAlias 'my-key-alias'
            keyPassword 'sua-senha'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## Troubleshooting

### Erro: "ANDROID_HOME não encontrado"
Configure a variável de ambiente:
```powershell
$env:ANDROID_HOME = "C:\Users\edson\AppData\Local\Android\Sdk"
```

### Erro: "gradlew não encontrado"
Execute o prebuild primeiro:
```powershell
npx expo prebuild --platform android --clean
```

### Erro de permissões
Execute o PowerShell como Administrador.

## Vantagens do Build Local

- ✅ Mais rápido (não precisa esperar na fila)
- ✅ Não precisa de conta Expo
- ✅ Controle total sobre o processo
- ✅ Pode debugar problemas facilmente

## Desvantagens

- ⚠️ Precisa ter Android SDK instalado
- ⚠️ Precisa configurar ambiente de desenvolvimento
- ⚠️ APK não assinado por padrão

