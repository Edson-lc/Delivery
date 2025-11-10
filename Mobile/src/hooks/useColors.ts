import { useTheme } from '../contexts/ThemeContext';
import { getColors } from '../constants';

/**
 * Hook para obter as cores dinâmicas baseadas no tema atual
 * @returns Objeto com todas as cores do tema atual (light ou dark)
 */
export function useColors() {
  const { isDark } = useTheme();
  return getColors(isDark);
}

