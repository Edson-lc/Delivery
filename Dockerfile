# Multi-stage build para o frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci

# Copiar código fonte
COPY . .

# Build do frontend
RUN npm run build

# Multi-stage build para o backend
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copiar package files do backend
COPY server/package*.json ./
RUN npm ci

# Copiar código fonte do backend
COPY server/ .

# Build do backend
RUN npm run build

# Remover dependencias de desenvolvimento
RUN npm prune --production

# Imagem final de produção
FROM node:18-alpine AS production

# Instalar dependências do sistema
RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

WORKDIR /app

# Copiar arquivos do backend
COPY --from=backend-builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=backend-builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=backend-builder --chown=nextjs:nodejs /app/package*.json ./

# Copiar arquivos do frontend buildado
COPY --from=frontend-builder --chown=nextjs:nodejs /app/dist ./public

# Copiar arquivos de configuração
COPY --chown=nextjs:nodejs server/prisma ./prisma

# Criar diretório de logs
RUN mkdir -p logs && chown nextjs:nodejs logs

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicialização
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
