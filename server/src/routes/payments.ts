import { Router } from 'express';
import authenticate from '../middleware/authenticate';
import { requireRole } from '../middleware/require-role';
import { buildErrorPayload } from '../utils/errors';
import { Order, prisma } from '../lib/prisma';
import {
  createPaymentIntent,
  confirmPaymentIntent,
  createPaymentMethod,
  createCustomer,
  getCustomerPaymentMethods,
  attachPaymentMethodToCustomer,
  detachPaymentMethod,
  setDefaultPaymentMethod,
  refundPayment,
  getPaymentIntent,
  createSetupIntent,
  syncStripeCardsWithUser,
  saveStripeCardToUser,
  processPaymentWithSystemCard,
  stripe,
} from '../services/stripe';
import { User } from '../lib/prisma';
import { env } from '../env';

const router = Router();

// Middleware de autenticação para todas as rotas exceto webhook
router.use((req, res, next) => {
  if (req.path === '/webhook') {
    return next();
  }
  return authenticate(req, res, next);
});

// Criar Payment Intent
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'eur', orderId } = req.query;
    const user = req.user;

    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'Valor inválido'));
    }

    // Verificar se o usuário tem um customer ID no Stripe
    let customerId = user.stripeCustomerId;
    
    // Se não tem customer ID, criar um
    if (!customerId) {
      const customerResult = await createCustomer(user.email, user.fullName);
      if (!customerResult.success) {
        return res.status(500).json(buildErrorPayload('STRIPE_ERROR', 'Erro ao criar customer'));
      }
      
      // Salvar customer ID no usuário
      await User.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerResult.customer.id }
      });
      customerId = customerResult.customer.id;
    }

    const paymentIntentResult = await createPaymentIntent({
      amount: Number(amount),
      currency,
      customerId,
      metadata: {
        userId: user.id,
        orderId: orderId as string || '',
      },
    });

    if (!paymentIntentResult.success) {
      return res.status(500).json(buildErrorPayload('STRIPE_ERROR', paymentIntentResult.error));
    }

    res.json({
      success: true,
      paymentIntent: paymentIntentResult.paymentIntent,
    });
  } catch (error) {
    console.error('Erro ao criar Payment Intent:', error);
    res.status(500).json(buildErrorPayload('INTERNAL_ERROR', 'Erro interno do servidor'));
  }
});

// Confirmar Payment Intent
router.post('/confirm-intent', async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.query;

    if (!paymentIntentId || !paymentMethodId) {
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'Parâmetros obrigatórios ausentes'));
    }

    const confirmResult = await confirmPaymentIntent(
      paymentIntentId as string,
      paymentMethodId as string
    );

    if (!confirmResult.success) {
      return res.status(500).json(buildErrorPayload('STRIPE_ERROR', confirmResult.error));
    }

    res.json({
      success: true,
      paymentIntent: confirmResult.paymentIntent,
    });
  } catch (error) {
    console.error('Erro ao confirmar Payment Intent:', error);
    res.status(500).json(buildErrorPayload('INTERNAL_ERROR', 'Erro interno do servidor'));
  }
});

// Criar Payment Method
router.post('/methods', async (req, res) => {
  try {
    const { cardNumber, expMonth, expYear, cvc, name } = req.query;

    if (!cardNumber || !expMonth || !expYear || !cvc || !name) {
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'Dados do cartão obrigatórios'));
    }

    const paymentMethodResult = await createPaymentMethod({
      cardNumber: cardNumber as string,
      expMonth: Number(expMonth),
      expYear: Number(expYear),
      cvc: cvc as string,
      name: name as string,
    });

    if (!paymentMethodResult.success) {
      return res.status(500).json(buildErrorPayload('STRIPE_ERROR', paymentMethodResult.error));
    }

    res.json({
      success: true,
      paymentMethod: paymentMethodResult.paymentMethod,
    });
  } catch (error) {
    console.error('Erro ao criar Payment Method:', error);
    res.status(500).json(buildErrorPayload('INTERNAL_ERROR', 'Erro interno do servidor'));
  }
});

