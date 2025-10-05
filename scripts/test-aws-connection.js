#!/usr/bin/env node

/**
 * Script para testar conexão com AWS RDS PostgreSQL
 * Uso: node scripts/test-aws-connection.js
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.production' });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('🔍 Testando conexão com AWS RDS...');
  console.log(`📡 Database URL: ${process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***:***@')}`);
  
  try {
    // Teste básico de conexão
    console.log('\n1️⃣ Testando conexão básica...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    // Teste de query simples
    console.log('\n2️⃣ Testando query simples...');
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Query executada:', result[0]?.version);

    // Verificar tabelas existentes
    console.log('\n3️⃣ Verificando tabelas...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📊 Tabelas encontradas:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    // Teste de operação CRUD básica
    console.log('\n4️⃣ Testando operação CRUD...');
    
    // Verificar se existe pelo menos um usuário
    const userCount = await prisma.user.count();
    console.log(`👥 Usuários no banco: ${userCount}`);

    // Verificar se existe pelo menos um restaurante
    const restaurantCount = await prisma.restaurant.count();
    console.log(`🏪 Restaurantes no banco: ${restaurantCount}`);

    // Verificar se existe pelo menos um item de menu
    const menuItemCount = await prisma.menuItem.count();
    console.log(`🍽️ Itens de menu no banco: ${menuItemCount}`);

    console.log('\n🎉 Todos os testes passaram! AWS RDS está funcionando perfeitamente.');
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    
    if (error.code) {
      console.error('Código:', error.code);
    }
    
    if (error.meta) {
      console.error('Meta:', error.meta);
    }
    
    console.log('\n🔧 Possíveis soluções:');
    console.log('1. Verificar se a instância RDS está rodando');
    console.log('2. Verificar security groups e VPC');
    console.log('3. Verificar credenciais no .env.production');
    console.log('4. Verificar se o banco existe');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testConnection()
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
