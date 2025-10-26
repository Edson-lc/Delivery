// Script para verificar pedidos no banco de dados
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrders() {
  try {
    console.log('🔍 Verificando pedidos no banco de dados...');
    
    // Buscar todos os pedidos recentes
    const orders = await prisma.order.findMany({
      orderBy: { createdDate: 'desc' },
      take: 10,
      select: {
        id: true,
        numeroPedido: true,
        status: true,
        clienteNome: true,
        total: true,
        metodoPagamento: true,
        valorPago: true,
        troco: true,
        createdDate: true,
        restaurantId: true,
        restaurant: {
          select: {
            nome: true
          }
        }
      }
    });
    
    console.log(`📋 Encontrados ${orders.length} pedidos recentes:`);
    
    orders.forEach((order, index) => {
      console.log(`\n${index + 1}. Pedido ${order.numeroPedido}:`);
      console.log(`   ID: ${order.id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Cliente: ${order.clienteNome}`);
      console.log(`   Total: €${order.total}`);
      console.log(`   Método Pagamento: ${order.metodoPagamento}`);
      console.log(`   Valor Pago: ${order.valorPago ? '€' + order.valorPago : 'N/A'}`);
      console.log(`   Troco: ${order.troco ? '€' + order.troco : 'N/A'}`);
      console.log(`   Restaurante: ${order.restaurant?.nome || 'N/A'}`);
      console.log(`   Data: ${order.createdDate}`);
    });
    
    // Buscar especificamente pedidos com status "pendente"
    const pendingOrders = await prisma.order.findMany({
      where: { status: 'pendente' },
      orderBy: { createdDate: 'desc' },
      select: {
        id: true,
        numeroPedido: true,
        clienteNome: true,
        total: true,
        createdDate: true,
        restaurantId: true
      }
    });
    
    console.log(`\n🔍 Pedidos com status "pendente": ${pendingOrders.length}`);
    pendingOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.numeroPedido} - ${order.clienteNome} - €${order.total}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar pedidos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
