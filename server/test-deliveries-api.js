const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = 'amadelivery-super-secret-jwt-key-for-production-minimum-64-characters-long-for-security-purposes';

async function testDeliveriesAPI() {
  try {
    console.log('🔍 Testando API de deliveries...');

    // 1. Encontrar um usuário entregador
    const user = await prisma.user.findFirst({
      where: { tipoUsuario: 'entregador' },
      select: { id: true, email: true, tipoUsuario: true }
    });

    if (!user) {
      console.log('❌ Nenhum usuário entregador encontrado');
      return;
    }

    console.log('👤 Usuário encontrado:', user);

    // 2. Encontrar o perfil do entregador
    const entregador = await prisma.entregador.findFirst({
      where: { userId: user.id },
      select: { id: true, nomeCompleto: true }
    });

    if (!entregador) {
      console.log('❌ Nenhum perfil de entregador encontrado');
      return;
    }

    console.log('🚚 Entregador encontrado:', entregador);

    // 3. Gerar token JWT
    const token = jwt.sign(
      { sub: user.id, email: user.email, tipoUsuario: user.tipoUsuario },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('🔑 Token gerado:', token.substring(0, 50) + '...');

    // 4. Testar a API diretamente
    const fetch = require('node-fetch');
    const response = await fetch(`http://localhost:4000/api/deliveries?entregadorId=${entregador.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ API Response:', data);
      console.log('📋 Primeira entrega:', data[0]);
      console.log('📍 Endereço da primeira entrega:', data[0]?.enderecoEntrega);
    } else {
      console.error('❌ Erro na API:', response.status, data);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeliveriesAPI();
