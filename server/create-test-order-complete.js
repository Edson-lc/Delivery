import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestOrderWithDeliveryData() {
  try {
    console.log('🍕 Criando pedido de teste com dados completos...');
    
    // Buscar um restaurante
    const restaurant = await prisma.restaurant.findFirst({
      where: { status: 'ativo' }
    });
    
    if (!restaurant) {
      console.log('❌ Nenhum restaurante ativo encontrado');
      return;
    }
    
    console.log('🏪 Restaurante encontrado:', restaurant.nome);
    
    // Buscar um entregador
    const entregador = await prisma.entregador.findFirst({
      where: { aprovado: true }
    });
    
    if (!entregador) {
      console.log('❌ Nenhum entregador aprovado encontrado');
      return;
    }
    
    console.log('🚚 Entregador encontrado:', entregador.nomeCompleto);
    
    // Criar pedido de teste com dados completos
    const order = await prisma.order.create({
      data: {
        numeroPedido: `ENTREGUE-${Date.now()}`,
        status: 'entregue',
        clienteNome: 'Maria Silva',
        clienteEmail: 'maria@teste.com',
        clienteTelefone: '+351912345679',
        enderecoEntrega: {
          rua: 'Rua das Flores',
          numero: '123',
          cidade: 'Porto',
          cep: '4000-123',
          bairro: 'Centro',
          complemento: 'Apartamento 2B',
          referencia: 'Próximo ao mercado',
          latitude: 41.1579,
          longitude: -8.6291
        },
        itens: [
          {
            nome: 'Pizza Margherita',
            quantidade: 1,
            precoUnitario: 12.50,
            adicionais: []
          },
          {
            nome: 'Coca-Cola',
            quantidade: 2,
            precoUnitario: 2.50,
            adicionais: []
          }
        ],
        subtotal: 17.50,
        taxaEntrega: 4.50,
        taxaServico: 0,
        desconto: 0,
        total: 22.00,
        metodoPagamento: 'cartao',
        restaurantId: restaurant.id,
        entregadorId: entregador.id,
        dataEntrega: new Date(), // Data da entrega
        dataConfirmacao: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        tempoPreparo: 25,
        observacoes: 'Entregue com sucesso. Cliente satisfeito.'
      },
      include: {
        restaurant: true,
        entregador: true
      }
    });
    
    console.log('✅ Pedido criado com dados completos:', {
      id: order.id,
      numeroPedido: order.numeroPedido,
      restaurante: order.restaurant.nome,
      cliente: order.clienteNome,
      endereco: order.enderecoEntrega,
      total: order.total,
      taxaEntrega: order.taxaEntrega,
      status: order.status,
      dataEntrega: order.dataEntrega,
      entregador: order.entregador?.nomeCompleto
    });
    
    console.log('\n📋 Dados incluídos:');
    console.log('- ✅ Data da entrega:', order.dataEntrega);
    console.log('- ✅ Endereço completo do cliente');
    console.log('- ✅ Status: entregue');
    console.log('- ✅ Entregador atribuído');
    
  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrderWithDeliveryData();
