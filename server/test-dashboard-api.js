// Script para testar a API do dashboard
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDashboardAPI() {
  try {
    console.log('🔍 Testando API do dashboard...');
    
    // Simular a busca que o dashboard faz
    const restaurantId = '6c0d64a6-1f89-46c7-ac91-f103c7a1d1c5'; // ID do AmaEats Central
    
    const orders = await prisma.order.findMany({
      where: { 
        restaurantId: restaurantId,
        status: 'pendente'
      },
      orderBy: { createdDate: 'desc' },
      take: 100,
      select: {
        id: true,
        numeroPedido: true,
        status: true,
        clienteNome: true,
        total: true,
        createdDate: true,
        restaurantId: true
      }
    });
    
    console.log(`📋 Pedidos encontrados para restaurante ${restaurantId}: ${orders.length}`);
    
    orders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.numeroPedido} - ${order.clienteNome} - €${order.total} - ${order.status}`);
    });
    
    // Verificar se há pedidos pendentes em geral
    const allPendingOrders = await prisma.order.findMany({
      where: { status: 'pendente' },
      orderBy: { createdDate: 'desc' },
      select: {
        id: true,
        numeroPedido: true,
        clienteNome: true,
        restaurantId: true,
        restaurant: {
          select: {
            nome: true
          }
        }
      }
    });
    
    console.log(`\n🔍 Todos os pedidos pendentes no sistema: ${allPendingOrders.length}`);
    allPendingOrders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.numeroPedido} - ${order.clienteNome} - ${order.restaurant.nome}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardAPI();
