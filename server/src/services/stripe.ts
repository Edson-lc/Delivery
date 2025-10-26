import Stripe from 'stripe';
import { env } from '../env';

// Inicializar Stripe
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Tipos para os dados de pagamento
export interface PaymentIntentData {
  amount: number;
  currency: string;
  customerId?: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
}

export interface PaymentMethodData {
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  name: string;
}

// Criar Payment Intent
export async function createPaymentIntent(data: PaymentIntentData) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Stripe usa centavos
      currency: data.currency || 'eur',
      customer: data.customerId,
      payment_method: data.paymentMethodId,
      metadata: data.metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    };
  } catch (error) {
    console.error('Erro ao criar Payment Intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Confirmar Payment Intent
export async function confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    };
  } catch (error) {
    console.error('Erro ao confirmar Payment Intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Criar Payment Method
export async function createPaymentMethod(data: PaymentMethodData) {
  try {
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: data.cardNumber,
        exp_month: data.expMonth,
        exp_year: data.expYear,
        cvc: data.cvc,
      },
      billing_details: {
        name: data.name,
      },
    });

    return {
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: {
          brand: paymentMethod.card?.brand,
          last4: paymentMethod.card?.last4,
          exp_month: paymentMethod.card?.exp_month,
          exp_year: paymentMethod.card?.exp_year,
        },
      },
    };
  } catch (error) {
    console.error('Erro ao criar Payment Method:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Criar Customer
export async function createCustomer(email: string, name: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
    });

    return {
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
    };
  } catch (error) {
    console.error('Erro ao criar Customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Listar Payment Methods do Customer
export async function getCustomerPaymentMethods(customerId: string) {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return {
      success: true,
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: {
          brand: pm.card?.brand,
          last4: pm.card?.last4,
          exp_month: pm.card?.exp_month,
          exp_year: pm.card?.exp_year,
        },
      })),
    };
  } catch (error) {
    console.error('Erro ao listar Payment Methods:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Anexar Payment Method ao Customer
export async function attachPaymentMethodToCustomer(paymentMethodId: string, customerId: string) {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return {
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        customer: paymentMethod.customer,
      },
    };
  } catch (error) {
    console.error('Erro ao anexar Payment Method:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Desanexar Payment Method
export async function detachPaymentMethod(paymentMethodId: string) {
  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

    return {
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        detached: true,
      },
    };
  } catch (error) {
    console.error('Erro ao desanexar Payment Method:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Definir Payment Method padrão
export async function setDefaultPaymentMethod(customerId: string, paymentMethodId: string) {
  try {
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return {
      success: true,
      customer: {
        id: customer.id,
        default_payment_method: customer.invoice_settings?.default_payment_method,
      },
    };
  } catch (error) {
    console.error('Erro ao definir Payment Method padrão:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Reembolsar pagamento
export async function refundPayment(paymentIntentId: string, amount?: number) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Stripe usa centavos
    });

    return {
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        payment_intent: refund.payment_intent,
      },
    };
  } catch (error) {
    console.error('Erro ao reembolsar pagamento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Verificar status do Payment Intent
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        client_secret: paymentIntent.client_secret,
        metadata: paymentIntent.metadata,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar Payment Intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Criar Setup Intent para salvar métodos de pagamento
export async function createSetupIntent(customerId: string) {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    return {
      success: true,
      setupIntent: {
        id: setupIntent.id,
        client_secret: setupIntent.client_secret,
        status: setupIntent.status,
        customer: setupIntent.customer,
      },
    };
  } catch (error) {
    console.error('Erro ao criar Setup Intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Sincronizar cartões do Stripe com o sistema existente
export async function syncStripeCardsWithUser(userId: string, customerId: string) {
  try {
    // Buscar cartões do Stripe
    const stripeCardsResult = await getCustomerPaymentMethods(customerId);
    
    if (!stripeCardsResult.success) {
      return {
        success: false,
        error: stripeCardsResult.error,
      };
    }

    // Converter cartões do Stripe para o formato do sistema existente
    const syncedCards = stripeCardsResult.paymentMethods.map(card => ({
      id: `stripe_${card.id}`,
      tipo: 'stripe_card',
      bandeira: card.card.brand,
      final_cartao: card.card.last4,
      nome_titular: 'Cartão Stripe', // Stripe não fornece nome do titular
      validade: `${card.card.exp_month.toString().padStart(2, '0')}/${card.card.exp_year.toString().slice(-2)}`,
      stripe_payment_method_id: card.id,
      stripe_card_id: card.id,
      // Campos específicos do Stripe
      stripe_brand: card.card.brand,
      stripe_last4: card.card.last4,
      stripe_exp_month: card.card.exp_month,
      stripe_exp_year: card.card.exp_year,
    }));

    return {
      success: true,
      cards: syncedCards,
    };
  } catch (error) {
    console.error('Erro ao sincronizar cartões do Stripe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Processar pagamento com cartão do sistema usando Stripe
export async function processPaymentWithSystemCard(cardData: any, amount: number, currency: string = 'eur', customerId?: string) {
  try {
    // Verificar se temos todos os dados necessários
    if (!cardData.numero_cartao || !cardData.cvc || !cardData.validade || !cardData.nome_titular) {
      return {
        success: false,
        error: 'Dados do cartão incompletos. Por favor, adicione o cartão novamente com todos os dados.',
      };
    }

    console.log('Processando pagamento com cartão do sistema:', {
      cardId: cardData.id,
      bandeira: cardData.bandeira,
      final_cartao: cardData.final_cartao,
      nome_titular: cardData.nome_titular,
      amount: amount,
      currency: currency
    });

    // Criar Payment Method no Stripe usando dados completos do cartão
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: cardData.numero_cartao,
        exp_month: parseInt(cardData.validade.split('/')[0]),
        exp_year: parseInt('20' + cardData.validade.split('/')[1]),
        cvc: cardData.cvc,
      },
      billing_details: {
        name: cardData.nome_titular,
      },
    });

    // Criar Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency,
      payment_method: paymentMethod.id,
      confirmation_method: 'manual',
      confirm: true,
      customer: customerId,
      metadata: {
        source: 'system_card',
        card_id: cardData.id,
        bandeira: cardData.bandeira,
        final_cartao: cardData.final_cartao,
        nome_titular: cardData.nome_titular,
      },
    });

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_method: paymentMethod.id,
        metadata: paymentIntent.metadata,
      },
    };
  } catch (error) {
    console.error('Erro ao processar pagamento com cartão do sistema:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}