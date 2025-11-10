import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@amadelivery_theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  // Inicializar com o tema atual do sistema diretamente
  const initialSystemScheme = Appearance.getColorScheme();
  const [currentSystemScheme, setCurrentSystemScheme] = useState<string | null | undefined>(
    initialSystemScheme
  );
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Garantir que currentSystemScheme está atualizado na inicialização
    const currentScheme = Appearance.getColorScheme();
    if (currentScheme) {
      setCurrentSystemScheme(currentScheme);
    }
    
    // Carregar tema salvo ao inicializar
    loadTheme();
  }, []);

  // Listener para mudanças do sistema
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('🔄 Sistema mudou para:', colorScheme);
      setCurrentSystemScheme(colorScheme);
      // Forçar atualização quando o sistema mudar
      // Se estiver em modo 'system', forçar re-render
      if (theme === 'system') {
        // O useMemo vai recalcular isDark automaticamente
      }
    });

    return () => {
      subscription.remove();
    };
  }, [theme]);

  // Atualizar currentSystemScheme quando useColorScheme mudar
  useEffect(() => {
    setCurrentSystemScheme(systemColorScheme);
  }, [systemColorScheme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const systemTheme = Appearance.getColorScheme();
      
      console.log('📱 Tema salvo no storage:', savedTheme);
      console.log('📱 Tema atual do sistema:', systemTheme);
      
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        setTheme(savedTheme as ThemeMode);
        console.log('📱 Tema carregado do storage:', savedTheme);
        
        // Se o tema salvo for 'system', garantir que currentSystemScheme está atualizado
        if (savedTheme === 'system' && systemTheme) {
          setCurrentSystemScheme(systemTheme);
        }
      } else {
        // Se não houver tema salvo, usar o tema do sistema
        setTheme('system');
        await AsyncStorage.setItem(THEME_STORAGE_KEY, 'system');
        if (systemTheme) {
          setCurrentSystemScheme(systemTheme);
        }
        console.log('📱 Primeira execução - usando tema do sistema:', systemTheme);
      }
    } catch (error) {
      console.error('Erro ao carregar tema:', error);
      // Em caso de erro, usar o tema do sistema
      setTheme('system');
      const systemTheme = Appearance.getColorScheme();
      if (systemTheme) {
        setCurrentSystemScheme(systemTheme);
      }
    } finally {
      setIsInitialized(true);
    }
  };

  const toggleTheme = async () => {
    try {
      let newTheme: ThemeMode;
      
      // Ciclo: system -> light -> dark -> system
      if (theme === 'system') {
        newTheme = 'light';
      } else if (theme === 'light') {
        newTheme = 'dark';
      } else {
        newTheme = 'system';
      }
      
      setTheme(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  // Determinar se está em modo escuro baseado no tema atual e no sistema
  const isDark = React.useMemo(() => {
    // Se o tema for 'system', seguir o esquema do sistema
    if (theme === 'system') {
      // Priorizar currentSystemScheme (atualizado pelo listener) ou systemColorScheme (do hook)
      // Se ambos estiverem desatualizados, usar Appearance.getColorScheme() como fallback
      const scheme = currentSystemScheme || systemColorScheme || Appearance.getColorScheme();
      const result = scheme === 'dark';
      console.log('🌓 Verificando tema do sistema:', { 
        appearance: Appearance.getColorScheme(),
        currentSystemScheme,
        systemColorScheme,
        schemeUsado: scheme,
        resultado: result, 
        theme 
      });
      return result;
    }
    
    // Caso contrário, usar o tema selecionado manualmente
    return theme === 'dark';
  }, [theme, systemColorScheme, currentSystemScheme]);

  // Log para debug
  useEffect(() => {
    if (isInitialized) {
      console.log('🎨 Theme:', {
        theme,
        systemColorScheme,
        isDark,
        isInitialized
      });
    }
  }, [theme, systemColorScheme, isDark, isInitialized]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}

