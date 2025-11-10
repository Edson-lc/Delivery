// Arquivo de constantes da aplicação Mobile
// Contém todas as configurações, URLs, cores e valores fixos utilizados na aplicação

// Importar configurações do Expo
import Constants from 'expo-constants';

// Função para obter a URL da API
// Prioridade: 1. Variável de ambiente EXPO_PUBLIC_API_BASE_URL
//             2. Configuração em app.json extra.apiBaseUrl (via Constants.manifest ou expoConfig)
//             3. Fallback para desenvolvimento local
const getApiBaseUrl = (): string => {
  // Primeiro, tentar variável de ambiente (funciona no desenvolvimento)
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    console.log('🌐 [API] Usando variável de ambiente:', process.env.EXPO_PUBLIC_API_BASE_URL);
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  
  // Segundo, tentar configuração do app.json via Constants.manifest (build)
  if (Constants.manifest?.extra?.apiBaseUrl) {
    const url = Constants.manifest.extra.apiBaseUrl as string;
    console.log('🌐 [API] Usando Constants.manifest.extra.apiBaseUrl:', url);
    return url;
  }
  
  // Terceiro, tentar via Constants.expoConfig (build)
  if (Constants.expoConfig?.extra?.apiBaseUrl) {
    const url = Constants.expoConfig.extra.apiBaseUrl as string;
    console.log('🌐 [API] Usando Constants.expoConfig.extra.apiBaseUrl:', url);
    return url;
  }
  
  // Fallback para desenvolvimento local
  const fallback = 'http://192.168.1.229:4000/api';
  console.warn('⚠️ [API] Usando URL fallback:', fallback);
  console.log('🔍 [API] Debug - Constants.manifest:', JSON.stringify(Constants.manifest?.extra || {}));
  console.log('🔍 [API] Debug - Constants.expoConfig:', JSON.stringify(Constants.expoConfig?.extra || {}));
  return fallback;
};

// URLs da API para comunicação com o backend
const apiBaseUrl = getApiBaseUrl();

// Log da URL da API sendo usada (sempre, para debug)
console.log('✅ [API] URL final configurada:', apiBaseUrl);

export const API_URLS = {
  // URL base da API - detecta automaticamente a melhor configuração
  BASE_URL: apiBaseUrl,
  // Endpoint para buscar restaurantes públicos (sem autenticação)
  RESTAURANTS: '/public/restaurants',
  // Endpoint para buscar categorias de restaurantes
  CATEGORIES: '/public/restaurants/categories',
};

// Configurações gerais da aplicação
export const APP_CONFIG = {
  // Nome da aplicação - usa variável de ambiente ou fallback
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'AmaDelivery',
  // Versão da aplicação - usa variável de ambiente ou fallback
  VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  // Timeout para requisições HTTP em milissegundos (10 segundos)
  TIMEOUT: 10000,
};

// Paleta de cores da aplicação seguindo design system
export const COLORS_LIGHT = {
  primary: '#f97316',        // Laranja principal (orange-500) - cor da marca
  primaryDark: '#ea580c',    // Laranja escuro (orange-600) - para hover/press
  secondary: '#ef4444',      // Vermelho secundário (red-500) - para ações importantes
  background: '#f9fafb',     // Cinza claro (gray-50) - fundo geral
  surface: '#ffffff',        // Branco - fundo de cards e superfícies
  text: '#1f2937',           // Cinza escuro (gray-800) - texto principal
  textSecondary: '#6b7280',  // Cinza médio (gray-500) - texto secundário
  border: '#e5e7eb',         // Cinza claro (gray-200) - bordas e divisores
  success: '#10b981',       // Verde (emerald-500) - sucesso e confirmações
  warning: '#f59e0b',        // Amarelo (amber-500) - avisos e alertas
  error: '#ef4444',          // Vermelho (red-500) - erros e falhas
  info: '#3b82f6',           // Azul (blue-500) - informações e links
};

