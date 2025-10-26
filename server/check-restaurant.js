// Script para verificar o restaurante do pedido
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRestaurant() {
  try {
    const order = await prisma.order.findFirst({
      where: { numeroPedido: '#38535576' },
      include: { restaurant: true }
    });
    
    if (!order) {
      console.log('❌ Pedido não encontrado');
      return;
    }
    
    console.log('🔍 Pedido encontrado:');
    console.log('ID:', order.id);
    console.log('Restaurante ID:', order.restaurantId);
    console.log('Restaurante Nome:', order.restaurant.nome);
    console.log('Status:', order.status);
    
    // Verificar se há outros pedidos do mesmo restaurante
    const restaurantOrders = await prisma.order.findMany({
      where: { restaurantId: order.restaurantId },
      select: { id: true, numeroPedido: true, status: true, createdDate: true }
    });
    
    console.log('\n📋 Todos os pedidos deste restaurante:');
    restaurantOrders.forEach(o => {
      console.log(`- ${o.numeroPedido} (${o.status}) - ${o.createdDate}`);
    });
    
    // Verificar se há pedidos pendentes deste restaurante
    const pendingOrders = await prisma.order.findMany({
      where: { 
        restaurantId: order.restaurantId,
        status: 'pendente'
      },
      select: { id: true, numeroPedido: true, createdDate: true }
    });
    
    console.log(`\n🔍 Pedidos pendentes deste restaurante: ${pendingOrders.length}`);
    pendingOrders.forEach(o => {
      console.log(`- ${o.numeroPedido} - ${o.createdDate}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRestaurant();
