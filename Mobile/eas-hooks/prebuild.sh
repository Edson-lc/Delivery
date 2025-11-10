#!/bin/bash
# Hook customizado para usar --legacy-peer-deps durante o build

# Substituir npm ci por npm install com legacy-peer-deps
if [ -f "package-lock.json" ]; then
  echo "Instalando dependências com --legacy-peer-deps..."
  npm install --legacy-peer-deps
else
  echo "Instalando dependências..."
  npm install --legacy-peer-deps
fi

