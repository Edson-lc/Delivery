#!/bin/bash

# Script para detectar automaticamente o IP e atualizar configurações
# Execute este script sempre que o IP mudar

echo "🔍 Detectando IP atual da rede local..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script na raiz do projeto AmaDelivery"
    exit 1
fi

# Obter IP da máquina (múltiplas tentativas)
ip=""

# Tentativa 1: ip route
if [ -z "$ip" ]; then
    ip=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')
fi

# Tentativa 2: ifconfig
if [ -z "$ip" ]; then
    ip=$(ifconfig 2>/dev/null | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
fi

# Tentativa 3: hostname
if [ -z "$ip" ]; then
    ip=$(hostname -I 2>/dev/null | awk '{print $1}')
fi

# Tentativa 4: Teste de conectividade
if [ -z "$ip" ]; then
    # Tentar descobrir o IP testando gateways comuns
    for gateway in 192.168.1.1 192.168.0.1 10.0.0.1; do
        if ping -c 1 -W 1 "$gateway" >/dev/null 2>&1; then
            # Se conseguimos pingar o gateway, vamos tentar descobrir nosso IP
            ip=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')
            break
        fi
    done
fi

if [ -z "$ip" ]; then
    echo "❌ Não foi possível detectar o IP da rede local"
    echo "💡 Soluções:"
    echo "   1. Configure um IP fixo no seu roteador"
    echo "   2. Use um serviço de DNS dinâmico"
    echo "   3. Execute este script novamente"
    exit 1
fi

echo "✅ IP detectado: $ip"

# Verificar se o IP mudou
current_env_file=".env.local"
ip_changed=false

if [ -f "$current_env_file" ]; then
    if ! grep -q "$ip" "$current_env_file"; then
        ip_changed=true
        echo "🔄 IP mudou! Atualizando configurações..."
    else
        echo "✅ IP não mudou, configurações estão atualizadas"
    fi
else
    ip_changed=true
    echo "📝 Criando arquivo de configuração..."
fi

# Atualizar arquivo .env.local
if [ "$ip_changed" = true ]; then
    cat > "$current_env_file" << EOF
# Configuração automática para rede local
# Última atualização: $(date '+%Y-%m-%d %H:%M:%S')
VITE_API_URL=http://$ip:4000/api

# URLs de acesso
# Frontend: http://$ip:5173
# Backend:  http://$ip:4000
# Local:    http://localhost:5173
EOF
    
    echo "✅ Arquivo .env.local atualizado com IP: $ip"
fi

# Atualizar arquivo de configuração do backend se existir
backend_env_file="server/.env"
if [ -f "$backend_env_file" ]; then
    if ! grep -q "$ip" "$backend_env_file"; then
        # Atualizar CORS_ORIGIN no backend
        sed -i "s/CORS_ORIGIN=.*/CORS_ORIGIN=http:\/\/$ip:5173,http:\/\/localhost:5173/" "$backend_env_file"
        echo "✅ Configuração do backend atualizada"
    fi
fi

# Mostrar informações
echo ""
echo "🌐 URLs de acesso:"
echo "   Frontend: http://$ip:5173"
echo "   Backend:  http://$ip:4000"
echo "   Local:    http://localhost:5173"
echo ""

# Verificar se os serviços estão rodando
echo "🔍 Verificando status dos serviços..."

# Verificar backend
if curl -s http://localhost:4000/api/public/restaurants >/dev/null 2>&1; then
    echo "✅ Backend está rodando"
else
    echo "⚠️  Backend não está rodando"
    echo "   Execute: cd server && npm run dev"
fi

# Verificar frontend
if pgrep -f "vite" >/dev/null; then
    echo "✅ Frontend está rodando"
else
    echo "⚠️  Frontend não está rodando"
    echo "   Execute: npm run dev:network"
fi

echo ""
echo "📱 Para acessar de outros dispositivos:"
echo "   1. Conecte o dispositivo na mesma rede Wi-Fi"
echo "   2. Abra o navegador e acesse: http://$ip:5173"
echo ""

# Sugerir próximos passos
echo "💡 Próximos passos:"
echo "   1. Execute este script sempre que o IP mudar"
echo "   2. Configure um IP fixo no roteador (recomendado)"
echo "   3. Use um serviço de DNS dinâmico para acesso externo"
echo ""

echo "🎉 Configuração atualizada com sucesso!"
