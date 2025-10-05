const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showAllData() {
  try {
    console.log('📊 DADOS DO BANCO AWS RDS');
    console.log('=' .repeat(50));
    
    // Usuários
    console.log('\n👥 USUÁRIOS CADASTRADOS:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        telefone: true,
        createdDate: true
      }
    });
    users.forEach(user => {
      console.log(`  - ${user.fullName} (${user.email}) - ${user.role}`);
      console.log(`    Telefone: ${user.telefone || 'N/A'}`);
      console.log(`    Cadastrado: ${user.createdDate.toLocaleDateString()}`);
      console.log('');
    });
    
    // Restaurantes
    console.log('\n🏪 RESTAURANTES:');
    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        nome: true,
        categoria: true,
        ativo: true,
        rating: true,
        taxaEntrega: true
      }
    });
    restaurants.forEach(restaurant => {
      console.log(`  - ${restaurant.nome} (${restaurant.categoria})`);
      console.log(`    Status: ${restaurant.ativo ? 'Ativo' : 'Inativo'}`);
      console.log(`    Avaliação: ${restaurant.rating || 'N/A'}`);
      console.log(`    Taxa entrega: €${restaurant.taxaEntrega || '0'}`);
      console.log('');
    });
    
    // Itens de Menu
    console.log('\n🍽️ ITENS DE MENU:');
    const menuItems = await prisma.menuItem.findMany({
      select: {
        id: true,
        nome: true,
        categoria: true,
        preco: true,
        disponivel: true,
        restaurant: {
          select: { nome: true }
        }
      }
    });
    menuItems.forEach(item => {
      console.log(`  - ${item.nome} (${item.categoria})`);
      console.log(`    Restaurante: ${item.restaurant.nome}`);
      console.log(`    Preço: €${item.preco}`);
      console.log(`    Disponível: ${item.disponivel ? 'Sim' : 'Não'}`);
      console.log('');
    });
    
    // Pedidos
    console.log('\n📦 PEDIDOS REALIZADOS:');
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        numeroPedido: true,
        clienteNome: true,
        clienteEmail: true,
        total: true,
        status: true,
        createdDate: true,
        restaurant: {
          select: { nome: true }
        }
      },
      orderBy: { createdDate: 'desc' },
      take: 10
    });
    orders.forEach(order => {
      console.log(`  - Pedido ${order.numeroPedido}`);
      console.log(`    Cliente: ${order.clienteNome} (${order.clienteEmail})`);
      console.log(`    Restaurante: ${order.restaurant.nome}`);
      console.log(`    Total: €${order.total}`);
      console.log(`    Status: ${order.status}`);
      console.log(`    Data: ${order.createdDate.toLocaleDateString()}`);
      console.log('');
    });
    
    // Entregadores
    console.log('\n🚚 ENTREGADORES:');
    const entregadores = await prisma.entregador.findMany({
      select: {
        id: true,
        nomeCompleto: true,
        email: true,
        telefone: true,
        status: true,
        avaliacao: true,
        totalEntregas: true
      }
    });
    entregadores.forEach(entregador => {
      console.log(`  - ${entregador.nomeCompleto} (${entregador.email})`);
      console.log(`    Telefone: ${entregador.telefone}`);
      console.log(`    Status: ${entregador.status}`);
      console.log(`    Avaliação: ${entregador.avaliacao || 'N/A'}`);
      console.log(`    Total entregas: ${entregador.totalEntregas}`);
      console.log('');
    });
    
    // Estatísticas gerais
    console.log('\n📈 ESTATÍSTICAS GERAIS:');
    const stats = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM restaurants) as total_restaurants,
        (SELECT COUNT(*) FROM menu_items) as total_menu_items,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM entregadores) as total_entregadores,
        (SELECT COUNT(*) FROM carts) as total_carts
    `;
    
    console.log(`  - Total de usuários: ${stats[0].total_users}`);
    console.log(`  - Total de restaurantes: ${stats[0].total_restaurants}`);
    console.log(`  - Total de itens de menu: ${stats[0].total_menu_items}`);
    console.log(`  - Total de pedidos: ${stats[0].total_orders}`);
    console.log(`  - Total de entregadores: ${stats[0].total_entregadores}`);
    console.log(`  - Total de carrinhos: ${stats[0].total_carts}`);
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

showAllData();
