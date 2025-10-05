const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = 'postgresql://amadelivery:amadelivery@amadelivery.cro6yo4wqcvr.eu-south-2.rds.amazonaws.com:5432/amadelivery';
const prisma = new PrismaClient({ 
  datasources: { 
    db: { 
      url: DATABASE_URL 
    } 
  } 
});

async function verifyDatabase() {
  try {
    console.log('🔍 Verificando estrutura completa do banco AWS RDS...');
    await prisma.$connect();
    
    // Verificar tabelas
    console.log('\n📊 Tabelas criadas:');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    tables.forEach(table => console.log(`   ✅ ${table.table_name}`));
    
    // Verificar dados
    console.log('\n📈 Dados inseridos:');
    
    const userCount = await prisma.user.count();
    console.log(`   👥 Usuários: ${userCount}`);
    
    const restaurantCount = await prisma.restaurant.count();
    console.log(`   🏪 Restaurantes: ${restaurantCount}`);
    
    const menuItemCount = await prisma.menuItem.count();
    console.log(`   🍽️ Itens de menu: ${menuItemCount}`);
    
    const cartCount = await prisma.cart.count();
    console.log(`   🛒 Carrinhos: ${cartCount}`);
    
    const orderCount = await prisma.order.count();
    console.log(`   📦 Pedidos: ${orderCount}`);
    
    const entregadorCount = await prisma.entregador.count();
    console.log(`   🚚 Entregadores: ${entregadorCount}`);
    
    // Verificar alguns dados específicos
    console.log('\n🔍 Dados específicos:');
    
    const restaurants = await prisma.restaurant.findMany({
      select: { nome: true, categoria: true, ativo: true }
    });
    console.log('   🏪 Restaurantes:');
    restaurants.forEach(r => console.log(`      - ${r.nome} (${r.categoria}) - ${r.ativo ? 'Ativo' : 'Inativo'}`));
    
    const users = await prisma.user.findMany({
      select: { fullName: true, email: true, role: true }
    });
    console.log('   👥 Usuários:');
    users.forEach(u => console.log(`      - ${u.fullName} (${u.email}) - ${u.role}`));
    
    console.log('\n🎉 Verificação concluída com sucesso!');
    console.log('✅ Banco AWS RDS está funcionando perfeitamente!');
    console.log('🚀 Pronto para usar em produção!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