// Listar Payment Methods do usuário (integração com sistema existente)
router.get('/methods', async (req, res) => {
  try {
    const user = req.user;

    // Buscar cartões do sistema existente
    const existingCards = user.metodosPagamento || [];
    
    // Se tem Stripe Customer ID, sincronizar cartões do Stripe
    if (user.stripeCustomerId) {
      const syncResult = await syncStripeCardsWithUser(user.id, user.stripeCustomerId);
      
      if (syncResult.success) {
        // Combinar cartões existentes com cartões do Stripe
        const stripeCards = syncResult.cards;
        
        // Filtrar cartões duplicados (cartões que já existem no sistema)
        const nonDuplicateStripeCards = stripeCards.filter(stripeCard => 
          !existingCards.some(existingCard => 
            existingCard.stripe_payment_method_id === stripeCard.stripe_payment_method_id
          )
        );
        
        // Combinar todos os cartões
        const allCards = [...existingCards, ...nonDuplicateStripeCards];
        
        return res.json({
          success: true,
          paymentMethods: allCards,
          stripeCards: stripeCards,
          existingCards: existingCards,
        });
      }
    }

    // Retornar apenas cartões existentes se não há Stripe Customer ID
    res.json({
      success: true,
      paymentMethods: existingCards,
      stripeCards: [],
      existingCards: existingCards,
    });
  } catch (error) {
    console.error('Erro ao listar Payment Methods:', error);
    res.status(500).json(buildErrorPayload('INTERNAL_ERROR', 'Erro interno do servidor'));
  }
});

// Anexar Payment Method ao Customer
router.post('/methods/:id/attach', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId } = req.query;
    const user = req.user;

    if (!customerId) {
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'Customer ID obrigatório'));
    }

    const attachResult = await attachPaymentMethodToCustomer(id, customerId as string);

    if (!attachResult.success) {
      return res.status(500).json(buildErrorPayload('STRIPE_ERROR', attachResult.error));
    }

    res.json({
      success: true,
      paymentMethod: attachResult.paymentMethod,
    });
  } catch (error) {
    console.error('Erro ao anexar Payment Method:', error);
    res.status(500).json(buildErrorPayload('INTERNAL_ERROR', 'Erro interno do servidor'));
  }
});

// Desanexar Payment Method
router.delete('/methods/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const detachResult = await detachPaymentMethod(id);

    if (!detachResult.success) {
      return res.status(500).json(buildErrorPayload('STRIPE_ERROR', detachResult.error));
    }

    res.json({
      success: true,
      paymentMethod: detachResult.paymentMethod,
    });
  } catch (error) {
    console.error('Erro ao desanexar Payment Method:', error);
    res.status(500).json(buildErrorPayload('INTERNAL_ERROR', 'Erro interno do servidor'));
  }
});

// Definir Payment Method padrão
router.post('/methods/:id/default', async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'Customer ID obrigatório'));
    }

    const setDefaultResult = await setDefaultPaymentMethod(customerId as string, id);

    if (!setDefaultResult.success) {
      return res.status(500).json(buildErrorPayload('STRIPE_ERROR', setDefaultResult.error));
    }

    res.json({
      success: true,
      customer: setDefaultResult.customer,
    });
  } catch (error) {
    console.error('Erro ao definir Payment Method padrão:', error);
    res.status(500).json(buildErrorPayload('INTERNAL_ERROR', 'Erro interno do servidor'));
  }
});

// Reembolsar pagamento
router.post('/refund', async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.query;

    if (!paymentIntentId) {
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'Payment Intent ID obrigatório'));
    }

    const refundResult = await refundPayment(
      paymentIntentId as string,
      amount ? Number(amount) : undefined
    );

    if (!refundResult.success) {
      return res.status(500).json(buildErrorPayload('STRIPE_ERROR', refundResult.error));
    }

    res.json({
      success: true,
      refund: refundResult.refund,
    });
  } catch (error) {
    console.error('Erro ao reembolsar pagamento:', error);
    res.status(500).json(buildErrorPayload('INTERNAL_ERROR', 'Erro interno do servidor'));
  }
});

