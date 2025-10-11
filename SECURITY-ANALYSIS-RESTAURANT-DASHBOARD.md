# 🔒 ANÁLISE DE SEGURANÇA - RestaurantDashboard
**Data**: 06/01/2025  
**Status**: ⚠️ VULNERÁVEL - Requer correções urgentes

## 🚨 VULNERABILIDADES CRÍTICAS IDENTIFICADAS

### 1. **Frontend - Validação Insuficiente**
**Arquivo**: `src/pages/RestaurantDashboard.jsx` (linhas 642-653)
```javascript
// PROBLEMA: Admin pode acessar qualquer restaurante sem validação
if (user.role === "admin") {
  const restaurants = await Restaurant.list();
  restaurantData = restaurants?.[0]; // ⚠️ PRIMEIRO RESTAURANTE SEMPRE!
}
```

### 2. **Backend - APIs Sem Proteção de Restaurant ID**
**Arquivo**: `server/src/routes/menu-items.ts` (linhas 78-120)
```typescript
// PROBLEMA: Qualquer usuário pode criar/editar itens de qualquer restaurante
router.post('/', async (req, res, next) => {
  if (!rawData.restaurantId) {
    return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'restaurantId é obrigatório.'));
  }
  // ⚠️ Aceita qualquer restaurantId sem verificar permissão do usuário
});
```

### 3. **Middleware de Autenticação Incompleto**
**Arquivo**: `server/src/middleware/authenticate.ts`
- ✅ Valida token JWT
- ❌ NÃO valida permissões específicas por recurso
- ❌ NÃO verifica ownership de restaurante

## 🎯 CORREÇÕES NECESSÁRIAS

### 1. **Middleware de Autorização por Recurso**
```typescript
// server/src/middleware/authorize.ts (CRIAR)
export function validateRestaurantOwnership(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.authUser;
  const restaurantId = req.params.restaurantId || req.body.restaurantId;
  
  if (user.role === 'admin') return next(); // Admin tem acesso total
  
  if (user.tipoUsuario === 'restaurante' && user.restaurantId !== restaurantId) {
    return res.status(403).json(buildErrorPayload('FORBIDDEN', 'Acesso negado ao restaurante.'));
  }
  
  next();
}
```

### 2. **Proteção nas APIs de Menu Items**
```typescript
// Aplicar middleware nas rotas
router.post('/', authenticate, validateRestaurantOwnership, async (req, res, next) => {
  // Agora seguro - só pode criar itens para seu próprio restaurante
});

router.put('/:id', authenticate, validateRestaurantOwnership, async (req, res, next) => {
  // Agora seguro - só pode editar itens do seu próprio restaurante
});
```

### 3. **Validação Melhorada no Frontend**
```javascript
// RestaurantDashboard.jsx - Melhorar lógica de admin
if (user.role === "admin") {
  const selectedRestaurantId = searchParams.get('restaurantId');
  if (!selectedRestaurantId) {
    // Redirecionar para página de seleção de restaurante
    window.location.href = createPageUrl("Restaurantes");
    return;
  }
  restaurantData = await Restaurant.get(selectedRestaurantId);
}
```

### 4. **Middleware para Orders**
```typescript
// Já existe parcialmente em orders.ts, mas precisa ser aplicado consistentemente
function applyOrderVisibility(where: Prisma.OrderWhereInput, context: AuthContext | undefined) {
  if (tipo === 'restaurante') {
    const restaurantId = context.restaurantId ?? context.restaurant_id ?? null;
    if (!restaurantId) return null;
    return { ...where, restaurantId };
  }
}
```

## 📋 PLANO DE IMPLEMENTAÇÃO

### Fase 1: Middleware de Autorização
- [ ] Criar `server/src/middleware/authorize.ts`
- [ ] Implementar `validateRestaurantOwnership`
- [ ] Implementar `validateMenuItemOwnership`
- [ ] Implementar `validateOrderOwnership`

### Fase 2: Proteção das APIs
- [ ] Aplicar middleware em `menu-items.ts`
- [ ] Aplicar middleware em `orders.ts`
- [ ] Aplicar middleware em `restaurants.ts`
- [ ] Testar todas as rotas protegidas

### Fase 3: Melhorias no Frontend
- [ ] Corrigir lógica de admin no RestaurantDashboard
- [ ] Adicionar seleção explícita de restaurante para admin
- [ ] Implementar validação de permissões no frontend
- [ ] Adicionar tratamento de erros 403

### Fase 4: Testes e Auditoria
- [ ] Criar testes de segurança
- [ ] Implementar logs de auditoria
- [ ] Testar cenários de acesso não autorizado
- [ ] Documentar políticas de segurança

## 🔍 ARQUIVOS AFETADOS

### Backend
- `server/src/middleware/authorize.ts` (CRIAR)
- `server/src/routes/menu-items.ts`
- `server/src/routes/orders.ts`
- `server/src/routes/restaurants.ts`
- `server/src/middleware/authenticate.ts`

### Frontend
- `src/pages/RestaurantDashboard.jsx`
- `src/pages/layouts/useCurrentUser.js`
- `src/api/entities.js` (se necessário)

## ⚡ PRIORIDADE: ALTA
**Impacto**: Crítico - Usuários podem acessar dados de outros restaurantes  
**Complexidade**: Média - Requer mudanças em múltiplas camadas  
**Tempo estimado**: 4-6 horas

---
**Próximos passos**: Implementar middleware de autorização e aplicar nas APIs críticas
