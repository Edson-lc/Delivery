// Navegador principal da aplicação Mobile
// Gerencia a exibição das diferentes telas baseado no estado de navegação
import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import HomeScreen from '../screens/HomeScreen';
import RestaurantMenuScreen from '../screens/RestaurantMenuScreen';
import LoginScreen from '../screens/LoginScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';

/**
 * Componente AppNavigator - Navegador principal da aplicação
 * 
 * Este componente:
 * - Utiliza o contexto de navegação para determinar a tela atual
 * - Renderiza a tela apropriada baseado no estado currentScreen
 * - Implementa navegação simples sem bibliotecas externas
 * - Fallback para HomeScreen em caso de tela não reconhecida
 * 
 * @returns JSX.Element - Tela atual baseada no estado de navegação
 */
export default function AppNavigator() {
  // Obter o estado atual de navegação do contexto
  const { currentScreen } = useNavigation();

  // Renderizar a tela apropriada baseado no estado atual
  switch (currentScreen) {
    case 'Home':
      return <HomeScreen />;                    // Tela inicial com lista de restaurantes
    case 'RestaurantMenu':
      return <RestaurantMenuScreen />;          // Tela do cardápio do restaurante selecionado
    case 'Login':
      return <LoginScreen />;                  // Tela de login/autenticação
    case 'Checkout':
      return <CheckoutScreen />;               // Tela de checkout/finalização do pedido
    default:
      return <HomeScreen />;                    // Fallback para tela inicial
  }
}