export const COLORS_DARK = {
  primary: '#f97316',        // Laranja principal (orange-500) - mantém cor da marca
  primaryDark: '#ea580c',    // Laranja escuro (orange-600) - mantém para hover/press
  secondary: '#ef4444',      // Vermelho secundário (red-500) - mantém para ações importantes
  background: '#111827',     // Cinza muito escuro (gray-900) - fundo geral
  surface: '#1f2937',        // Cinza escuro (gray-800) - fundo de cards e superfícies
  text: '#f9fafb',           // Branco quase puro (gray-50) - texto principal
  textSecondary: '#9ca3af',  // Cinza médio claro (gray-400) - texto secundário
  border: '#374151',         // Cinza médio escuro (gray-700) - bordas e divisores
  success: '#10b981',       // Verde (emerald-500) - sucesso e confirmações
  warning: '#f59e0b',        // Amarelo (amber-500) - avisos e alertas
  error: '#ef4444',          // Vermelho (red-500) - erros e falhas
  info: '#3b82f6',           // Azul (blue-500) - informações e links
};

// Função helper para obter cores baseadas no tema
export const getColors = (isDark: boolean) => {
  return isDark ? COLORS_DARK : COLORS_LIGHT;
};

// Exportar COLORS como light por padrão (para compatibilidade)
// Componentes devem usar getColors() com useTheme() para suporte a dark mode
export const COLORS = COLORS_LIGHT;

// Espaçamentos padronizados para layout consistente
export const SPACING = {
  xs: 4,    // Extra pequeno - espaçamento mínimo
  sm: 8,    // Pequeno - espaçamento reduzido
  smd: 12,  // Pequeno-Médio - espaçamento intermediário
  md: 16,   // Médio - espaçamento padrão
  lg: 24,   // Grande - espaçamento amplo
  xl: 32,   // Extra grande - espaçamento máximo
  xxl: 48,  // Extra extra grande - espaçamento de seções
};

// Tamanhos de fonte padronizados para tipografia consistente
export const FONT_SIZES = {
  xs: 12,   // Extra pequeno - texto auxiliar
  sm: 14,   // Pequeno - texto secundário
  md: 16,   // Médio - texto padrão
  lg: 18,   // Grande - texto destacado
  xl: 20,   // Extra grande - subtítulos
  xxl: 24,  // Extra extra grande - títulos
  xxxl: 32, // Extra extra extra grande - títulos principais
};

// Raios de borda padronizados para elementos visuais
export const BORDER_RADIUS = {
  sm: 4,    // Pequeno - elementos pequenos
  md: 8,    // Médio - elementos padrão
  lg: 12,   // Grande - cards e containers
  xl: 16,   // Extra grande - elementos destacados
  full: 999, // Completo - círculos e elementos arredondados
};

// Ícones emoji para categorias de restaurantes
export const CATEGORY_ICONS = {
  pizza: '🍕',        // Pizza
  hamburguer: '🍔',   // Hambúrguer
  sanduiches: '🥪',    // Sanduíches
  japonesa: '🍣',      // Comida japonesa
  brasileira: '🇧🇷',   // Comida brasileira
  italiana: '🍝',      // Comida italiana
  saudavel: '🥗',      // Comida saudável
  sobremesas: '🍰',    // Sobremesas
  arabe: '🥙',         // Comida árabe
  chinesa: '🥢',       // Comida chinesa
  mexicana: '🌮',      // Comida mexicana
  bebidas: '🥤',       // Bebidas
  lanches: '☕',       // Lanches e café
  outros: '🍽️',       // Outras categorias
};

// Cores específicas para cada categoria de restaurante
export const CATEGORY_COLORS = {
  pizza: '#f97316',      // Laranja para pizza
  hamburguer: '#ef4444', // Vermelho para hambúrguer
  sanduiches: '#ef4444', // Vermelho para sanduíches
  japonesa: '#3b82f6',   // Azul para japonesa
  brasileira: '#10b981', // Verde para brasileira
  italiana: '#eab308',   // Amarelo para italiana
  saudavel: '#059669',   // Verde escuro para saudável
  sobremesas: '#ec4899', // Rosa para sobremesas
  arabe: '#8b5cf6',      // Roxo para árabe
  chinesa: '#dc2626',    // Vermelho escuro para chinesa
  mexicana: '#ea580c',   // Laranja escuro para mexicana
  bebidas: '#7c3aed',    // Roxo para bebidas
  lanches: '#92400e',    // Marrom para lanches
  outros: '#6b7280',     // Cinza para outras categorias
};
