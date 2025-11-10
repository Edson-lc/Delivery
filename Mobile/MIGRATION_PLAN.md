# 🚀 PLANO DE MIGRAÇÃO PARA EXPO ROUTER

## 📋 **ANÁLISE ATUAL**

### **Situação Atual:**
- ✅ Navegação customizada funcionando
- ✅ Context API para estado global
- ✅ 3 telas implementadas (Home, RestaurantMenu, Login)
- ✅ Autenticação integrada

### **Limitações Atuais:**
- ❌ Sem histórico de navegação
- ❌ Sem deep linking
- ❌ Sem animações nativas
- ❌ Limitado a navegação simples

## 🎯 **SOLUÇÃO RECOMENDADA: EXPO ROUTER**

### **Por que Expo Router?**
1. **Nativo do Expo** - Integração perfeita
2. **File-based routing** - Roteamento baseado em arquivos
3. **Deep linking automático** - URLs diretas
4. **Histórico automático** - Stack de navegação
5. **Animações nativas** - Transições suaves
6. **TypeScript completo** - Tipagem total
7. **Sem breaking changes** - Migração gradual

## 📦 **DEPENDÊNCIAS INSTALADAS**

```json
{
  "expo-router": "^3.5.23",
  "expo-linking": "^6.3.1", 
  "expo-constants": "^15.4.2"
}
```

## 🔄 **PLANO DE MIGRAÇÃO GRADUAL**

### **FASE 1: PREPARAÇÃO (ATUAL)**
- ✅ Instalar dependências do Expo Router
- ✅ Configurar app.json com scheme
- ✅ Criar estrutura híbrida
- ✅ Manter navegação atual funcionando

### **FASE 2: MIGRAÇÃO GRADUAL**
1. **Criar estrutura de rotas**
   ```
   app/
   ├── _layout.tsx          # Layout raiz
   ├── index.tsx            # HomeScreen
   ├── restaurant/
   │   └── [id].tsx         # RestaurantMenuScreen
   ├── login.tsx            # LoginScreen
   └── (tabs)/              # Futuras abas
       ├── profile.tsx
       └── checkout.tsx
   ```

2. **Migrar telas uma por vez**
   - Manter compatibilidade com Context API
   - Usar hooks do Expo Router gradualmente
   - Testar cada migração

3. **Adicionar funcionalidades avançadas**
   - Deep linking
   - Animações customizadas
   - Navegação por abas
   - Modais

### **FASE 3: OTIMIZAÇÃO**
- Remover navegação customizada
- Implementar lazy loading
- Adicionar persistência de estado
- Otimizar performance

## 🛠 **IMPLEMENTAÇÃO PASSO A PASSO**

### **Passo 1: Criar estrutura de arquivos**
```bash
mkdir app
mkdir app/restaurant
mkdir app/(tabs)
```

### **Passo 2: Migrar HomeScreen**
```tsx
// app/index.tsx
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  
  const navigateToRestaurant = (id: string) => {
    router.push(`/restaurant/${id}`);
  };
  
  // ... resto do código atual
}
```

### **Passo 3: Migrar RestaurantMenuScreen**
```tsx
// app/restaurant/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function RestaurantMenuScreen() {
  const { id } = useLocalSearchParams();
  
  // ... resto do código atual
}
```

### **Passo 4: Migrar LoginScreen**
```tsx
// app/login.tsx
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  
  const handleLogin = () => {
    router.replace('/');
  };
  
  // ... resto do código atual
}
```

## 🔧 **CONFIGURAÇÕES NECESSÁRIAS**

### **app.json atualizado:**
```json
{
  "expo": {
    "scheme": "amadelivery",
    "plugins": ["expo-router"]
  }
}
```

### **Metro config (se necessário):**
```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
```

## 🎯 **VANTAGENS DA MIGRAÇÃO**

### **Funcionalidades Ganhas:**
- ✅ **Deep Linking**: `amadelivery://restaurant/123`
- ✅ **Histórico**: Botão voltar automático
- ✅ **Animações**: Transições nativas
- ✅ **TypeScript**: Tipagem completa
- ✅ **Performance**: Otimizações nativas
- ✅ **SEO**: URLs amigáveis (web)

### **Exemplos de URLs:**
- `amadelivery://` - Home
- `amadelivery://restaurant/pizza-palace` - Menu do restaurante
- `amadelivery://login` - Login
- `amadelivery://profile` - Perfil do usuário

## ⚠️ **CONSIDERAÇÕES IMPORTANTES**

### **Compatibilidade:**
- ✅ Mantém Context API atual
- ✅ Não quebra autenticação
- ✅ Preserva estado global
- ✅ Migração gradual possível

### **Testes Necessários:**
- [ ] Navegação entre telas
- [ ] Deep linking
- [ ] Botão voltar
- [ ] Autenticação
- [ ] Estado persistente

## 🚀 **PRÓXIMOS PASSOS**

1. **Testar estrutura atual** - Verificar se tudo funciona
2. **Criar primeira rota** - Migrar HomeScreen
3. **Testar navegação** - Verificar transições
4. **Migrar gradualmente** - Uma tela por vez
5. **Adicionar funcionalidades** - Deep linking, animações

## 📚 **RECURSOS ÚTEIS**

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [File-based Routing](https://docs.expo.dev/router/file-system/)
- [Deep Linking](https://docs.expo.dev/router/linking/)
- [Navigation Patterns](https://docs.expo.dev/router/navigation/)

---

**Este plano garante uma migração suave sem quebrar o código existente!** 🎉
