# Script para Build Local com Java 17
Write-Host "=== Build Local APK - AmaEats (Java 17) ===" -ForegroundColor Green
Write-Host ""

# Verificar e configurar Java 17
$java17Paths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Java\jdk-17*",
    "C:\Program Files\Microsoft\jdk-17*",
    "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-17*"
)

$java17Found = $false
foreach ($path in $java17Paths) {
    $javaPath = Get-ChildItem $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($javaPath) {
        $javaHome = $javaPath.FullName
        $env:JAVA_HOME = $javaHome
        $env:PATH = "$javaHome\bin;$env:PATH"
        Write-Host "[OK] Java 17 encontrado: $javaHome" -ForegroundColor Green
        $java17Found = $true
        break
    }
}

if (-not $java17Found) {
    Write-Host "[AVISO] Java 17 nao encontrado nas localizacoes padrao" -ForegroundColor Yellow
    Write-Host "Por favor, instale Java 17 ou configure JAVA_HOME manualmente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ou configure temporariamente:" -ForegroundColor Cyan
    Write-Host '  $env:JAVA_HOME = "C:\caminho\para\jdk-17"' -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Deseja continuar mesmo assim? (s/n)"
    if ($continue -ne "s") {
        exit 1
    }
}

# Verificar versao
Write-Host ""
Write-Host "Verificando versao do Java..." -ForegroundColor Yellow
java -version
Write-Host ""

# Executar build
Set-Location "C:\Dev\AmaDeliveryNew\Mobile"

if (-not (Test-Path "android")) {
    Write-Host "Executando prebuild..." -ForegroundColor Yellow
    npx expo prebuild --platform android --clean
}

Set-Location android
Write-Host "Compilando APK..." -ForegroundColor Yellow
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] APK compilado com sucesso!" -ForegroundColor Green
    $apkPath = "app\build\outputs\apk\release\app-release.apk"
    if (Test-Path $apkPath) {
        Write-Host ""
        Write-Host "APK localizado em:" -ForegroundColor Yellow
        Write-Host "   $((Get-Location).Path)\$apkPath" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "[ERRO] Falha ao compilar APK" -ForegroundColor Red
}

Set-Location ..

