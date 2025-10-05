#!/usr/bin/env node

/**
 * Script para testar conexão com AWS RDS PostgreSQL específico
 * Endpoint: amadelivery.cro6yo4wqcvr.eu-south-2.rds.amazonaws.com
 */

import { PrismaClient } from '@prisma/client';

// Configuração específica para seu endpoint AWS
const DATABASE_URL = "postgresql://amadelivery:amadelivery@amadelivery.cro6yo4wqcvr.eu-south-2.rds.amazonaws.com:5432/amadelivery";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('🔍 Testando conexão com AWS RDS...');
  console.log('📍 Região: eu-south-2');
  console.log('🏠 Endpoint: amadelivery.cro6yo4wqcvr.eu-south-2.rds.amazonaws.com');
  console.log('👤 Usuário: amadelivery');
  console.log('🗄️ Banco: amadelivery');
  
  try {
    // Teste básico de conexão
    console.log('\n1️⃣ Testando conexão básica...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    // Teste de query simples
    console.log('\n2️⃣ Testando query simples...');
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Query executada:', result[0]?.version);

    // Verificar se o banco está vazio ou tem dados
    console.log('\n3️⃣ Verificando estrutura do banco...');
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
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }

    // Teste de operação CRUD básica
    console.log('\n4️⃣ Testando operações básicas...');
    
    try {
      // Verificar se existe pelo menos um usuário
      const userCount = await prisma.user.count();
      console.log(`👥 Usuários no banco: ${userCount}`);
    } catch (error) {
      console.log('👥 Tabela users não existe ainda - normal para banco novo');
    }

    try {
      // Verificar se existe pelo menos um restaurante
      const restaurantCount = await prisma.restaurant.count();
      console.log(`🏪 Restaurantes no banco: ${restaurantCount}`);
    } catch (error) {
      console.log('🏪 Tabela restaurants não existe ainda - normal para banco novo');
    }

    console.log('\n🎉 Teste de conexão concluído com sucesso!');
    console.log('✅ AWS RDS está funcionando perfeitamente.');
    console.log('🚀 Pronto para executar migrações!');
    
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
    console.log('3. Verificar se o banco "amadelivery" existe');
    console.log('4. Verificar se o usuário "amadelivery" tem permissões');
    console.log('5. Verificar conectividade de rede');
    
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
