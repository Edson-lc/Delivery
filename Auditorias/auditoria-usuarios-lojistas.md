# 🔍 Auditoria do Sistema de Usuários - AmaDelivery

**Data da Auditoria:** 2024-12-19  
**Auditor:** Assistente IA  
**Escopo:** Sistema de usuários/clientes da loja  

## 📊 **Resumo Executivo**

O sistema possui uma estrutura robusta de usuários com diferentes tipos (cliente, restaurante, entregador, admin), mas foram identificadas algumas vulnerabilidades e pontos de melhoria importantes.

**Score de Segurança Atual: 6.5/10**

---

## 🔐 **1. Segurança de Autenticação e Autorização**

### ✅ **Pontos Positivos:**
- Sistema de autenticação JWT implementado
- Middleware de autenticação (`authenticate.ts`) bem estruturado
- Hash de senhas com bcrypt
- Rate limiting para login (`authLimiter`)
- Validação de tokens com verificação de usuário no banco

### ⚠️ **Vulnerabilidades Identificadas:**

1. **Exposição de Dados Sensíveis:**
   ```typescript
   // Em publicUserSelect - linha 1-20 em utils/user.ts
   passwordHash: true, // ❌ Senha não deveria estar no select público
   ```

2. **Falta de Validação de Força da Senha:**
   ```typescript
   // Em validation.ts - linha 7
   password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(100)
   // ❌ Falta validação de complexidade (maiúsculas, números, símbolos)
   ```

3. **Ausência de 2FA:**
   - Não há autenticação de dois fatores implementada

---

## 🛡️ **2. Proteção de Dados Pessoais**

### ⚠️ **Problemas Críticos:**

1. **Dados Sensíveis Expostos:**
   ```typescript
   // Em publicUserSelect - campos que podem ser sensíveis
   nif: true,           // ❌ NIF é dado pessoal sensível
   telefone: true,      // ❌ Telefone pode ser sensível
   dataNascimento: true, // ❌ Data de nascimento é sensível
   ```

2. **Falta de Criptografia de Dados Sensíveis:**
   - NIF, telefone e outros dados pessoais não estão criptografados no banco

3. **Ausência de LGPD Compliance:**
   - Não há implementação de consentimento granular
   - Falta de mecanismo de exclusão de dados

---

## 🔍 **3. Validações e Sanitização**

### ✅ **Pontos Positivos:**
- Validação com Zod implementada
- Sanitização básica de endereços
- Validação de formato de email e telefone

### ⚠️ **Problemas Identificados:**

1. **Validação de NIF Inadequada:**
   ```typescript
   // Em validation.ts - linha 13
   nif: z.string().regex(/^\d{9}$/, 'NIF deve ter 9 dígitos').optional(),
   // ❌ Falta validação do algoritmo de verificação do NIF
   ```

2. **Sanitização Insuficiente:**
   ```typescript
   // Em users.ts - linha 70-93
   // ❌ Sanitização apenas remove espaços, não previne XSS
   ```

---

## 🚪 **4. Sistema de Permissões**

### ✅ **Pontos Positivos:**
- Middleware de autorização por roles
- Controle de acesso baseado em `tipoUsuario`
- Verificação de admin vs usuário comum

### ⚠️ **Problemas:**

1. **Permissões Muito Amplas:**
   ```typescript
   // Em index.ts - linha 29
   router.use('/customers', requireRole(['admin', 'restaurante', 'cliente', 'user']), customersRouter);
   // ❌ Todos os tipos de usuário podem acessar customers
   ```

2. **Falta de Granularidade:**
   - Não há permissões específicas por ação (CRUD)
   - Ausência de controle de acesso baseado em recursos

---

## 🎨 **5. Componentes de Interface**

### ✅ **Pontos Positivos:**
- Interface moderna e responsiva
- Componentes bem estruturados
- Upload de imagem implementado

### ⚠️ **Problemas de Segurança:**

