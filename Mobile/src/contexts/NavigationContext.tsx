// Importações necessárias para o contexto de navegação
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Restaurant } from '../types';

/**
 * Tipo que define as telas disponíveis na aplicação
 * Cada string representa uma tela específica que pode ser navegada
 */
export type Screen = 'Home' | 'RestaurantMenu' | 'Login' | 'Checkout';

/**
 * Interface que define o tipo do contexto de navegação
 * Contém todas as funções e estados disponíveis para navegação entre telas
 */
interface NavigationContextType {
  currentScreen: Screen;                                    // Tela atual sendo exibida
  navigateToHome: () => void;                               // Função para navegar para a tela inicial
  navigateToRestaurantMenu: (restaurant: Restaurant) => void;  // Função para navegar para o menu do restaurante
  navigateToLogin: () => void;                              // Função para navegar para a tela de login
  navigateToLoginWithRedirect: (redirectTo: string) => void; // Função para navegar para login com redirecionamento
  navigateToCheckout: () => void;                           // Função para navegar para a tela de checkout
  executeRedirectAfterLogin: () => void;                    // Função para executar redirecionamento após login
  goBack: () => void;                                       // Função para voltar à tela anterior
  selectedRestaurant: Restaurant | null;                   // Restaurante selecionado (usado no menu)
  redirectAfterLogin: string | null;                       // Tela para redirecionar após login
}

// Criação do contexto de navegação
const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

/**
 * Interface para as props do NavigationProvider
 */
interface NavigationProviderProps {
  children: ReactNode;  // Componentes filhos que terão acesso ao contexto
}

/**
 * Provider de navegação que gerencia o estado global de navegação
 * 
 * Este componente:
 * - Gerencia a tela atual sendo exibida
 * - Fornece funções para navegar entre diferentes telas
 * - Mantém o estado do restaurante selecionado
 * - Implementa lógica de navegação "voltar"
 * 
 * @param children - Componentes filhos que terão acesso ao contexto
 * @returns JSX.Element - Provider com contexto de navegação
 */
export function NavigationProvider({ children }: NavigationProviderProps) {
  // Estados locais do contexto
  const [currentScreen, setCurrentScreen] = useState<Screen>('Home');           // Tela atual (inicia na Home)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);  // Restaurante selecionado
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(null);       // Redirecionamento após login

  /**
   * Função para navegar para a tela inicial (Home)
   * 
   * Esta função:
   * - Define a tela atual como 'Home'
   * - Limpa o restaurante selecionado
   */
  const navigateToHome = () => {
    setCurrentScreen('Home');
    setSelectedRestaurant(null);
  };

  /**
   * Função para navegar para o menu de um restaurante específico
   * 
   * @param restaurant - Objeto Restaurant contendo dados do restaurante
   * 
   * Esta função:
   * - Define o restaurante selecionado
   * - Navega para a tela 'RestaurantMenu'
   */
  const navigateToRestaurantMenu = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setCurrentScreen('RestaurantMenu');
  };

  /**
   * Função para navegar para a tela de login com redirecionamento
   * 
   * @param redirectTo - Tela para redirecionar após login bem-sucedido
   * 
   * Esta função:
   * - Define a tela atual como 'Login'
   * - Armazena a tela de destino para redirecionamento
   * - Limpa o restaurante selecionado
   */
  const navigateToLoginWithRedirect = (redirectTo: string) => {
    setRedirectAfterLogin(redirectTo);
    setCurrentScreen('Login');
    setSelectedRestaurant(null);
  };

  /**
   * Função para navegar para a tela de login (sem redirecionamento)
   * 
   * Esta função:
   * - Define a tela atual como 'Login'
   * - Limpa o restaurante selecionado
   * - Limpa qualquer redirecionamento pendente
   */
  const navigateToLogin = () => {
    setRedirectAfterLogin(null);
    setCurrentScreen('Login');
    setSelectedRestaurant(null);
  };

  /**
   * Função para navegar para a tela de checkout
   * 
   * Esta função:
   * - Define a tela atual como 'Checkout'
   * - Mantém o restaurante selecionado (se houver)
   */
  const navigateToCheckout = () => {
    setCurrentScreen('Checkout');
  };

  /**
   * Função para executar redirecionamento após login bem-sucedido
   * 
   * Esta função:
   * - Verifica se há um redirecionamento pendente
   * - Executa a navegação apropriada
   * - Limpa o estado de redirecionamento
   */
  const executeRedirectAfterLogin = () => {
    if (redirectAfterLogin) {
      console.log('🔄 Executando redirecionamento para:', redirectAfterLogin);
      
      switch (redirectAfterLogin) {
        case 'checkout':
          navigateToCheckout();
          break;
        case 'home':
        default:
          navigateToHome();
          break;
      }
      
      // Limpar o redirecionamento após executar
      setRedirectAfterLogin(null);
    } else {
      navigateToHome();
    }
  };

  /**
   * Função para voltar à tela anterior
   * 
   * Esta função implementa lógica de navegação "voltar":
   * - Se estiver no menu do restaurante, volta para a Home
   * - Se estiver no login, volta para a Home
   * - Se estiver no checkout, volta para o menu do restaurante
   * - Outras telas podem ser adicionadas conforme necessário
   */
  const goBack = () => {
    if (currentScreen === 'RestaurantMenu') {
      navigateToHome();
    } else if (currentScreen === 'Login') {
      navigateToHome();
    } else if (currentScreen === 'Checkout') {
      if (selectedRestaurant) {
        navigateToRestaurantMenu(selectedRestaurant);
      } else {
        navigateToHome();
      }
    }
  };

  // Retornar o provider com todos os valores do contexto
  return (
    <NavigationContext.Provider
      value={{
        currentScreen,
        navigateToHome,
        navigateToRestaurantMenu,
        navigateToLogin,
        navigateToLoginWithRedirect,
        navigateToCheckout,
        executeRedirectAfterLogin,
        goBack,
        selectedRestaurant,
        redirectAfterLogin,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Hook personalizado para usar o contexto de navegação
 * 
 * @returns NavigationContextType - Contexto de navegação
 * @throws Error - Se usado fora do NavigationProvider
 */
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
