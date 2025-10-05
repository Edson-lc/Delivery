// Select público - dados não sensíveis que podem ser expostos
export const publicUserSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  tipoUsuario: true,
  nome: true,
  sobrenome: true,
  fotoUrl: true,
  status: true,
  restaurantId: true,
  consentimentoDados: true,
  createdDate: true,
  updatedDate: true,
} as const;

// Select para dados pessoais sensíveis - apenas para o próprio usuário ou admin
export const privateUserSelect = {
  ...publicUserSelect,
  telefone: true,
  nif: true,
  dataNascimento: true,
  enderecosSalvos: true,
  metodosPagamento: true,
} as const;

// Select para admin - inclui todos os dados
export const adminUserSelect = {
  ...privateUserSelect,
  passwordHash: true,
  createdBy: true,
} as const;