// Buscar Payment Intent
router.get('/intent/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const paymentIntentResult = await getPaymentIntent(id);

    if (!paymentIntentResult.success) {
      return res.status(500).json(buildErrorPayload('STRIPE_ERROR', paymentIntentResult.error));
    }

    res.json({
      success: true,
      paymentIntent: paymentIntentResult.paymentIntent,
    });
  } catch (error) {
    console.error('Erro ao buscar Payment Intent:', error);
    res.status(500).json(buildErrorPayload('INTERNAL_ERROR', 'Erro interno do servidor'));
  }
});

// Criar Setup Intent para salvar métodos de pagamento
router.post('/create-setup-intent', async (req, res) => {
  try {
    const { customerId } = req.query;
    const user = req.user;

    // Verificar se o usuário tem um customer ID no Stripe
    let targetCustomerId = customerId as string || user.stripeCustomerId;
    
    // Se não tem customer ID, criar um
    if (!targetCustomerId) {
      const customerResult = await createCustomer(user.email, user.fullName);
      if (!customerResult.success) {
        return res.status(500).json(buildErrorPayload('STRIPE_ERROR', 'Erro ao criar customer'));
      }
      
      // Salvar customer ID no usuário
      await User.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerResult.customer.id }
      });
      targetCustomerId = customerResult.customer.id;
    }

    const setupIntentResult = await createSetupIntent(targetCustomerId);

    if (!setupIntentResult.success) {
      return res.status(500).json(buildErrorPayload('STRIPE_ERROR', setupIntentResult.error));
    }

    res.json({
      success: true,
      setupIntent: setupIntentResult.setupIntent,
    });
  } catch (error) {
    console.error('Erro ao criar Setup Intent:', error);
    res.status(500).json(buildErrorPayload('INTERNAL_ERROR', 'Erro interno do servidor'));
  }
});

// Criar Payment Method no Stripe
router.post('/create-payment-method', async (req, res) => {
  try {
    const { card, billing_details } = req.body;
    const user = req.user;

    if (!card || !card.number || !card.exp_month || !card.exp_year || !card.cvc) {
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'Dados do cartão obrigatórios'));
    }

    // Verificar se o usuário tem um customer ID no Stripe
    let customerId = user.stripeCustomerId;
    
    // Se não tem customer ID, criar um
    if (!customerId) {
      const customerResult = await createCustomer(user.email, user.fullName);
      if (!customerResult.success) {
        return res.status(500).json(buildErrorPayload('STRIPE_ERROR', 'Erro ao criar customer'));
      }
      
      // Salvar customer ID no usuário
      await User.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerResult.customer.id }
      });
      customerId = customerResult.customer.id;
    }

    // Criar Payment Method no Stripe
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: card.number,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        cvc: card.cvc,
      },
      billing_details: billing_details || {
        name: user.fullName,
        email: user.email,
      },
    });

    res.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        },
        billing_details: paymentMethod.billing_details,
      },
    });
  } catch (error) {
    console.error('Erro ao criar Payment Method:', error);
    res.status(500).json(buildErrorPayload('STRIPE_ERROR', error.message || 'Erro ao criar Payment Method'));
  }
});

