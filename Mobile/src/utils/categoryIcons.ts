// Utilitários para ícones e cores de categorias de restaurantes
// Fornece funções para obter ícones, cores e emojis baseados na categoria
import { MaterialIcons } from '@expo/vector-icons';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';

/**
 * Obtém o ícone Material Design para uma categoria de restaurante
 * 
 * @param category - Nome da categoria (ex: 'pizza', 'hamburguer')
 * @returns Objeto com nome do ícone e componente MaterialIcons
 */
export function getCategoryIcon(category: string) {
  const categoryKey = category.toLowerCase() as keyof typeof CATEGORY_ICONS;
  
  // Mapeamento de categorias para ícones do MaterialIcons
  const iconMap: Record<string, { name: keyof typeof MaterialIcons.glyphMap; Icon: typeof MaterialIcons }> = {
    pizza: { name: 'local-pizza', Icon: MaterialIcons },        // Ícone de pizza
    hamburguer: { name: 'fastfood', Icon: MaterialIcons },      // Ícone de hambúrguer
    sanduiches: { name: 'lunch-dining', Icon: MaterialIcons },  // Ícone de sanduíches
    japonesa: { name: 'restaurant', Icon: MaterialIcons },      // Ícone genérico para japonesa
    brasileira: { name: 'restaurant-menu', Icon: MaterialIcons }, // Ícone de menu para brasileira
    italiana: { name: 'restaurant', Icon: MaterialIcons },      // Ícone genérico para italiana
    saudavel: { name: 'eco', Icon: MaterialIcons },             // Ícone ecológico para saudável
    sobremesas: { name: 'cake', Icon: MaterialIcons },          // Ícone de bolo para sobremesas
    arabe: { name: 'restaurant', Icon: MaterialIcons },         // Ícone genérico para árabe
    chinesa: { name: 'restaurant', Icon: MaterialIcons },       // Ícone genérico para chinesa
    mexicana: { name: 'restaurant', Icon: MaterialIcons },      // Ícone genérico para mexicana
    bebidas: { name: 'local-bar', Icon: MaterialIcons },       // Ícone de bar para bebidas
    lanches: { name: 'coffee', Icon: MaterialIcons },           // Ícone de café para lanches
    outros: { name: 'restaurant-menu', Icon: MaterialIcons },   // Ícone padrão para outras categorias
  };

  // Retornar ícone específico ou ícone padrão se categoria não encontrada
  return iconMap[categoryKey] || iconMap.outros;
}

/**
 * Obtém a cor específica para uma categoria de restaurante
 * 
 * @param category - Nome da categoria
 * @returns String com código hexadecimal da cor
 */
export function getCategoryColor(category: string): string {
  const categoryKey = category.toLowerCase() as keyof typeof CATEGORY_COLORS;
  return CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.outros;
}

/**
 * Obtém o emoji específico para uma categoria de restaurante
 * 
 * @param category - Nome da categoria
 * @returns String com o emoji da categoria
 */
export function getCategoryEmoji(category: string): string {
  const categoryKey = category.toLowerCase() as keyof typeof CATEGORY_ICONS;
  return CATEGORY_ICONS[categoryKey] || CATEGORY_ICONS.outros;
}
