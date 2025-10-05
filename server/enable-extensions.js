const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = 'postgresql://amadelivery:amadelivery@amadelivery.cro6yo4wqcvr.eu-south-2.rds.amazonaws.com:5432/amadelivery';
const prisma = new PrismaClient({ 
  datasources: { 
    db: { 
      url: DATABASE_URL 
    } 
  } 
});

async function enableExtensions() {
  try {
    console.log('🔍 Conectando ao banco amadelivery...');
    await prisma.$connect();
    
    console.log('📊 Habilitando extensão uuid-ossp...');
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    console.log('✅ Extensão uuid-ossp habilitada com sucesso!');
    
    console.log('📊 Verificando extensões disponíveis...');
    const extensions = await prisma.$queryRaw`
      SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp'
    `;
    console.log('✅ Extensões:', extensions);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

enableExtensions();