// Criar Payment Intent no Stripe
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'eur', orderId, paymentMethodId } = req.body;
    const user = req.user;

    if (!amount) {
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'Amount obrigatório'));
    }

    // Verificar se o usuário tem um customer ID no Stripe
    let customerId = user.stripeCustomerId;
    
    // Se não tem customer ID, criar um
    if (!customerId) {
      const customerResult = await createCustomer(user.email, user.fullName);
      if (!customerResult.success) {
        return res.status(500).json(buildErrorPayload('STRIPE_ERROR', 'Erro ao criar customer'));
      }
      
      // Salvar customer ID no usuário
      await User.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerResult.customer.id }
      });
      customerId = customerResult.customer.id;
    }

    // Criar Payment Intent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100), // Stripe usa centavos
      currency,
      customer: customerId,
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      metadata: {
        user_id: user.id,
        order_id: orderId || `order_${Date.now()}`,
        source: paymentMethodId ? 'system_card' : 'stripe_elements',
      },
    });

    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        client_secret: paymentIntent.client_secret,
        metadata: paymentIntent.metadata,
      },
    });
  } catch (error) {
    console.error('Erro ao criar Payment Intent:', error);
    res.status(500).json(buildErrorPayload('STRIPE_ERROR', error.message || 'Erro ao criar Payment Intent'));
  }
});

