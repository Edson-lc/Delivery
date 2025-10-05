import { 
  Pizza, 
  Sandwich, 
  Fish, 
  Beef, 
  Utensils, 
  Carrot, 
  IceCream, 
  Shell, 
  Flame, 
  Wine, 
  Coffee,
  Cake,
  UtensilsCrossed
} from 'lucide-react';

// Mapeamento padronizado de categorias para ícones
export const categoryIconMap = {
  'pizza': Pizza,
  'hamburguer': Sandwich,
  'sanduiches': Sandwich,
  'japonesa': Fish,
  'brasileira': Beef,
  'italiana': Pizza,
  'saudavel': Carrot,
  'sobremesas': Cake,
  'arabe': Shell,
  'chinesa': UtensilsCrossed,
  'mexicana': Flame,
  'bebidas': Wine,
  'lanches': Coffee,
  'outros': UtensilsCrossed
};

// Função para obter o ícone de uma categoria
export const getCategoryIcon = (category) => {
  return categoryIconMap[category?.toLowerCase()] || UtensilsCrossed;
};

// Cores padronizadas para cada categoria
export const categoryColors = {
  'pizza': 'text-orange-500',
  'hamburguer': 'text-red-500',
  'sanduiches': 'text-red-500',
  'japonesa': 'text-blue-500',
  'brasileira': 'text-green-500',
  'italiana': 'text-yellow-500',
  'saudavel': 'text-green-600',
  'sobremesas': 'text-pink-500',
  'arabe': 'text-purple-500',
  'chinesa': 'text-red-600',
  'mexicana': 'text-orange-600',
  'bebidas': 'text-purple-600',
  'lanches': 'text-brown-500',
  'outros': 'text-gray-500'
};

// Função para obter a cor de uma categoria
export const getCategoryColor = (category) => {
  return categoryColors[category?.toLowerCase()] || 'text-gray-500';
};
