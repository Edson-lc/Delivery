# 💳 Sistema de Pagamentos Stripe - AmaDelivery

Sistema completo de pagamentos integrado com Stripe para Portugal, incluindo processamento de cartões, salvamento de métodos de pagamento e pagamento em dinheiro.

## 🚀 Funcionalidades Implementadas

### ✅ **Pagamentos com Cartão**
- Processamento seguro com Stripe
- Suporte a cartões de crédito e débito
- Validação em tempo real
- Confirmação automática de pagamentos

### ✅ **Métodos de Pagamento Salvos**
- Salvamento seguro de cartões
- Listagem de cartões salvos
- Reutilização de métodos de pagamento
- Gerenciamento de métodos de pagamento

### ✅ **Pagamento em Dinheiro**
- Cálculo automático de troco
- Validação de valores
- Confirmação de pagamento na entrega

### ✅ **Interface Responsiva**
- Design mobile-first
- Componentes Stripe integrados
- Feedback visual em tempo real
- Páginas de sucesso e cancelamento

## 🛠 Configuração

### 1. **Instalar Dependências**
```bash
# Backend
cd server
npm install

# Frontend
cd ..
npm install
```

### 2. **Configurar Variáveis de Ambiente**
```bash
# Copiar arquivo de exemplo
cp env.example .env

# Configurar no arquivo .env:
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### 3. **Executar Script de Configuração**
```bash
# Linux/Mac
chmod +x scripts/setup-stripe.sh
./scripts/setup-stripe.sh

# Windows PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\setup-stripe.ps1
```

### 4. **Configurar Webhook no Stripe**
1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com)
2. Vá em **Webhooks** → **Add endpoint**
3. URL: `https://seu-dominio.com/api/stripe/webhook`
4. Eventos para escutar:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `setup_intent.succeeded`

## 🧪 Testando o Sistema

### **Script de Teste Automático**
```bash
# Linux/Mac
chmod +x scripts/test-stripe.sh
./scripts/test-stripe.sh

# Windows PowerShell
.\scripts\test-stripe.ps1
```

### **Teste Manual**
1. Inicie o servidor:
   ```bash
   npm run dev
   ```

2. Acesse: http://localhost:5173

3. Adicione itens ao carrinho e vá para checkout

4. Teste com cartões do Stripe:
   - **Sucesso**: `4242 4242 4242 4242`
   - **Falha**: `4000 0000 0000 0002`
   - **CVV**: Qualquer 3 dígitos
   - **Data**: Qualquer data futura

## 📁 Estrutura de Arquivos

```
├── server/
│   ├── src/
│   │   ├── lib/
│   │   │   └── stripe.ts              # Configuração do Stripe
│   │   └── routes/
│   │       └── stripe.ts              # Rotas da API Stripe
│   └── prisma/
│       └── schema.prisma              # Schema atualizado com campos Stripe
├── src/
│   ├── components/
│   │   └── checkout/
│   │       └── StripePaymentMethodSelector.jsx  # Componente principal
│   ├── hooks/
│   │   └── useStripePayment.js        # Hook personalizado
│   └── pages/
│       ├── CheckoutSuccess.jsx        # Página de sucesso
│       └── CheckoutCancel.jsx         # Página de cancelamento
└── scripts/
    ├── setup-stripe.sh               # Script de configuração
    ├── setup-stripe.ps1              # Script de configuração (Windows)
    └── test-stripe.sh                # Script de teste
```

## 🔧 API Endpoints

### **Backend Stripe Routes**
- `POST /api/stripe/create-payment-intent` - Criar PaymentIntent
- `POST /api/stripe/confirm-payment` - Confirmar pagamento
- `POST /api/stripe/create-customer` - Criar Customer
- `POST /api/stripe/create-setup-intent` - Criar SetupIntent
- `GET /api/stripe/payment-methods/:customerId` - Listar métodos salvos
- `POST /api/stripe/save-payment-method` - Salvar método de pagamento
- `POST /api/stripe/webhook` - Webhook do Stripe

## 💡 Como Usar

### **1. Pagamento com Novo Cartão**
```javascript
// O componente StripePaymentMethodSelector gerencia automaticamente
<StripePaymentMethodSelector
  user={currentUser}
  selectedPaymentMethod={selectedPaymentMethod}
  onPaymentMethodSelect={setSelectedPaymentMethod}
  totalAmount={calculateTotal()}
/>
```

### **2. Usar Hook Personalizado**
```javascript
import { useStripePayment } from '@/hooks/useStripePayment';

const { processPayment, isProcessing, error } = useStripePayment();

const handlePayment = async () => {
  const result = await processPayment({
    amount: 25.50,
    paymentMethodId: 'pm_1234',
    customerId: 'cus_1234',
    orderId: 'order_1234'
  });
  
  if (result.success) {
    // Pagamento processado com sucesso
  }
};
```

### **3. Processar Webhook**
```javascript
// O webhook é processado automaticamente
// Eventos tratados:
// - payment_intent.succeeded
// - payment_intent.payment_failed
// - setup_intent.succeeded
```

## 🔒 Segurança

### **Implementações de Segurança**
- ✅ Validação de entrada com Zod
- ✅ Autenticação JWT obrigatória
- ✅ Sanitização de dados
- ✅ Rate limiting
- ✅ Headers de segurança
- ✅ Logs estruturados
- ✅ Tratamento de erros robusto

### **Configurações de Produção**
1. **Use chaves de produção**: Substitua `sk_test_` por `sk_live_`
2. **Configure webhook de produção**: Use HTTPS
3. **Monitore logs**: Configure alertas para falhas
4. **Backup de dados**: Configure backup automático

## 🐛 Troubleshooting

### **Problemas Comuns**

#### **1. Erro "Stripe not configured"**
```bash
# Verificar variáveis de ambiente
grep STRIPE .env

# Reconfigurar
./scripts/setup-stripe.sh
```

#### **2. Webhook não funciona**
```bash
# Verificar URL do webhook
curl -X POST http://localhost:4000/api/stripe/webhook

# Deve retornar erro 400 (assinatura inválida), não 404
```

#### **3. Cartões não são salvos**
```bash
# Verificar se SetupIntent está funcionando
# Verificar logs do servidor
# Verificar permissões do Customer
```

#### **4. Pagamentos falham**
```bash
# Verificar logs do Stripe Dashboard
# Verificar se PaymentIntent está sendo criado
# Verificar se cliente está autenticado
```

## 📊 Monitoramento

### **Métricas Importantes**
- Taxa de sucesso de pagamentos
- Tempo de processamento
- Erros por tipo
- Métodos de pagamento mais usados

### **Logs Estruturados**
```javascript
// Logs automáticos em:
// - Criação de PaymentIntent
// - Confirmação de pagamento
// - Erros de processamento
// - Webhooks recebidos
```

## 🔗 Links Úteis

- [Dashboard Stripe](https://dashboard.stripe.com)
- [Documentação Stripe](https://stripe.com/docs)
- [Cartões de Teste](https://stripe.com/docs/testing)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Portugal Payment Methods](https://stripe.com/docs/payments/payment-methods)

## 📞 Suporte

Para suporte técnico:
- 📧 Email: suporte@amadelivery.pt
- 💬 WhatsApp: +351 987 654 321
- 📱 Telefone: +351 123 456 789

---

**AmaDelivery** - Sistema de pagamentos seguro e confiável para Portugal 🇵🇹
