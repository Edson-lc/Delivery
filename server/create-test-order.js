import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestOrder() {
  try {
    console.log('🍕 Criando pedido de teste...');
    
    // Buscar um restaurante
    const restaurant = await prisma.restaurant.findFirst({
      where: { status: 'ativo' }
    });
    
    if (!restaurant) {
      console.log('❌ Nenhum restaurante ativo encontrado');
      return;
    }
    
    console.log('🏪 Restaurante encontrado:', restaurant.nome);
    
    // Criar pedido de teste
    const order = await prisma.order.create({
      data: {
        numeroPedido: `TEST-${Date.now()}`,
        status: 'pendente',
        clienteNome: 'João Silva',
        clienteEmail: 'joao@teste.com',
        clienteTelefone: '+351912345678',
        enderecoEntrega: {
          endereco: 'Rua das Flores, 123',
          cidade: 'Porto',
          codigoPostal: '4000-123',
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
        taxaEntrega: 3.50,
        taxaServico: 0,
        desconto: 0,
        total: 21.00,
        metodoPagamento: 'dinheiro',
        restaurantId: restaurant.id
      },
      include: {
        restaurant: true
      }
    });
    
    console.log('✅ Pedido criado:', {
      id: order.id,
      numeroPedido: order.numeroPedido,
      restaurante: order.restaurant.nome,
      cliente: order.clienteNome,
      total: order.total,
      status: order.status
    });
    
    console.log('\n📋 Próximos passos:');
    console.log('1. Faça login como restaurante');
    console.log('2. Aceite o pedido (status: confirmado)');
    console.log('3. Marque como pronto (status: pronto)');
    console.log('4. O sistema atribuirá automaticamente um entregador');
    console.log('5. Faça login como entregador para ver o pedido');
    
  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrder();
