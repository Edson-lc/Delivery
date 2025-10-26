import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    console.log('🔍 Verificando usuários...');
    
    // Listar usuários com tipo entregador
    const users = await prisma.user.findMany({
      where: { tipoUsuario: 'entregador' },
      select: {
        id: true,
        fullName: true,
        email: true,
        tipoUsuario: true,
        status: true
      }
    });
    
    console.log(`📋 Usuários entregadores encontrados: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.fullName} (${user.email}) - Tipo: ${user.tipoUsuario} - Status: ${user.status}`);
    });
    
    // Verificar entregadores
    const entregadores = await prisma.entregador.findMany({
      select: {
        id: true,
        nomeCompleto: true,
        email: true,
        aprovado: true,
        userId: true
      }
    });
    
    console.log(`\n📋 Entregadores encontrados: ${entregadores.length}`);
    entregadores.forEach(entregador => {
      console.log(`  - ${entregador.nomeCompleto} (${entregador.email}) - Aprovado: ${entregador.aprovado} - UserId: ${entregador.userId}`);
    });
    
    // Verificar se há correspondência entre usuários e entregadores
    console.log('\n🔗 Verificando correspondências:');
    for (const user of users) {
      const entregador = entregadores.find(e => e.userId === user.id);
      if (entregador) {
        console.log(`  ✅ ${user.email} tem perfil de entregador aprovado: ${entregador.aprovado}`);
      } else {
        console.log(`  ❌ ${user.email} NÃO tem perfil de entregador`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
