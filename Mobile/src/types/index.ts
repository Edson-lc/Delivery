// Arquivo de tipos TypeScript da aplicação Mobile
// Define todas as interfaces e tipos utilizados na aplicação

/**
 * Interface que define a estrutura de dados de um restaurante
 * Contém todas as informações necessárias para exibir e gerenciar restaurantes
 */
export interface Restaurant {
  id: string;                    // ID único do restaurante
  nome: string;                  // Nome do restaurante
  categoria: string;              // Categoria do restaurante (pizza, hamburguer, etc.)
  descricao?: string;             // Descrição do restaurante (opcional)
  imagemUrl?: string;             // URL da imagem do restaurante (opcional)
  imagem_url?: string;            // URL da imagem (formato alternativo da API)
  rating?: number;                // Avaliação média do restaurante (0-5)
  tempoPreparo?: number;          // Tempo de preparo em minutos (opcional)
  tempo_preparo?: number;         // Tempo de preparo (formato alternativo da API)
  tempo_entrega?: number;         // Tempo de entrega em minutos (opcional)
  taxaEntrega?: number;           // Taxa de entrega em euros (opcional)
  taxa_entrega?: number;         // Taxa de entrega (formato alternativo da API)
  endereco?: string;              // Endereço do restaurante (opcional)
  telefone?: string;              // Telefone do restaurante (opcional)
  status: 'ativo' | 'inativo' | 'suspenso';  // Status do restaurante
  desconto?: number;              // Percentual de desconto (opcional)
  menuItems?: MenuItem[];         // Lista de itens do cardápio (opcional)
}

/**
 * Interface que define a estrutura de dados de um item do cardápio
 * Contém todas as informações necessárias para exibir itens do menu
 */
export interface MenuItem {
  id: string;                     // ID único do item
  nome: string;                   // Nome do item
  descricao?: string;             // Descrição do item (opcional)
  preco: number;                  // Preço do item em euros
  imagemUrl?: string;             // URL da imagem do item (opcional)
  imagem_url?: string;            // URL da imagem (formato alternativo da API)
  categoria: string;              // Categoria do item (entrada, prato principal, etc.)
  disponivel: boolean;            // Se o item está disponível para pedido
  restaurantId?: string;          // ID do restaurante ao qual o item pertence (opcional)
  ingredientes?: any[];           // Lista de ingredientes (opcional)
  alergenos?: string[];           // Lista de alérgenos (opcional)
  adicionais?: any[];             // Lista de adicionais/extras (opcional)
  opcoes_personalizacao?: any[];  // Opções de personalização (opcional)
}

/**
 * Interface que define as opções de filtro para restaurantes
 * Usada para filtrar e ordenar a lista de restaurantes
 */
export interface FilterOptions {
  sortBy: 'rating' | 'name' | 'deliveryTime';  // Critério de ordenação
  category: string;               // Categoria para filtrar
  search: string;                 // Termo de busca
}

/**
 * Interface genérica para respostas da API
 * Padroniza o formato de resposta de todas as chamadas da API
 * 
 * @template T - Tipo dos dados retornados
 */
export interface ApiResponse<T> {
  data: T;                        // Dados retornados pela API
  success: boolean;               // Indica se a operação foi bem-sucedida
  message?: string;               // Mensagem adicional (opcional)
}

/**
 * Interface para parâmetros de paginação
 * Usada para controlar paginação em listas de dados
 */
export interface PaginationParams {
  limit?: number;                 // Número máximo de itens por página
  skip?: number;                  // Número de itens para pular (offset)
}

/**
 * Interface para filtros de restaurantes com paginação
 * Estende PaginationParams e adiciona filtros específicos para restaurantes
 */
export interface RestaurantFilters extends PaginationParams {
  category?: string;              // Categoria para filtrar restaurantes
  search?: string;                // Termo de busca para filtrar restaurantes
  includeMenuItems?: boolean;    // Se deve incluir itens do cardápio na resposta
}
