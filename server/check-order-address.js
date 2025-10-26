import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrderAddress() {
  try {
    console.log('🔍 Verificando endereços dos pedidos...');
    
    // Buscar pedidos recentes
    const orders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdDate: 'desc' },
      select: {
        id: true,
        numeroPedido: true,
        clienteNome: true,
        enderecoEntrega: true
      }
    });
    
    console.log(`📋 Encontrados ${orders.length} pedidos:`);
    
    orders.forEach((order, index) => {
      console.log(`\n${index + 1}. Pedido: ${order.numeroPedido}`);
      console.log(`   Cliente: ${order.clienteNome}`);
      console.log(`   Endereço (tipo): ${typeof order.enderecoEntrega}`);
      console.log(`   Endereço (valor):`, order.enderecoEntrega);
      
      if (typeof order.enderecoEntrega === 'object' && order.enderecoEntrega) {
        console.log(`   Endereço.endereco:`, order.enderecoEntrega.endereco);
        console.log(`   Endereço.cidade:`, order.enderecoEntrega.cidade);
        console.log(`   Endereço.codigoPostal:`, order.enderecoEntrega.codigoPostal);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrderAddress();
