# Script para Build Local do APK
Write-Host "=== Build Local APK - AmaEats ===" -ForegroundColor Green
Write-Host ""

# Configurar Java 21
$java21Path = "C:\Program Files\Eclipse Adoptium\jdk-21.0.9.10-hotspot"
if (Test-Path $java21Path) {
    $env:JAVA_HOME = $java21Path
    $env:PATH = "$java21Path\bin;$env:PATH"
    Write-Host "[OK] Java 21 configurado: $java21Path" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Java 21 nao encontrado em: $java21Path" -ForegroundColor Yellow
    Write-Host "Configure JAVA_HOME manualmente para Java 21" -ForegroundColor Yellow
}

# Verificar Android SDK
if (-not (Test-Path $env:ANDROID_HOME)) {
    Write-Host "[ERRO] ANDROID_HOME nao configurado!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Android SDK: $env:ANDROID_HOME" -ForegroundColor Green
Write-Host ""

# Instalar dependencias
Write-Host "1. Instalando dependencias..." -ForegroundColor Yellow
Set-Location "C:\Dev\AmaDeliveryNew\Mobile"
npm install --legacy-peer-deps

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao instalar dependencias" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dependencias instaladas" -ForegroundColor Green
Write-Host ""

# Prebuild (gerar pasta android) - apenas se nao existir
if (-not (Test-Path "android")) {
    Write-Host "2. Gerando projeto Android nativo..." -ForegroundColor Yellow
    Write-Host "Isso pode levar alguns minutos..." -ForegroundColor Cyan
    npx expo prebuild --platform android --clean

    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha no prebuild" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Projeto Android gerado" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "2. Projeto Android ja existe, pulando prebuild" -ForegroundColor Cyan
    Write-Host ""
}

# Build APK
Write-Host "3. Compilando APK..." -ForegroundColor Yellow
Write-Host "Isso pode levar varios minutos..." -ForegroundColor Cyan
Write-Host ""

Set-Location android
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] APK compilado com sucesso!" -ForegroundColor Green
    Write-Host ""
    $apkPath = "app\build\outputs\apk\release\app-release.apk"
    if (Test-Path $apkPath) {
        $apkInfo = Get-Item $apkPath
        Write-Host "Localizacao do APK:" -ForegroundColor Yellow
        Write-Host "   $($apkInfo.FullName)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Tamanho: $([math]::Round($apkInfo.Length / 1MB, 2)) MB" -ForegroundColor Green
        Write-Host ""
        Write-Host "APK pronto para instalacao!" -ForegroundColor Green
    } else {
        Write-Host "   APK nao encontrado no caminho esperado" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "[ERRO] Falha ao compilar APK" -ForegroundColor Red
    Write-Host "Verifique os logs acima para mais detalhes" -ForegroundColor Yellow
}

Set-Location ..
