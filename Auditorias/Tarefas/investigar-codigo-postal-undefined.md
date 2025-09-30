# Investigar Código Postal Undefined

## Problema
- Campo `codigoPostal` existe no banco de dados com valor "4600-752"
- Frontend recebe `undefined` para o mesmo campo
- Logs de debug não estão aparecendo

## Status Atual
- ✅ Debug adicionado no backend (`server/src/routes/orders.ts`)
- ✅ Debug adicionado no frontend (`src/components/account/OrderDetailsModal.jsx`)
- ❌ Logs não estão sendo exibidos
- ❌ Código postal não aparece na interface

## Possíveis Causas
1. **Servidor não está rodando**
   - Verificar se `npm run dev` está executando no diretório `server/`
   - Verificar se a porta está correta

2. **Prisma Client desatualizado**
   - Campo `codigoPostal` pode não estar mapeado corretamente
   - Executar `npx prisma generate` no diretório `server/`

3. **Serialização do Prisma**
   - Função `serialize()` pode estar removendo o campo
   - Verificar `server/src/utils/serialization.ts`

4. **Mapeamento de campo**
   - Schema: `codigoPostal @map("codigo_postal")`
   - Verificar se o mapeamento está correto

## Próximos Passos
1. **Resolver erro do Prisma Client**
   - **ERRO**: `EPERM: operation not permitted` no Windows
   - **SOLUÇÃO**: 
     - Fechar todos os processos Node.js (servidor, frontend, etc.)
     - Executar `npx prisma generate` no diretório `server/`
     - Reiniciar o servidor

2. **Verificar servidor**
   - Confirmar se está rodando na porta correta
   - Verificar logs do servidor

3. **Testar endpoint diretamente**
   - Fazer requisição para `/api/orders/:id`
   - Verificar se `codigoPostal` está presente na resposta

4. **Verificar serialização**
   - Adicionar log antes da serialização
   - Verificar se o campo está sendo removido

## Arquivos Modificados
- `server/src/routes/orders.ts` - Debug adicionado
- `src/components/account/OrderDetailsModal.jsx` - Debug adicionado

## Data de Criação
29/09/2025

## Prioridade
Média - Funcionalidade importante para exibição completa do endereço
