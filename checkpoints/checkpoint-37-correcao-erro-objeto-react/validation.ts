import { z } from 'zod';

// Schemas de validaÃ§Ã£o para usuÃ¡rios
export const createUserSchema = z.object({
  email: z.string().email('E-mail inválido').toLowerCase(),
  fullName: z.string().min(2, 'Nome completo deve ter pelo menos 2 caracteres').max(100),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 símbolo'),
  role: z.enum(['admin', 'user']).optional(),
  tipoUsuario: z.enum(['cliente', 'restaurante', 'entregador', 'admin']).optional(),
  nome: z.string().min(1).max(50).optional(),
  sobrenome: z.string().min(1).max(50).optional(),
  telefone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Telefone inválido').optional(),
  nif: z.string().regex(/^\d{9}$/, 'NIF deve ter 9 dígitos').optional(),
  dataNascimento: z.string().datetime().optional(),
  fotoUrl: z.string().url('URL de foto inválida').optional(),
  status: z.enum(['ativo', 'inativo', 'suspenso']).optional(),
  restaurantId: z.string().uuid('ID do restaurante inválido').optional(),
  consentimentoDados: z.boolean().optional(),
  enderecosSalvos: z.array(z.any()).optional(),
  metodosPagamento: z.array(z.any()).optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 símbolo')
    .optional(),
});

export const registerUserSchema = z.object({
  fullName: z.string().min(2, 'Nome completo deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('E-mail inválido').toLowerCase(),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 símbolo'),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido').toLowerCase(),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Schemas para restaurantes
export const createRestaurantSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  descricao: z.string().max(500).optional(),
  categoria: z.string().min(1).max(50).optional(),
  endereco: z.string().min(5, 'EndereÃ§o deve ter pelo menos 5 caracteres').max(200),
  telefone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Telefone invÃ¡lido'),
  email: z.string().email('E-mail invÃ¡lido').optional(),
  tempoPreparo: z.number().int().min(5).max(120).optional(),
  taxaEntrega: z.number().min(0).max(50).optional(),
  valorMinimo: z.number().min(0).max(1000).optional(),
  status: z.enum(['ativo', 'inativo', 'suspenso']).optional(),
  avaliacao: z.number().min(0).max(5).optional(),
  imagemUrl: z.string().url('URL de imagem invÃ¡lida').optional(),
  horarioFuncionamento: z.record(z.string(), z.any()).optional(),
});

export const updateRestaurantSchema = createRestaurantSchema.partial();

// Schemas para itens de menu
export const createMenuItemSchema = z.object({
  restaurantId: z.string().uuid('ID do restaurante invÃ¡lido'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  descricao: z.string().max(500).optional(),
  preco: z.number().min(0.01, 'PreÃ§o deve ser maior que 0').max(1000),
  categoria: z.string().min(1).max(50).optional(),
  imagemUrl: z.string().url('URL de imagem invÃ¡lida').optional(),
  disponivel: z.boolean().optional(),
  tempoPreparo: z.number().int().min(1).max(60).optional(),
  ingredientes: z.array(z.string()).optional(),
  adicionais: z.array(z.any()).optional(),
  opcoesPersonalizacao: z.array(z.any()).optional(),
  alergenos: z.array(z.string()).optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial().omit({ restaurantId: true });

// Schemas para pedidos
export const createOrderSchema = z.object({
  customerId: z.string().uuid('ID do cliente invÃ¡lido').optional(),
  restaurantId: z.string().uuid('ID do restaurante invÃ¡lido'),
  entregadorId: z.string().uuid('ID do entregador invÃ¡lido').optional(),
  clienteNome: z.string().min(2, 'Nome do cliente deve ter pelo menos 2 caracteres').max(100),
  clienteTelefone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Telefone invÃ¡lido'),
  clienteEmail: z.string().email('E-mail invÃ¡lido').optional(),
  enderecoEntrega: z.record(z.string(), z.any()),
  itens: z.array(z.any()).min(1, 'Pedido deve ter pelo menos 1 item'),
  subtotal: z.number().min(0.01, 'Subtotal deve ser maior que 0'),
  taxaEntrega: z.number().min(0).optional(),
  taxaServico: z.number().min(0).optional(),
  desconto: z.number().min(0).optional(),
  cupomUsado: z.string().max(50).optional(),
  total: z.number().min(0.01, 'Total deve ser maior que 0'),
  formaPagamento: z.enum(['dinheiro', 'cartao', 'pix', 'transferencia']).optional(),
  observacoesCliente: z.string().max(500).optional(),
  tempoEstimadoPreparo: z.number().int().min(1).optional(),
  tempoEstimadoEntrega: z.number().int().min(1).optional(),
});

export const updateOrderSchema = createOrderSchema.partial();

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pendente_pagamento',
    'confirmado',
    'preparando',
    'pronto',
    'saiu_entrega',
    'entregue',
    'cancelado'
  ]),
  note: z.string().max(200).optional(),
});

