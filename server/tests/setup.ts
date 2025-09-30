import { PrismaClient } from '@prisma/client';

// Configuração global para testes
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/amadelivery_test'
    }
  }
});

// Setup global antes de todos os testes
beforeAll(async () => {
  // Conectar ao banco de teste
  await prisma.$connect();
  
  // Limpar dados de teste se necessário
  await cleanupTestData();
});

// Cleanup após todos os testes
afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

// Cleanup entre testes
afterEach(async () => {
  await cleanupTestData();
});

async function cleanupTestData() {
  // Limpar dados de teste em ordem reversa das dependências
  await prisma.alteracaoPerfil.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.entregador.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurant.deleteMany();
}

// Mock do logger para testes
jest.mock('../src/utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
  logDebug: jest.fn(),
  logRequest: jest.fn(),
  logDatabase: jest.fn(),
  logAuth: jest.fn(),
  logBusiness: jest.fn(),
}));

// Mock do Prisma para testes unitários
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  restaurant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
};

// Helper para criar dados de teste
export const testHelpers = {
  createTestUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'user',
    tipoUsuario: 'cliente',
    status: 'ativo',
    createdDate: new Date(),
    updatedDate: new Date(),
    ...overrides,
  }),
  
  createTestRestaurant: (overrides = {}) => ({
    id: 'test-restaurant-id',
    nome: 'Test Restaurant',
    endereco: 'Test Address',
    telefone: '+351 123 456 789',
    status: 'ativo',
    createdDate: new Date(),
    updatedDate: new Date(),
    ...overrides,
  }),
  
  createTestOrder: (overrides = {}) => ({
    id: 'test-order-id',
    restaurantId: 'test-restaurant-id',
    clienteNome: 'Test Customer',
    clienteTelefone: '+351 123 456 789',
    enderecoEntrega: { street: 'Test Street' },
    itens: [{ name: 'Test Item', price: 10 }],
    subtotal: 10,
    total: 10,
    status: 'pendente_pagamento',
    createdDate: new Date(),
    updatedDate: new Date(),
    ...overrides,
  }),
};

export { prisma };
