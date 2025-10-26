const { PrismaClient } = require('@prisma/client');

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

    // Criar pedido concluído
    const orderConcluido = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
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
        status: 'entregue',
        entregadorId: entregador.id,
        observacoes: 'Pedido entregue com sucesso'
      }
    });

    console.log('✅ Pedido CONCLUÍDO criado:', orderConcluido.numeroPedido);

    // Criar pedido cancelado
    const orderCancelado = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
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
        status: 'cancelado',
        observacoes: 'Cliente cancelou o pedido'
      }
    });

    console.log('✅ Pedido CANCELADO criado:', orderCancelado.numeroPedido);

    // Criar pedido em andamento
    const orderAndamento = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
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
        status: 'aceito',
        entregadorId: entregador.id,
        observacoes: 'Pedido aceito pelo entregador'
      }
    });

    console.log('✅ Pedido EM ANDAMENTO criado:', orderAndamento.numeroPedido);

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

createTestOrdersMultipleStatus();
