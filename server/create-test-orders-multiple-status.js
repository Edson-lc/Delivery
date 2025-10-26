import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestOrdersMultipleStatus() {
  try {
    console.log('🍕 Criando pedidos de teste com diferentes status...');

    // Encontrar um restaurante existente
    const restaurant = await prisma.restaurant.findFirst({
      select: { id: true, nome: true, endereco: true }
    });

    if (!restaurant) {
      console.error('❌ Nenhum restaurante encontrado. Crie um restaurante primeiro.');
      return;
    }

    console.log('🏪 Restaurante encontrado:', restaurant.nome);

    // Encontrar um entregador existente
    const entregador = await prisma.entregador.findFirst({
      select: { id: true, nomeCompleto: true }
    });

    if (!entregador) {
      console.error('❌ Nenhum entregador encontrado. Crie um entregador primeiro.');
      return;
    }

    console.log('🚚 Entregador encontrado:', entregador.nomeCompleto);

    // Criar pedidos com diferentes status
    const testOrders = [
      {
        numeroPedido: `CONCLUIDO-${Date.now()}`,
        clienteNome: 'Maria Silva',
        clienteEmail: 'maria.silva@example.com',
        clienteTelefone: '912345678',
        enderecoEntrega: {
          rua: 'Rua das Flores',
          numero: '25',
          cidade: 'Porto',
          cep: '4000-000'
        },
        itens: [{ nome: 'Pizza Margherita', quantidade: 1, precoUnitario: 12.50 }],
        subtotal: 12.50,
        taxaEntrega: 3.50,
        total: 16.00,
        metodoPagamento: 'cartao',
        status: 'entregue', // Status concluído
        entregadorId: entregador.id,
        observacoes: 'Pedido entregue com sucesso'
      },
      {
        numeroPedido: `CANCELADO-${Date.now()}`,
        clienteNome: 'João Santos',
        clienteEmail: 'joao.santos@example.com',
        clienteTelefone: '912345679',
        enderecoEntrega: {
          rua: 'Rua do Comércio',
          numero: '100',
          cidade: 'Porto',
          cep: '4000-001'
        },
        itens: [{ nome: 'Hambúrguer', quantidade: 1, precoUnitario: 8.50 }],
        subtotal: 8.50,
        taxaEntrega: 2.50,
        total: 11.00,
        metodoPagamento: 'dinheiro',
        status: 'cancelado', // Status cancelado
        observacoes: 'Cliente cancelou o pedido'
      },
      {
        numeroPedido: `EM_ANDAMENTO-${Date.now()}`,
        clienteNome: 'Ana Costa',
        clienteEmail: 'ana.costa@example.com',
        clienteTelefone: '912345680',
        enderecoEntrega: {
          rua: 'Avenida Central',
          numero: '50',
          cidade: 'Porto',
          cep: '4000-002'
        },
        itens: [{ nome: 'Salada', quantidade: 1, precoUnitario: 6.50 }],
        subtotal: 6.50,
        taxaEntrega: 2.00,
        total: 8.50,
        metodoPagamento: 'cartao',
        status: 'aceito', // Status em andamento
        entregadorId: entregador.id,
        observacoes: 'Pedido aceito pelo entregador'
      }
    ];

    for (const orderData of testOrders) {
      const order = await prisma.order.create({
        data: {
          ...orderData,
          restaurantId: restaurant.id,
          enderecoEntrega: orderData.enderecoEntrega,
          itens: orderData.itens,
        },
        select: {
          id: true,
          numeroPedido: true,
          status: true,
          clienteNome: true,
          total: true,
          taxaEntrega: true,
          restaurant: { select: { nome: true } }
        }
      });

      console.log(`✅ Pedido ${order.status} criado:`, {
        id: order.id,
        numeroPedido: order.numeroPedido,
        restaurante: order.restaurant?.nome,
        cliente: order.clienteNome,
        total: order.total,
        taxaEntrega: order.taxaEntrega,
        status: order.status
      });
    }

    console.log('\n📋 Pedidos criados com sucesso!');
    console.log('Agora você pode testar os filtros na página EntregasRecentes:');
    console.log('- Tab "Concluídas": deve mostrar pedidos com status "entregue"');
    console.log('- Tab "Canceladas": deve mostrar pedidos com status "cancelado"');
    console.log('- Tab "Em Andamento": deve mostrar pedidos com status "aceito"');

  } catch (error) {
    console.error('❌ Erro ao criar pedidos de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createTestOrdersMultipleStatus();
}

export { createTestOrdersMultipleStatus };