// Criar sessão de checkout do Stripe
router.post('/create-checkout-session', authenticate, async (req, res) => {
  try {
    console.log('🛒 Criando sessão de checkout do Stripe');
    
    const { amount, currency = 'eur', orderId, successUrl, cancelUrl } = req.body;
    const user = req.authUser;

    if (!user) {
      console.error('❌ Usuário não autenticado');
      return res.status(401).json(buildErrorPayload('UNAUTHORIZED', 'Usuário não autenticado'));
    }

    if (!amount) {
      console.error('❌ Amount não fornecido');
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'Amount obrigatório'));
    }

    console.log('👤 Usuário:', user.email);
    console.log('💰 Valor:', amount, currency);

    // Verificar se o usuário tem um customer ID no Stripe
    let customerId = res.locals.authUser.stripeCustomerId;
    
    // Se não tem customer ID, criar um
    if (!customerId) {
      console.log('👤 Criando customer no Stripe...');
      const customerResult = await createCustomer(user.email, res.locals.authUser.fullName);
      if (!customerResult.success) {
        console.error('❌ Erro ao criar customer:', customerResult.error);
        return res.status(500).json(buildErrorPayload('STRIPE_ERROR', 'Erro ao criar customer'));
      }
      
      // Salvar customer ID no usuário
      await User.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerResult.customer.id }
      });
      customerId = customerResult.customer.id;
      console.log('✅ Customer criado:', customerId);
    } else {
      console.log('👤 Usando customer existente:', customerId);
    }

    // Criar sessão de checkout do Stripe
    console.log('🛒 Criando sessão de checkout...');
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `Pedido ${orderId || 'AmaDelivery'}`,
              description: 'Pedido de delivery',
            },
            unit_amount: Math.round(parseFloat(amount) * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pedido-confirmado?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?canceled=true`,
      metadata: {
        user_id: user.id,
        order_id: orderId || `order_${Date.now()}`,
        amount: amount,
        currency: currency,
      },
    });

    console.log('✅ Sessão de checkout criada:', session.id);

    res.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      message: 'Sessão de checkout criada com sucesso',
    });
  } catch (error) {
    console.error('❌ Erro ao criar sessão de checkout:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json(buildErrorPayload('STRIPE_ERROR', error.message || 'Erro ao criar sessão de checkout'));
  }
});

// Rota de teste para debug do endereço
router.post('/test-address', authenticate, async (req, res) => {
  try {
    console.log('🧪 TESTE: Verificando dados do endereço');
    console.log('📥 Request body completo:', JSON.stringify(req.body, null, 2));
    
    const { addressData } = req.body;
    
    console.log('🏠 Address data recebido:', addressData);
    console.log('🔍 Debug detalhado do endereço:', {
      endereco: addressData?.endereco,
      cidade: addressData?.cidade,
      codigoPostal: addressData?.codigoPostal,
      numero: addressData?.numero,
      complemento: addressData?.complemento,
      tipoEndereco: typeof addressData,
      temEndereco: !!addressData?.endereco,
      temCidade: !!addressData?.cidade,
      temNumero: !!addressData?.numero,
      temComplemento: !!addressData?.complemento,
      camposPresentes: Object.keys(addressData || {})
    });
    
    res.json({
      success: true,
      message: 'Dados do endereço recebidos',
      addressData: addressData,
      debug: {
        endereco: addressData?.endereco,
        cidade: addressData?.cidade,
        codigoPostal: addressData?.codigoPostal,
        numero: addressData?.numero,
        complemento: addressData?.complemento
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no teste de endereço:', error);
    res.status(500).json(buildErrorPayload('TEST_ERROR', error.message || 'Erro no teste de endereço'));
  }
});

// Rota de teste para debug
router.post('/test-save-order', authenticate, async (req, res) => {
  try {
    console.log('🧪 TESTE: Salvando pedido no banco de dados');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    
    const user = req.authUser;
    console.log('👤 Usuário:', user.email);
    
    // Buscar um restaurante existente ou criar um de teste
    let restaurantId = 'test-restaurant-id';
    
    try {
      // Tentar buscar um restaurante existente
      const existingRestaurant = await prisma.restaurant.findFirst();
      if (existingRestaurant) {
        restaurantId = existingRestaurant.id;
        console.log('✅ Usando restaurante existente:', restaurantId);
      } else {
        // Criar um restaurante de teste se não existir nenhum
        console.log('🏪 Criando restaurante de teste...');
        const testRestaurant = await prisma.restaurant.create({
          data: {
            nome: 'Restaurante Teste',
            descricao: 'Restaurante para testes',
            categoria: 'Teste',
            endereco: 'Rua Teste, 123',
            cidade: 'Lisboa',
            codigoPostal: '1000-001',
            telefone: '123456789',
            email: 'teste@restaurante.com',
            taxaEntrega: 2.50,
            tempoPreparo: 30,
            status: 'ativo'
          }
        });
        restaurantId = testRestaurant.id;
        console.log('✅ Restaurante de teste criado:', restaurantId);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar/criar restaurante:', error);
      return res.status(500).json(buildErrorPayload('DATABASE_ERROR', 'Erro ao buscar restaurante'));
    }
    
    // Dados de teste
    const testOrderData = {
      numeroPedido: `#TEST${Date.now().toString().slice(-6)}`,
      status: 'confirmado',
      clienteNome: 'Cliente Teste',
      clienteEmail: user.email,
      clienteTelefone: '123456789',
      enderecoEntrega: {
        endereco: 'Rua Teste, 123',
        cidade: 'Lisboa',
        codigoPostal: '1000-001',
        numero: '123',
        complemento: ''
      },
      itens: [{
        itemId: 'test-item-1',
        nome: 'Item Teste',
        precoUnitario: 10.50,
        quantidade: 2,
        observacoes: 'Sem cebola',
        adicionais_selecionados: ['Queijo extra', 'Bacon'],
        personalizacoes: {
          'Tamanho': 'Grande',
          'Tempero': 'Picante'
        },
        ingredientes_removidos: ['Cebola', 'Tomate'],
        preco_personalizacoes: 3.50,
        subtotal: 24.50
      }],
      subtotal: 24.50,
      taxaEntrega: 2.50,
      taxaServico: 0.50,
      total: 27.50,
      metodoPagamento: 'stripe',
      stripePaymentIntentId: 'pi_test_123',
      observacoes: 'Pedido de teste',
      restaurantId: restaurantId
    };
    
    console.log('📋 Dados do pedido de teste:', testOrderData);
    
    const order = await Order.create({
      data: testOrderData
    });
    
    console.log('✅ Pedido de teste salvo:', order.id);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.total,
        numeroPedido: order.numeroPedido
      },
      message: 'Pedido de teste salvo com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao salvar pedido de teste:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json(buildErrorPayload('DATABASE_ERROR', error.message || 'Erro ao salvar pedido de teste'));
  }
});

