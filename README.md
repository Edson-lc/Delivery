# 🚀 AmaDelivery - Sistema de Delivery Completo

Sistema completo de delivery de comida com frontend React e backend Node.js, incluindo gestão de restaurantes, pedidos, entregadores e clientes.

## 📋 Índice

- [Características](#-características)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Executando o Projeto](#-executando-o-projeto)
- [Docker](#-docker)
- [Testes](#-testes)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API](#-api)
- [Segurança](#-segurança)
- [Deploy](#-deploy)
- [Contribuição](#-contribuição)

## ✨ Características

### 🎯 Funcionalidades Principais
- **Gestão de Restaurantes**: Cadastro, edição e gerenciamento de restaurantes
- **Sistema de Pedidos**: Criação, acompanhamento e gestão de pedidos
- **Entregadores**: Cadastro, aprovação e gestão de entregadores
- **Clientes**: Gestão de clientes e histórico de pedidos
- **Dashboard**: Painéis administrativos e de restaurantes
- **Autenticação**: Sistema seguro de login com JWT

### 🔒 Segurança
- Autenticação JWT com refresh tokens
- Rate limiting para prevenir ataques
- Validação robusta de dados com Zod
- Sanitização de entrada
- Headers de segurança com Helmet
- CORS configurado adequadamente
- Logging estruturado

### ⚡ Performance
- Cache inteligente com React Query
- Memoização de componentes
- Lazy loading de imagens
- Compressão de respostas
- Otimização de bundle

## 🛠 Tecnologias

### Frontend
- **React 18** - Biblioteca de interface
- **Vite** - Build tool e dev server
- **React Router** - Roteamento
- **React Query** - Gerenciamento de estado e cache
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Componentes de UI
- **Lucide React** - Ícones

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas
- **Zod** - Validação de schemas

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **Nginx** - Proxy reverso
- **Jest** - Testes
- **ESLint** - Linting

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- PostgreSQL 15+
- Docker (opcional)

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/amadelivery.git
cd amadelivery
```

### 2. Instale as dependências
```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 3. Configure o banco de dados
```bash
# Crie um banco PostgreSQL
createdb amadelivery

# Execute as migrações
cd server
npx prisma migrate dev
npx prisma generate
npx prisma db seed
cd ..
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie o arquivo de exemplo e configure as variáveis:

```bash
cp env.example .env
```

Configure as seguintes variáveis no arquivo `.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/amadelivery"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="1h"

# Server Configuration
PORT=4000
NODE_ENV="development"

# Frontend Configuration
VITE_API_URL="http://localhost:4000/api"

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN="http://localhost:5173"
```

### 2. Configuração do Banco de Dados

O sistema usa Prisma como ORM. As migrações estão em `server/prisma/migrations/`.

## 🏃‍♂️ Executando o Projeto

### Desenvolvimento

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

O frontend estará disponível em `http://localhost:5173`
O backend estará disponível em `http://localhost:4000`

### Produção

```bash
# Build do frontend
npm run build

# Build do backend
cd server
npm run build
cd ..

# Iniciar em produção
cd server
npm start
```

## 🐳 Docker

### Desenvolvimento com Docker

```bash
# Iniciar apenas o banco de dados
docker-compose -f docker-compose.dev.yml up -d

# Acessar Adminer (gerenciador de banco)
# http://localhost:8080
```

### Produção com Docker

```bash
# Build e iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

## 🧪 Testes

```bash
# Executar testes do backend
cd server
npm test

# Executar testes com coverage
npm run test:coverage

# Executar testes em modo watch
npm run test:watch
```

## 📁 Estrutura do Projeto

```
amadelivery/
├── src/                          # Frontend React
│   ├── components/               # Componentes reutilizáveis
│   │   ├── ui/                  # Componentes base (shadcn/ui)
│   │   ├── public/              # Componentes públicos
│   │   ├── restaurant/          # Componentes de restaurante
│   │   └── ...
│   ├── pages/                   # Páginas da aplicação
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Utilitários e configurações
│   └── api/                     # Cliente API
├── server/                      # Backend Node.js
│   ├── src/
│   │   ├── routes/              # Rotas da API
│   │   ├── middleware/          # Middlewares
│   │   ├── utils/               # Utilitários
│   │   ├── schemas/             # Schemas de validação
│   │   └── lib/                 # Configurações
│   ├── prisma/                  # Schema e migrações do banco
│   └── tests/                   # Testes
├── docs/                        # Documentação
├── docker-compose.yml           # Docker para produção
├── docker-compose.dev.yml       # Docker para desenvolvimento
└── Dockerfile                   # Imagem Docker
```

## 🔌 API

### Endpoints Principais

- `POST /api/auth/login` - Autenticação
- `GET /api/auth/me` - Dados do usuário atual
- `GET /api/restaurants` - Listar restaurantes
- `POST /api/orders` - Criar pedido
- `GET /api/orders` - Listar pedidos
- `GET /api/entregadores` - Listar entregadores

### Documentação Completa

Consulte [docs/api-reference.md](docs/api-reference.md) para documentação completa da API.

## 🔒 Segurança

### Implementações de Segurança

- ✅ Autenticação JWT com tokens seguros
- ✅ Rate limiting para prevenir ataques
- ✅ Validação robusta com Zod
- ✅ Sanitização de entrada
- ✅ Headers de segurança
- ✅ CORS configurado
- ✅ Logging estruturado
- ✅ Hash seguro de senhas (bcrypt)

### Configurações de Produção

1. **JWT_SECRET**: Use uma chave segura de pelo menos 32 caracteres
2. **CORS_ORIGIN**: Configure apenas domínios permitidos
3. **NODE_ENV**: Sempre use "production" em produção
4. **Rate Limiting**: Ajuste conforme necessário
5. **Logs**: Configure rotação de logs

## 🚀 Deploy

### Deploy com Docker

```bash
# Build da imagem
docker build -t amadelivery .

# Executar com docker-compose
docker-compose up -d
```

### Deploy Manual

1. Configure as variáveis de ambiente
2. Execute as migrações do banco
3. Build do frontend e backend
4. Configure Nginx como proxy reverso
5. Configure SSL/TLS

### Variáveis de Ambiente para Produção

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/amadelivery
JWT_SECRET=your-super-secure-secret-key-32-chars-minimum
CORS_ORIGIN=https://yourdomain.com
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use ESLint e Prettier
- Escreva testes para novas funcionalidades
- Siga as convenções de commit
- Documente mudanças na API

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação em `docs/`
- Verifique os logs em `server/logs/`

---

**AmaDelivery** - Sistema completo de delivery desenvolvido com as melhores práticas de segurança e performance.