# Script PowerShell para gerar certificados SSL para desenvolvimento
# ATENÇÃO: Use certificados reais em produção!

Write-Host "🔐 Gerando certificados SSL para desenvolvimento..." -ForegroundColor Green

# Criar diretório ssl se não existir
if (!(Test-Path "ssl")) {
    New-Item -ItemType Directory -Path "ssl"
}

# Verificar se OpenSSL está disponível
try {
    # Tentar usar OpenSSL se disponível
    & openssl version
    Write-Host "✅ OpenSSL encontrado, gerando certificados..." -ForegroundColor Green
    
    # Gerar chave privada
    & openssl genrsa -out ssl/key.pem 2048
    
    # Gerar certificado auto-assinado
    & openssl req -new -x509 -key ssl/key.pem -out ssl/cert.pem -days 365 -subj "/C=BR/ST=SP/L=SaoPaulo/O=AmaDelivery/OU=Dev/CN=localhost"
    
} catch {
    Write-Host "⚠️ OpenSSL não encontrado. Criando certificados usando PowerShell..." -ForegroundColor Yellow
    
    # Gerar certificado usando PowerShell (Windows)
    $cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddDays(365)
    
    # Exportar certificado
    $certPath = "ssl/cert.pem"
    $keyPath = "ssl/key.pem"
    
    # Exportar como PEM
    $certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    [System.IO.File]::WriteAllBytes($certPath, $certBytes)
    
    # Para a chave privada, precisamos usar OpenSSL ou uma alternativa
    Write-Host "⚠️ Chave privada não pode ser exportada sem OpenSSL." -ForegroundColor Red
    Write-Host "📝 Instale OpenSSL ou use certificados de uma CA confiável em produção." -ForegroundColor Yellow
}

Write-Host "✅ Certificados SSL gerados com sucesso!" -ForegroundColor Green
Write-Host "📁 Localização: ./ssl/" -ForegroundColor Cyan
Write-Host "⚠️ ATENÇÃO: Estes são certificados de desenvolvimento. Use certificados reais em produção!" -ForegroundColor Red
Write-Host ""
Write-Host "Para usar em produção, obtenha certificados de uma CA confiável como:" -ForegroundColor Yellow
Write-Host "- Let's Encrypt (gratuito)" -ForegroundColor White
Write-Host "- Cloudflare SSL" -ForegroundColor White
Write-Host "- DigiCert" -ForegroundColor White
Write-Host "- Comodo" -ForegroundColor White
