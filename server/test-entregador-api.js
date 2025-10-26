import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testEntregadorAPI() {
  try {
    console.log('🔍 Testando API de entregadores...');
    
    // Simular uma requisição como entregador
    const user = await prisma.user.findFirst({
      where: { tipoUsuario: 'entregador' },
      select: {
        id: true,
        email: true,
        tipoUsuario: true,
        role: true
      }
    });
    
    if (!user) {
      console.log('❌ Nenhum usuário entregador encontrado');
      return;
    }
    
    console.log('👤 Usuário entregador:', user);
    
    // Buscar entregadores com user_id
    const entregadores = await prisma.entregador.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        nomeCompleto: true,
        email: true,
        aprovado: true,
        userId: true
      }
    });
    
    console.log('📋 Entregadores encontrados:', entregadores);
    
    // Verificar se o usuário tem permissão
    const allowedRoles = ['admin', 'entregador'];
    const hasAccess = allowedRoles.includes(user.tipoUsuario) || allowedRoles.includes(user.role);
    
    console.log('🔐 Tem acesso?', hasAccess);
    console.log('🎯 Roles permitidos:', allowedRoles);
    console.log('👤 Tipo do usuário:', user.tipoUsuario);
    console.log('👤 Role do usuário:', user.role);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEntregadorAPI();