// Schemas para entregadores
export const createEntregadorSchema = z.object({
  userId: z.string().uuid('ID do usuÃ¡rio invÃ¡lido').optional(),
  email: z.string().email('E-mail invÃ¡lido').toLowerCase(),
  nomeCompleto: z.string().min(2, 'Nome completo deve ter pelo menos 2 caracteres').max(100),
  telefone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Telefone invÃ¡lido'),
  endereco: z.record(z.string(), z.any()).optional(),
  nif: z.string().regex(/^\d{9}$/, 'NIF deve ter 9 dÃ­gitos').optional(),
  dataNascimento: z.string().datetime().optional(),
  fotoUrl: z.string().url('URL de foto invÃ¡lida').optional(),
  status: z.enum(['ativo', 'inativo', 'suspenso']).optional(),
  aprovado: z.boolean().optional(),
  veiculoTipo: z.enum(['moto', 'bicicleta', 'carro', 'pe']).optional(),
  veiculoPlaca: z.string().max(20).optional(),
  disponivel: z.boolean().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  iban: z.string().regex(/^[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}$/, 'IBAN invÃ¡lido').optional(),
  nomeBanco: z.string().max(100).optional(),
});

export const updateEntregadorSchema = createEntregadorSchema.partial();

// Schemas para carrinhos
export const createCartSchema = z.object({
  sessionId: z.string().min(1, 'Session ID Ã© obrigatÃ³rio'),
  restaurantId: z.string().uuid('ID do restaurante invÃ¡lido'),
  itens: z.array(z.any()).optional(),
  subtotal: z.number().min(0).optional(),
});

export const updateCartSchema = createCartSchema.partial().omit({ sessionId: true, restaurantId: true });

// Schemas para clientes
export const createCustomerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('E-mail invÃ¡lido').optional(),
  telefone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Telefone invÃ¡lido'),
  enderecoPrincipal: z.string().max(200).optional(),
  enderecosSalvos: z.array(z.any()).optional(),
  preferencias: z.record(z.string(), z.any()).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// Schemas para entregas
export const createDeliverySchema = z.object({
  orderId: z.string().uuid('ID do pedido invÃ¡lido'),
  entregadorId: z.string().uuid('ID do entregador invÃ¡lido').optional(),
  enderecoColeta: z.string().min(5, 'EndereÃ§o de coleta deve ter pelo menos 5 caracteres').max(200),
  enderecoEntrega: z.string().min(5, 'EndereÃ§o de entrega deve ter pelo menos 5 caracteres').max(200),
  clienteNome: z.string().min(2, 'Nome do cliente deve ter pelo menos 2 caracteres').max(100),
  restauranteNome: z.string().min(2, 'Nome do restaurante deve ter pelo menos 2 caracteres').max(100),
  valorFrete: z.number().min(0, 'Valor do frete deve ser maior ou igual a 0'),
  distanciaKm: z.number().min(0).optional(),
  tempoEstimadoMin: z.number().int().min(1).optional(),
});

export const updateDeliverySchema = createDeliverySchema.partial().omit({ orderId: true });

// Schemas para alteraÃ§Ãµes de perfil
export const createAlteracaoPerfilSchema = z.object({
  entregadorId: z.string().uuid('ID do entregador invÃ¡lido'),
  dadosAntigos: z.record(z.string(), z.any()),
  dadosNovos: z.record(z.string(), z.any()),
  status: z.enum(['pendente', 'aprovado', 'rejeitado']).optional(),
  observacoesAdmin: z.string().max(500).optional(),
});

export const updateAlteracaoPerfilSchema = createAlteracaoPerfilSchema.partial().omit({ entregadorId: true });

// Schemas para paginaÃ§Ã£o
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  skip: z.number().int().min(0).optional(),
  sort: z.string().optional(),
  search: z.string().max(100).optional(),
});

// Schema para query parameters
export const querySchema = z.object({
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional(),
  skip: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(0)).optional(),
  sort: z.string().optional(),
  search: z.string().max(100).optional(),
});

// FunÃ§Ã£o helper para validaÃ§Ã£o
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation error: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
}

// FunÃ§Ã£o helper para validaÃ§Ã£o de query parameters
export function validateQuery<T>(schema: z.ZodSchema<T>, query: Record<string, unknown>): T {
  return validateSchema(schema, query);
}