1. **Exposição de Dados na UI:**
   ```jsx
   // Em UserCard.jsx - linha 40
   const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email)}&background=f97316&color=fff`;
   // ❌ Email sendo usado em URL pública
   ```

2. **Falta de Sanitização no Frontend:**
   - Dados do usuário são exibidos sem sanitização
   - Possível vulnerabilidade XSS

---

## 🌐 **6. Endpoints da API**

### ⚠️ **Vulnerabilidades Críticas:**

1. **Endpoint de Listagem Sem Filtros Adequados:**
   ```typescript
   // Em users.ts - linha 136-176
   // ❌ Admins podem listar todos os usuários sem restrições
   ```

2. **Falta de Rate Limiting em Endpoints Sensíveis:**
   ```typescript
   // Em users.ts - linha 54
   router.post('/', createLimiter, ensureAdmin, async (req, res, next) => {
   // ✅ Tem rate limiting, mas outros endpoints não
   ```

3. **Ausência de Logs de Auditoria:**
   - Não há logs de ações sensíveis dos usuários
   - Falta de rastreamento de alterações

---

## 🗄️ **7. Schema do Banco de Dados**

### ⚠️ **Problemas de Design:**

1. **Campos Sensíveis Sem Criptografia:**
   ```sql
   -- Em schema.prisma - linha 24-25
   telefone             String?
   nif                  String?
   -- ❌ Dados sensíveis em texto plano
   ```

2. **Falta de Índices de Segurança:**
   - Não há índices para auditoria
   - Ausência de campos de auditoria (created_by, updated_by)

---

## 📋 **Recomendações Prioritárias**

### 🔴 **Críticas (Implementar Imediatamente):**

1. **Remover `passwordHash` do `publicUserSelect`**
   - Arquivo: `server/src/utils/user.ts`
   - Ação: Remover linha `passwordHash: true`

2. **Implementar criptografia para dados sensíveis (NIF, telefone)**
   - Usar biblioteca como `crypto-js` ou `node:crypto`
   - Criptografar antes de salvar no banco
   - Descriptografar apenas quando necessário

3. **Adicionar validação de força da senha**
   - Arquivo: `server/src/schemas/validation.ts`
   - Implementar regex para maiúsculas, números e símbolos

4. **Implementar logs de auditoria**
   - Criar middleware de auditoria
   - Logar todas as ações sensíveis (criação, edição, exclusão de usuários)

### 🟡 **Importantes (Próximas 2 semanas):**

1. **Implementar 2FA**
   - Usar biblioteca como `speakeasy` para TOTP
   - Adicionar campo `twoFactorSecret` no schema
   - Implementar endpoints para configuração

2. **Adicionar sanitização XSS**
   - Usar biblioteca como `dompurify` no frontend
   - Implementar sanitização no backend com `validator`

3. **Refinar sistema de permissões**
   - Criar sistema de permissões granulares
   - Implementar RBAC (Role-Based Access Control)

4. **Implementar LGPD compliance**
   - Adicionar campos de consentimento granular
   - Implementar endpoint de exclusão de dados
   - Criar sistema de anonimização

### 🟢 **Melhorias (Próximo mês):**

1. **Adicionar validação de algoritmo NIF**
   - Implementar algoritmo de validação do NIF português
   - Validar dígito de controle

2. **Implementar rate limiting em todos os endpoints**
   - Usar `express-rate-limit` em todos os endpoints sensíveis
   - Configurar limites diferentes por tipo de usuário

3. **Melhorar logs de segurança**
   - Implementar sistema de detecção de anomalias
   - Adicionar alertas para tentativas de acesso suspeitas

---

## 📁 **Arquivos Analisados**

### Backend:
- `server/src/routes/users.ts` - Rotas de usuários
- `server/src/routes/customers.ts` - Rotas de clientes
- `server/src/routes/auth.ts` - Rotas de autenticação
- `server/src/middleware/authenticate.ts` - Middleware de autenticação
- `server/src/schemas/validation.ts` - Schemas de validação
- `server/src/utils/user.ts` - Utilitários de usuário
- `server/prisma/schema.prisma` - Schema do banco de dados

### Frontend:
- `src/pages/Usuarios.jsx` - Página de usuários
- `src/pages/MinhaConta.jsx` - Página da conta do usuário
- `src/pages/Login.jsx` - Página de login
- `src/pages/CriarConta.jsx` - Página de criação de conta
- `src/components/users/UserForm.jsx` - Formulário de usuário
- `src/components/users/UserCard.jsx` - Card de usuário
- `src/api/entities.js` - Cliente da API

---

## 🎯 **Próximos Passos**

1. **Priorizar correções críticas** (semana 1)
2. **Implementar melhorias importantes** (semanas 2-3)
3. **Aplicar melhorias gerais** (mês 2)
4. **Realizar nova auditoria** (após implementações)

---

## 📞 **Contato**

Para dúvidas sobre esta auditoria ou implementação das correções, consulte o assistente IA ou a equipe de desenvolvimento.

**Status:** Aguardando implementação das correções críticas

