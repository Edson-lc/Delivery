import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Verificando entregadores...');
    
    // Listar todos os entregadores
    const entregadores = await prisma.entregador.findMany({
      select: {
        id: true,
        nomeCompleto: true,
        email: true,
        aprovado: true
      }
    });
    
    console.log(`📋 Encontrados ${entregadores.length} entregadores:`);
    entregadores.forEach(entregador => {
      console.log(`  - ${entregador.nomeCompleto} (${entregador.email}) - Aprovado: ${entregador.aprovado}`);
    });
    
    // Aprovar todos os não aprovados
    const result = await prisma.entregador.updateMany({
      where: { aprovado: false },
      data: { aprovado: true }
    });
    
    console.log(`\n✅ ${result.count} entregadores aprovados!`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();