const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = 'postgresql://amadelivery:amadelivery@amadelivery.cro6yo4wqcvr.eu-south-2.rds.amazonaws.com:5432/amadelivery';
const prisma = new PrismaClient({ 
  datasources: { 
    db: { 
      url: DATABASE_URL 
    } 
  } 
});

async function test() {
  try {
    console.log('🔍 Testando conexão com AWS RDS...');
    console.log('📍 Região: eu-south-2');
    console.log('🏠 Endpoint: amadelivery.cro6yo4wqcvr.eu-south-2.rds.amazonaws.com');
    
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Query executada:', result[0]?.version);
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    if (tables.length === 0) {
      console.log('📊 Banco vazio - pronto para migração');
    } else {
      console.log('📊 Tabelas encontradas:');
      tables.forEach(table => console.log(`   - ${table.table_name}`));
    }
    
    console.log('🎉 Teste concluído com sucesso!');
    console.log('🚀 Pronto para executar migrações!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('🔧 Verifique:');
    console.log('1. Instância RDS rodando');
    console.log('2. Security groups');
    console.log('3. Banco "amadelivery" existe');
    console.log('4. Usuário "amadelivery" tem permissões');
  } finally {
    await prisma.$disconnect();
  }
}

test();
