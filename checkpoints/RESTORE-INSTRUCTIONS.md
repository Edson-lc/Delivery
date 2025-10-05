# 🔄 Instruções para Restaurar Checkpoint v2.0

## 📋 Pré-requisitos
- Node.js 18+ instalado
- PostgreSQL rodando
- Projeto AmaDeliveryNew clonado

## 🚀 Passos para Restaurar

### 1. **Backup dos Arquivos Atuais**
```bash
# Criar backup da versão atual
mkdir backup-atual
cp src/pages/RestaurantDashboard.jsx backup-atual/
cp server/src/routes/orders.ts backup-atual/
cp src/pages/Checkout.jsx backup-atual/
```

### 2. **Restaurar Arquivos do Checkpoint**
```bash
# Restaurar arquivos do checkpoint v2.0
cp checkpoints/backup-v2.0/RestaurantDashboard.jsx src/pages/
cp checkpoints/backup-v2.0/orders.ts server/src/routes/
cp checkpoints/backup-v2.0/Checkout.jsx src/pages/
```

### 3. **Instalar Dependências**
```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 4. **Configurar Banco de Dados**
```bash
# Executar migrações
cd server
npx prisma migrate deploy
npx prisma generate
cd ..
```

### 5. **Iniciar Servidores**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

## ✅ Verificação da Restauração

### **Testes Obrigatórios**
1. **Acessar dashboard**: `http://localhost:5174/restaurantedashboard`
2. **Fazer pedido**: Testar criação de pedido no checkout
3. **Modal de notificação**: Verificar se aparece automaticamente
4. **Sistema de som**: Testar diferentes tipos de som
5. **Aceitar pedido**: Verificar se itens não são apagados
6. **Filtros**: Testar filtros por status
7. **Atualização de status**: Testar fluxo completo

### **Logs Esperados**
- ✅ "🔄 Atualizando apenas status do pedido"
- ✅ "✅ Status atualizado com sucesso"
- ✅ "🚨 NOVO PEDIDO DETECTADO!"
- ✅ "🔊 Som tocado com sucesso!"

## 🐛 Troubleshooting

### **Problema: Modal não aparece**
- Verificar se polling está ativo (30s)
- Verificar logs de detecção de pedidos
- Verificar se pedido tem status `pendente`

### **Problema: Som não toca**
- Verificar se som está habilitado
- Testar diferentes tipos de som
- Verificar permissões do navegador

### **Problema: Itens são apagados**
- Verificar se backend está usando lógica inteligente
- Verificar logs "Atualizando apenas status"
- Verificar se não há recálculo desnecessário

### **Problema: Erro 401/404**
- Verificar se token está válido
- Verificar se servidor backend está rodando
- Fazer login novamente se necessário

## 📞 Suporte

Se encontrar problemas durante a restauração:
1. Verificar logs do console do navegador
2. Verificar logs do servidor backend
3. Comparar com arquivos de backup
4. Revisar documentação do checkpoint

---

**🎯 Checkpoint v2.0 restaurado com sucesso!**  
**📅 Data de restauração:** [DATA_ATUAL]  
**✅ Status:** Sistema funcionando perfeitamente
