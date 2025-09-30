#!/bin/bash

# Script para gerar certificados SSL para desenvolvimento
# ATENÇÃO: Use certificados reais em produção!

echo "🔐 Gerando certificados SSL para desenvolvimento..."

# Criar diretório ssl se não existir
mkdir -p ssl

# Gerar chave privada
openssl genrsa -out ssl/key.pem 2048

# Gerar certificado auto-assinado
openssl req -new -x509 -key ssl/key.pem -out ssl/cert.pem -days 365 -subj "/C=BR/ST=SP/L=SaoPaulo/O=AmaDelivery/OU=Dev/CN=localhost"

# Definir permissões corretas
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo "✅ Certificados SSL gerados com sucesso!"
echo "📁 Localização: ./ssl/"
echo "⚠️  ATENÇÃO: Estes são certificados de desenvolvimento. Use certificados reais em produção!"
echo ""
echo "Para usar em produção, obtenha certificados de uma CA confiável como:"
echo "- Let's Encrypt (gratuito)"
echo "- Cloudflare SSL"
echo "- DigiCert"
echo "- Comodo"
