# Solução para Problema de Versão do Java

## Problema
O Gradle 8.14.3 não suporta Java 25. É necessário Java 17 ou 21.

## Solução 1: Instalar Java 17 ou 21 (Recomendado)

### Opção A - Usando Eclipse Temurin (Recomendado)
1. Baixe Java 17 LTS: https://adoptium.net/temurin/releases/?version=17
2. Instale o JDK 17
3. Configure JAVA_HOME:
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"
   ```

### Opção B - Usando Microsoft Build do OpenJDK
1. Baixe: https://learn.microsoft.com/en-us/java/openjdk/download
2. Instale JDK 17 ou 21
3. Configure JAVA_HOME apontando para a instalação

## Solução 2: Atualizar Gradle (Alternativa)

Se preferir manter Java 25, atualize o Gradle para versão que suporte:
1. Edite `android/gradle/wrapper/gradle-wrapper.properties`
2. Altere para: `distributionUrl=https\://services.gradle.org/distributions/gradle-8.14.3-bin.zip`
   (Gradle 8.14+ pode não suportar Java 25 ainda)

## Solução 3: Usar script com JAVA_HOME temporário

Crie um script que configure Java 17 temporariamente antes do build.

## Verificar versão instalada
```powershell
java -version
```

## Configurar JAVA_HOME permanentemente
```powershell
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-17", "User")
```

