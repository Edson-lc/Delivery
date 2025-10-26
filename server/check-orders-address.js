const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrdersWithAddress() {
  try {
    console.log('🔍 Verificando pedidos com endereço...');

    // Buscar todos os pedidos
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        numeroPedido: true,
        clienteNome: true,
        enderecoEntrega: true,
        status: true,
        entregadorId: true
      },
      take: 5
    });

    console.log(`📋 Encontrados ${orders.length} pedidos:`);
    
    orders.forEach((order, index) => {
      console.log(`\n${index + 1}. Pedido: ${order.numeroPedido}`);
      console.log(`   Cliente: ${order.clienteNome}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Entregador ID: ${order.entregadorId}`);
      console.log(`   Endereço:`, order.enderecoEntrega);
      console.log(`   Tipo do endereço:`, typeof order.enderecoEntrega);
    });

    // Verificar se há pedidos com entregador
    const ordersWithDriver = orders.filter(o => o.entregadorId);
    console.log(`\n🚚 Pedidos com entregador: ${ordersWithDriver.length}`);

    if (ordersWithDriver.length > 0) {
      console.log('\n📋 Pedidos que devem aparecer na página EntregasRecentes:');
      ordersWithDriver.forEach(order => {
        console.log(`- ${order.numeroPedido} (${order.clienteNome}) - Status: ${order.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao verificar pedidos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrdersWithAddress();
