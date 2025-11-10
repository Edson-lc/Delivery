# ⚠️ Aviso: Problema com Java 25 e CMake

## Situação Atual

O build está falhando porque o **CMake** (usado para compilar código nativo) está tentando usar métodos restritos do Java 25, que não são permitidos.

Erro:
```
WARNING: A restricted method in java.lang.System has been called
```

## Soluções

### ✅ Solução 1: Instalar Java 21 (RECOMENDADO)

Java 21 é LTS (Long Term Support) e é totalmente compatível com todas as ferramentas do Android.

1. **Baixar Java 21:**
   - Eclipse Temurin: https://adoptium.net/temurin/releases/?version=21
   - Escolha: **JDK 21 LTS** para Windows x64

2. **Instalar e configurar:**
   ```powershell
   # Após instalar, configure JAVA_HOME
   $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot"
   
   # Ou configure permanentemente:
   [System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot", "User")
   ```

3. **Verificar:**
   ```powershell
   java -version
   # Deve mostrar: openjdk version "21.x.x"
   ```

4. **Executar build:**
   ```powershell
   cd android
   .\gradlew.bat assembleRelease
   ```

### ⚠️ Solução 2: Build Sem ARM64 (Temporário)

O build atual está configurado para **pular ARM64** e compilar apenas para:
- `armeabi-v7a` (32-bit ARM)
- `x86` (32-bit Intel)
- `x86_64` (64-bit Intel)

Isso funciona para emuladores e alguns dispositivos, mas **não inclui a maioria dos dispositivos Android modernos** (que usam ARM64).

Para tentar este build:
```powershell
cd android
.\gradlew.bat assembleRelease
```

### 🔧 Solução 3: Usar EAS Build (Alternativa)

Se preferir não lidar com problemas locais:
```powershell
eas build --platform android --profile preview
```

Mas você já teve problemas com dependências no EAS.

## Recomendação Final

**Instale Java 21 LTS** - é a solução mais robusta e recomendada pela Google para desenvolvimento Android.

## Status Atual

- ✅ Gradle atualizado para 9.0 (suporta Java 21+)
- ✅ Configuração Java ajustada para 21
- ⚠️ Build falha no CMake devido a Java 25
- ⚠️ ARM64 temporariamente desabilitado

