# 📁 Estrutura de Estilos Separados

## 🎨 Organização dos Estilos CSS

Os estilos CSS foram separados dos componentes React Native para melhor organização e manutenibilidade do código.

### 📂 Estrutura de Arquivos

```
Mobile/app/styles/
├── index.ts              # Arquivo de índice para exportar todos os estilos
├── homeStyles.ts         # Estilos da tela Home (index.tsx)
├── loginStyles.ts        # Estilos da tela Login (login.tsx)
└── restaurantStyles.ts   # Estilos da tela Restaurant ([id].tsx)
```

### 🔧 Como Usar

#### 1. Importar os Estilos
```typescript
import { homeStyles } from './styles/homeStyles';
// ou
import { homeStyles, loginStyles, restaurantStyles } from './styles';
```

#### 2. Usar nos Componentes
```typescript
<View style={homeStyles.container}>
  <Text style={homeStyles.headerTitle}>Título</Text>
</View>
```

### 📋 Vantagens da Separação

✅ **Organização**: Estilos separados dos componentes lógicos  
✅ **Manutenibilidade**: Fácil localização e edição de estilos  
✅ **Reutilização**: Estilos podem ser compartilhados entre componentes  
✅ **Performance**: Melhor tree-shaking e otimização  
✅ **Legibilidade**: Código mais limpo e focado  

### 🎯 Estilos Disponíveis

#### `homeStyles` - Tela Principal
- `container`, `header`, `headerLeft`, `headerRight`
- `searchBarExpanded`, `searchInputExpanded`
- `mobileFilters`, `filterButton`, `activeFilterButton`
- `promotionalSection`, `restaurantsList`
- `loadingContainer`, `errorContainer`, `emptyState`

#### `loginStyles` - Tela de Login
- `container`, `header`, `backButton`, `headerTitle`
- `formContainer`, `logoContainer`, `logoText`
- `inputContainer`, `inputWrapper`, `textInput`
- `loginButton`, `loginButtonDisabled`, `loginButtonText`
- `errorContainer`, `errorText`

#### `restaurantStyles` - Tela do Restaurante
- `container`, `header`, `backButton`, `headerTitle`
- `restaurantInfo`, `restaurantImage`, `restaurantCard`
- `searchBar`, `searchInput`, `categoryFilters`
- `menuItem`, `menuItemImage`, `menuItemContent`
- `loadingContainer`, `errorContainer`, `emptyState`

### 🔄 Migração Concluída

Todos os arquivos foram migrados com sucesso:
- ✅ `app/index.tsx` → usa `homeStyles`
- ✅ `app/login.tsx` → usa `loginStyles`  
- ✅ `app/restaurant/[id].tsx` → usa `restaurantStyles`

### 🚀 Próximos Passos

Para futuras telas, siga o padrão:
1. Criar arquivo `nomeTelaStyles.ts` em `app/styles/`
2. Exportar estilos do arquivo `index.ts`
3. Importar e usar no componente

**Exemplo:**
```typescript
// app/styles/profileStyles.ts
export const profileStyles = StyleSheet.create({
  container: { ... },
  // outros estilos
});

// app/styles/index.ts
export { profileStyles } from './profileStyles';

// app/profile.tsx
import { profileStyles } from './styles/profileStyles';
```
