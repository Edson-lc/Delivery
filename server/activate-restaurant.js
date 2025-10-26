// Script para verificar e ativar o restaurante
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function activateRestaurant() {
  try {
    console.log('🔍 Verificando status do restaurante...');
    
    const restaurantId = '6c0d64a6-1f89-46c7-ac91-f103c7a1d1c5'; // ID do AmaEats Central
    
    // Buscar o restaurante
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        nome: true,
        status: true,
        ativo: true
      }
    });
    
    if (!restaurant) {
      console.log('❌ Restaurante não encontrado');
      return;
    }
    
    console.log('🏪 Restaurante encontrado:');
    console.log('Nome:', restaurant.nome);
    console.log('Status:', restaurant.status);
    console.log('Ativo:', restaurant.ativo);
    
    // Ativar o restaurante se estiver inativo
    if (restaurant.status === 'inativo' || restaurant.ativo === false) {
      console.log('\n🔧 Ativando restaurante...');
      
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { 
          status: 'ativo',
          ativo: true
        }
      });
      
      console.log('✅ Restaurante ativado com sucesso!');
    } else {
      console.log('✅ Restaurante já está ativo');
    }
    
    // Verificar pedidos pendentes novamente
    const pendingOrders = await prisma.order.findMany({
      where: { 
        restaurantId: restaurantId,
        status: 'pendente'
      },
      select: {
        id: true,
        numeroPedido: true,
        clienteNome: true,
        total: true,
        createdDate: true
      }
    });
    
    console.log(`\n📋 Pedidos pendentes após ativação: ${pendingOrders.length}`);
    pendingOrders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.numeroPedido} - ${order.clienteNome} - €${order.total}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateRestaurant();
