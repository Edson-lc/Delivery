// Configuração híbrida para migração gradual
// Permite usar tanto navegação atual quanto Expo Router

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationProvider } from './src/contexts/NavigationContext';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/constants';

// Flag para controlar qual sistema de navegação usar
const USE_EXPO_ROUTER = false; // Mudar para true quando migrar

/**
 * Componente principal da aplicação Mobile
 * 
 * SISTEMA HÍBRIDO DE NAVEGAÇÃO:
 * 
 * USE_EXPO_ROUTER = false (ATUAL):
 * - Usa navegação customizada com Context API
 * - Mantém toda funcionalidade existente
 * - Não quebra código atual
 * 
 * USE_EXPO_ROUTER = true (FUTURO):
 * - Usa Expo Router para navegação
 * - File-based routing
 * - Deep linking automático
 * - Animações nativas
 * 
 * @returns JSX.Element - Estrutura principal da aplicação
 */
export default function App() {
  // Renderizar sistema de navegação baseado na flag
  if (USE_EXPO_ROUTER) {
    // TODO: Implementar Expo Router quando migrar
    // return <ExpoRouterLayout />;
  }

  // Sistema atual de navegação (Context API)
  return (
    <AuthProvider>
      <NavigationProvider>
        <StatusBar style="light" backgroundColor={COLORS.primary} />
        <AppNavigator />
      </NavigationProvider>
    </AuthProvider>
  );
}

/**
 * Função para alternar entre sistemas de navegação
 * Útil para testes durante a migração
 */
export function toggleNavigationSystem() {
  // Esta função pode ser chamada para alternar entre sistemas
  // Útil para testes A/B durante a migração
  console.log('Alternando sistema de navegação...');
}