// Salvar pedido após pagamento bem-sucedido
router.post('/save-order', authenticate, async (req, res) => {
  try {
    console.log('💾 Salvando pedido no banco de dados');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      sessionId, 
      orderData, 
      customerData, 
      addressData, 
      cartItems, 
      totalAmount 
    } = req.body;
    
    const user = req.authUser;
    
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return res.status(401).json(buildErrorPayload('UNAUTHORIZED', 'Usuário não autenticado'));
    }
    
    console.log('👤 Usuário:', user.email);
    console.log('🛒 Dados do pedido:', { sessionId, totalAmount });
    console.log('📋 Order data:', orderData);
    console.log('👥 Customer data:', customerData);
    console.log('🏠 Address data:', addressData);
    console.log('🛒 Cart items:', cartItems);
    
    // Debug específico do endereço
    console.log('🔍 Debug endereço:', {
      endereco: addressData.endereco,
      cidade: addressData.cidade,
      codigoPostal: addressData.codigoPostal,
      numero: addressData.numero,
      complemento: addressData.complemento,
      bairro: addressData.bairro,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      referencia: addressData.referencia,
      nomeEndereco: addressData.nomeEndereco,
      temEndereco: !!addressData.endereco,
      temCidade: !!addressData.cidade,
      temNumero: !!addressData.numero,
      temComplemento: !!addressData.complemento,
      temBairro: !!addressData.bairro,
      temCoordenadas: !!(addressData.latitude && addressData.longitude),
      camposPresentes: Object.keys(addressData || {})
    });
    
    // Verificar se a sessão do Stripe foi bem-sucedida
    console.log('🔍 Verificando sessão do Stripe:', sessionId);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log('🔍 Status da sessão:', session.payment_status);
    
    if (session.payment_status !== 'paid') {
      console.error('❌ Pagamento não foi bem-sucedido:', session.payment_status);
      return res.status(400).json(buildErrorPayload('PAYMENT_ERROR', 'Pagamento não foi bem-sucedido'));
    }
    
    console.log('✅ Pagamento confirmado:', session.payment_status);
    
    // Criar pedido no banco de dados
    console.log('💾 Criando pedido no banco de dados...');
    
    // Gerar número do pedido
    const numeroPedido = `#${Date.now().toString().slice(-8)}`;
    
    // Preparar dados do pedido conforme schema do Prisma
    const orderDataForDB = {
      numeroPedido: numeroPedido,
      status: 'pendente',
      clienteNome: customerData.nome,
      clienteEmail: user.email,
      clienteTelefone: customerData.telefone,
      enderecoEntrega: {
        id: addressData.id || `addr_${Date.now()}`,
        cep: addressData.codigoPostal,
        rua: addressData.endereco,
        nome: addressData.nomeEndereco || 'Endereço de Entrega',
        bairro: addressData.bairro || '',
        cidade: addressData.cidade,
        numero: addressData.numero || '',
        latitude: addressData.latitude || null,
        longitude: addressData.longitude || null,
        referencia: addressData.referencia || '',
        complemento: addressData.complemento || ''
      },
      itens: cartItems.map(item => ({
        itemId: item.menuItemId,
        nome: item.name,
        precoUnitario: item.price,
        quantidade: item.quantity,
        observacoes: item.observacoes || '',
        adicionais_selecionados: item.adicionais || [],
        personalizacoes: item.personalizacoes || {},
        ingredientes_removidos: item.ingredientes_removidos || [],
        preco_personalizacoes: item.preco_personalizacoes || 0,
        subtotal: item.subtotal
      })),
      // Calcular taxa de serviço baseada no método de pagamento
      subtotal: totalAmount * 0.98, // Aproximação
      taxaEntrega: totalAmount * 0.02, // Aproximação
      taxaServico: orderData.metodoPagamento === 'stripe' ? totalAmount * 0.0335 + 0.25 : totalAmount * 0.02,
      total: totalAmount,
      metodoPagamento: 'stripe',
      stripePaymentIntentId: session.payment_intent,
      observacoes: orderData.observacoes || '',
      restaurantId: orderData.restaurantId
    };
    
    console.log('📋 Dados do pedido para o banco:', orderDataForDB);
    
    const order = await Order.create({
      data: orderDataForDB
    });
    
    console.log('✅ Pedido salvo:', order.id);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        totalAmount: order.total,
        numeroPedido: order.numeroPedido,
        stripePaymentIntentId: order.stripePaymentIntentId
      },
      message: 'Pedido salvo com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao salvar pedido:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json(buildErrorPayload('DATABASE_ERROR', error.message || 'Erro ao salvar pedido'));
  }
});

