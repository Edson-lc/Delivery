const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = 'postgresql://amadelivery:amadelivery@amadelivery.cro6yo4wqcvr.eu-south-2.rds.amazonaws.com:5432/postgres';
const prisma = new PrismaClient({ 
  datasources: { 
    db: { 
      url: DATABASE_URL 
    } 
  } 
});

async function createDatabase() {
  try {
    console.log('🔍 Conectando ao banco postgres...');
    await prisma.$connect();
    
    console.log('📊 Criando banco amadelivery...');
    await prisma.$executeRaw`CREATE DATABASE amadelivery`;
    console.log('✅ Banco amadelivery criado com sucesso!');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Banco amadelivery já existe!');
    } else {
      console.error('❌ Erro:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createDatabase();
