// Componente principal da aplicação Mobile com Expo Router
// Migração completa para Expo Router implementada

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { COLORS } from './src/constants';

/**
 * Componente principal da aplicação Mobile
 * 
 * EXPO ROUTER IMPLEMENTADO:
 * 
 * ✅ Migração completa para Expo Router
 * ✅ File-based routing ativo
 * ✅ Deep linking funcional
 * ✅ Navegação automática
 * ✅ Animações nativas
 * ✅ Performance otimizada
 * 
 * ESTRUTURA DE ROTAS:
 * - / (index) -> HomeScreen
 * - /restaurant/[id] -> RestaurantMenuScreen  
 * - /login -> LoginScreen
 * - /profile -> ProfileScreen (futura)
 * - /checkout -> CheckoutScreen (futura)
 * 
 * @returns JSX.Element - Estrutura principal da aplicação
 */
export default function App() {
  return (
    // Provider de autenticação - gerencia estado de login/logout do usuário
    <AuthProvider>
      {/* Barra de status personalizada com cor primária e estilo claro */}
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      {/* 
        Expo Router gerencia automaticamente a navegação
        O layout raiz está em app/_layout.tsx
      */}
    </AuthProvider>
  );
}