// Verificar sessão de checkout do Stripe
router.post('/verify-session', authenticate, async (req, res) => {
  try {
    console.log('🔍 Verificando sessão do Stripe');
    
    const { sessionId } = req.body;
    const user = req.authUser;

    if (!sessionId) {
      console.error('❌ Session ID não fornecido');
      return res.status(400).json(buildErrorPayload('VALIDATION_ERROR', 'Session ID obrigatório'));
    }

    console.log('🔍 Session ID:', sessionId);
    console.log('👤 Usuário:', user?.email);

    // Buscar sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId as string);

    console.log('✅ Sessão encontrada:', {
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_email,
      metadata: session.metadata
    });

    res.json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email,
        metadata: session.metadata,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao verificar sessão:', error);
    res.status(500).json(buildErrorPayload('STRIPE_ERROR', error.message || 'Erro ao verificar sessão'));
  }
});

// Webhook do Stripe (sem autenticação)
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    console.log('Webhook signature ou secret não encontrado');
    return res.status(400).send('Webhook signature ou secret não encontrado');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Processar o evento
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        
        // ✅ CORREÇÃO: Atualizar status do pedido no banco de dados
        if (paymentIntent.metadata?.orderId) {
          try {
            // Buscar pedido pelo ID do metadata
            const order = await Order.findFirst({
              where: { 
                OR: [
                  { id: paymentIntent.metadata.orderId },
                  { numeroPedido: paymentIntent.metadata.orderId }
                ]
              }
            });
            
            if (order) {
              // Atualizar status do pedido para "pendente" (pronto para o restaurante)
              await Order.update({
                where: { id: order.id },
                data: { 
                  status: 'pendente',
                  valorPago: paymentIntent.amount / 100, // Converter centavos para euros
                  stripePaymentIntentId: paymentIntent.id
                }
              });
              
              console.log('✅ Pedido atualizado para "pendente":', order.id);
            } else {
              console.log('⚠️ Pedido não encontrado:', paymentIntent.metadata.orderId);
            }
          } catch (error) {
            console.error('❌ Erro ao atualizar pedido:', error);
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('PaymentIntent failed:', failedPayment.id);
        
        // ✅ CORREÇÃO: Atualizar status do pedido para "falha no pagamento"
        if (failedPayment.metadata?.orderId) {
          try {
            // Buscar pedido pelo ID do metadata
            const order = await Order.findFirst({
              where: { 
                OR: [
                  { id: failedPayment.metadata.orderId },
                  { numeroPedido: failedPayment.metadata.orderId }
                ]
              }
            });
            
            if (order) {
              // Atualizar status do pedido para "cancelado"
              await Order.update({
                where: { id: order.id },
                data: { 
                  status: 'cancelado',
                  stripePaymentIntentId: failedPayment.id
                }
              });
              
              console.log('❌ Pedido cancelado por falha no pagamento:', order.id);
            } else {
              console.log('⚠️ Pedido não encontrado:', failedPayment.metadata.orderId);
            }
          } catch (error) {
            console.error('❌ Erro ao atualizar pedido:', error);
          }
        }
        break;

      case 'setup_intent.succeeded':
        const setupIntent = event.data.object;
        console.log('SetupIntent succeeded:', setupIntent.id);
        
        // Aqui você pode confirmar que o método de pagamento foi salvo
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

export default router;
