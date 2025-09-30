# 🏢 Plano de Negócios - Marketplace de Delivery (Modelo Administrador Avançado)

## 🎯 **Visão Geral do Modelo de Negócio**

### **Estrutura da Plataforma:**
- **Você**: Administrador da plataforma (AmaDelivery)
- **Restaurantes**: Parceiros que vendem na sua plataforma
- **Clientes**: Usuários finais que fazem pedidos
- **Comissão**: Configurável pelo administrador (padrão 30%)
- **Taxa de Entrega**: Sistema inteligente com 4 tipos de cálculo

---

## 💰 **Modelo de Receita Flexível**

### **Fontes de Receita:**
1. **Comissão configurável** sobre vendas dos restaurantes (padrão 30%)
2. **Taxa de entrega inteligente** paga pelos clientes
3. **Taxa de serviço** (opcional, 2-5% sobre o pedido)
4. **Taxa de adesão** dos restaurantes (opcional)

### **Exemplo de Fluxo Financeiro:**
```
Pedido do Cliente: €25.00
├── Produtos: €20.00
├── Taxa de Entrega: €3.50 (calculada inteligentemente)
└── Taxa de Serviço: €1.50 (2% sobre €25.00)

Distribuição (com comissão de 30%):
├── Restaurante recebe: €14.00 (€20.00 - 30% comissão)
├── Plataforma recebe: €6.00 (30% de €20.00)
├── Taxa de Entrega: €3.50 (para custos de entrega)
└── Taxa de Serviço: €1.50 (receita adicional)
```

---

## 🎛️ **Sistema de Comissões Configurável**

### **Configuração de Comissões:**
```javascript
const configuracaoComissoes = {
  // Comissão padrão para todos os restaurantes
  comissao_padrao: 30, // 30%
  
  // Comissões especiais por restaurante
  comissoes_especiais: [
    {
      restaurant_id: "rest-123",
      comissao: 25, // 25% para restaurante premium
      motivo: "Restaurante premium com alto volume"
    },
    {
      restaurant_id: "rest-456", 
      comissao: 35, // 35% para restaurante novo
      motivo: "Restaurante novo, comissão promocional"
    }
  ],
  
  // Comissões por categoria
  comissoes_por_categoria: [
    {
      categoria: "fast_food",
      comissao: 28
    },
    {
      categoria: "restaurante_premium",
      comissao: 25
    },
    {
      categoria: "lanchonete",
      comissao: 32
    }
  ]
};
```

---

## 🗺️ **Sistema de Taxas de Entrega Inteligente**

### **4 Tipos de Cálculo Disponíveis:**

#### **1. Taxa Base + KM até Restaurante**
```javascript
const calculoRestaurante = {
  tipo: "taxa_base_km_restaurante",
  configuracoes: {
    taxa_base: 2.00,
    valor_km_restaurante: 0.80,
    raio_maximo_km: 15
  },
  exemplo: "€2.00 + (8km × €0.80) = €8.40"
};
```

#### **2. Taxa Base + KM até Cliente**
```javascript
const calculoCliente = {
  tipo: "taxa_base_km_cliente", 
  configuracoes: {
    taxa_base: 2.00,
    valor_km_cliente: 1.20,
    distancia_maxima: 20
  },
  exemplo: "€2.00 + (5km × €1.20) = €8.00"
};
```

#### **3. Taxa Combinada (Base + KM Restaurante + KM Cliente)**
```javascript
const calculoCombinado = {
  tipo: "taxa_combinada",
  configuracoes: {
    taxa_base: 1.50,
    valor_km_restaurante: 0.60,
    valor_km_cliente: 0.90,
    km_gratis: 3
  },
  exemplo: "€1.50 + (5km × €0.60) + (4km × €0.90) = €8.10"
};
```

#### **4. Taxa Fixa (Simples)**
```javascript
const calculoFixo = {
  tipo: "taxa_fixa",
  configuracoes: {
    taxa_fixa: 3.50
  },
  exemplo: "€3.50 para todas as entregas"
};
```

---

## 🏗️ **Arquitetura do Sistema**

### **Estrutura do Banco de Dados:**

```sql
-- Configuração global de comissões
CREATE TABLE commission_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comissao_padrao DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    ativo BOOLEAN DEFAULT true,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comissões especiais por restaurante
CREATE TABLE restaurant_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    comissao DECIMAL(5,2) NOT NULL,
    motivo TEXT,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    ativo BOOLEAN DEFAULT true,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuração global de taxas de entrega
CREATE TABLE delivery_fee_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_calculo VARCHAR(30) NOT NULL, -- 'fixa', 'taxa_base_km_restaurante', 'taxa_base_km_cliente', 'combinada'
    
    -- Configurações para taxa fixa
    taxa_fixa DECIMAL(10,2),
    
    -- Configurações para taxa base + KM restaurante
    taxa_base_restaurante DECIMAL(10,2),
    valor_km_restaurante DECIMAL(10,2),
    raio_maximo_km DECIMAL(5,2),
    
    -- Configurações para taxa base + KM cliente
    taxa_base_cliente DECIMAL(10,2),
    valor_km_cliente DECIMAL(10,2),
    distancia_maxima_km DECIMAL(5,2),
    
    -- Configurações para taxa combinada
    taxa_base_combinada DECIMAL(10,2),
    valor_km_restaurante_combinada DECIMAL(10,2),
    valor_km_cliente_combinada DECIMAL(10,2),
    km_gratis DECIMAL(5,2),
    
    -- Metadados
    ativo BOOLEAN DEFAULT true,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Zonas de entrega (para flexibilidade futura)
CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo_calculo VARCHAR(30) NOT NULL,
    
    -- Configurações específicas da zona
    configuracoes JSONB NOT NULL,
    
    -- Geometria da zona
    coordenadas JSONB, -- Array de pontos que formam a zona
    
    -- Metadados
    ativo BOOLEAN DEFAULT true,
    ordem_prioridade INTEGER DEFAULT 1,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Histórico de cálculos
CREATE TABLE delivery_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    restaurant_id UUID REFERENCES restaurants(id),
    
    -- Coordenadas
    lat_restaurante DECIMAL(10,8),
    lng_restaurante DECIMAL(10,8),
    lat_cliente DECIMAL(10,8),
    lng_cliente DECIMAL(10,8),
    
    -- Distâncias calculadas
    distancia_km_restaurante DECIMAL(8,3),
    distancia_km_cliente DECIMAL(8,3),
    
    -- Cálculo aplicado
    tipo_calculo VARCHAR(30),
    zona_id UUID REFERENCES delivery_zones(id),
    
    -- Valores calculados
    taxa_base DECIMAL(10,2),
    taxa_km_restaurante DECIMAL(10,2),
    taxa_km_cliente DECIMAL(10,2),
    taxa_total DECIMAL(10,2),
    
    -- Comissão aplicada
    comissao_aplicada DECIMAL(5,2),
    valor_comissao DECIMAL(10,2),
    
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎨 **Interface Administrativa Avançada**

### **Painel de Controle Principal:**

```jsx
// src/components/admin/PlatformConfig.jsx
export default function PlatformConfig() {
  const [activeTab, setActiveTab] = useState('comissoes');
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configuração da Plataforma</h1>
        <Badge variant="outline">Aplicado globalmente</Badge>
      </div>

      {/* Tabs de Configuração */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="comissoes">Comissões</TabsTrigger>
          <TabsTrigger value="taxas_entrega">Taxas de Entrega</TabsTrigger>
          <TabsTrigger value="zonas">Zonas de Entrega</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="comissoes">
          <CommissionConfig />
        </TabsContent>

        <TabsContent value="taxas_entrega">
          <DeliveryFeeConfig />
        </TabsContent>

        <TabsContent value="zonas">
          <DeliveryZonesConfig />
        </TabsContent>

        <TabsContent value="relatorios">
          <PlatformReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### **Configuração de Comissões:**

```jsx
// src/components/admin/CommissionConfig.jsx
export default function CommissionConfig() {
  return (
    <div className="space-y-6">
      {/* Comissão Padrão */}
      <Card>
        <CardHeader>
          <CardTitle>Comissão Padrão</CardTitle>
          <CardDescription>
            Comissão aplicada a todos os restaurantes por padrão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Input 
              type="number" 
              value={comissaoPadrao}
              onChange={(e) => setComissaoPadrao(e.target.value)}
              className="w-32"
            />
            <span className="text-2xl">%</span>
            <Badge variant="outline">
              Restaurante recebe: {100 - comissaoPadrao}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Comissões Especiais */}
      <Card>
        <CardHeader>
          <CardTitle>Comissões Especiais por Restaurante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comissoesEspeciais.map(comissao => (
              <div key={comissao.id} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <h4 className="font-semibold">{comissao.restaurant.nome}</h4>
                  <p className="text-sm text-gray-600">{comissao.motivo}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">{comissao.comissao}%</Badge>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Comissão Especial
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comissões por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Comissões por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comissoesPorCategoria.map(categoria => (
              <div key={categoria.id} className="p-4 border rounded">
                <h4 className="font-semibold">{categoria.categoria}</h4>
                <div className="flex items-center space-x-2 mt-2">
                  <Input 
                    type="number" 
                    value={categoria.comissao}
                    className="w-20"
                  />
                  <span>%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### **Configuração de Taxas de Entrega:**

```jsx
// src/components/admin/DeliveryFeeConfig.jsx
export default function DeliveryFeeConfig() {
  const [tipoCalculo, setTipoCalculo] = useState('taxa_fixa');
  
  return (
    <div className="space-y-6">
      {/* Seleção do Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Cálculo de Taxa de Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={tipoCalculo} onValueChange={setTipoCalculo}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="taxa_fixa" id="taxa_fixa" />
                <Label htmlFor="taxa_fixa" className="flex-1">
                  <div className="font-semibold">Taxa Fixa</div>
                  <div className="text-sm text-gray-600">Valor único para todas as entregas</div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="taxa_base_km_restaurante" id="taxa_base_km_restaurante" />
                <Label htmlFor="taxa_base_km_restaurante" className="flex-1">
                  <div className="font-semibold">Taxa Base + KM até Restaurante</div>
                  <div className="text-sm text-gray-600">Baseada na distância do centro até o restaurante</div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="taxa_base_km_cliente" id="taxa_base_km_cliente" />
                <Label htmlFor="taxa_base_km_cliente" className="flex-1">
                  <div className="font-semibold">Taxa Base + KM até Cliente</div>
                  <div className="text-sm text-gray-600">Baseada na distância do restaurante até o cliente</div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="combinada" id="combinada" />
                <Label htmlFor="combinada" className="flex-1">
                  <div className="font-semibold">Taxa Combinada</div>
                  <div className="text-sm text-gray-600">Base + KM restaurante + KM cliente</div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Configurações Específicas */}
      {tipoCalculo === 'taxa_fixa' && <TaxaFixaConfig />}
      {tipoCalculo === 'taxa_base_km_restaurante' && <TaxaBaseKmRestauranteConfig />}
      {tipoCalculo === 'taxa_base_km_cliente' && <TaxaBaseKmClienteConfig />}
      {tipoCalculo === 'combinada' && <TaxaCombinadaConfig />}

      {/* Simulador */}
      <Card>
        <CardHeader>
          <CardTitle>Simulador de Taxas</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryFeeSimulator tipoCalculo={tipoCalculo} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🔧 **Serviços de Cálculo**

### **Serviço de Comissões:**

```typescript
// src/services/CommissionService.ts
export class CommissionService {
  async calculateCommission(restaurantId: string, valorVenda: number): Promise<{
    comissaoAplicada: number;
    valorComissao: number;
    valorRestaurante: number;
  }> {
    // 1. Verificar se há comissão especial para o restaurante
    const comissaoEspecial = await this.getSpecialCommission(restaurantId);
    
    // 2. Se não houver, verificar comissão por categoria
    const comissaoCategoria = await this.getCategoryCommission(restaurantId);
    
    // 3. Usar comissão padrão se não houver outras
    const comissaoPadrao = await this.getDefaultCommission();
    
    // 4. Aplicar a comissão correta
    const comissaoAplicada = comissaoEspecial || comissaoCategoria || comissaoPadrao;
    
    const valorComissao = (valorVenda * comissaoAplicada) / 100;
    const valorRestaurante = valorVenda - valorComissao;
    
    return {
      comissaoAplicada,
      valorComissao,
      valorRestaurante
    };
  }
}
```

### **Serviço de Taxas de Entrega:**

```typescript
// src/services/DeliveryFeeService.ts
export class DeliveryFeeService {
  async calculateDeliveryFee(
    restaurantCoordinates: Coordinates,
    clientCoordinates: Coordinates,
    tipoCalculo: string
  ): Promise<DeliveryFeeCalculation> {
    // 1. Calcular distâncias
    const distanciaRestaurante = await this.distanceService.calculateDistance(
      { lat: 0, lng: 0 }, // Centro da cidade
      restaurantCoordinates
    );
    
    const distanciaCliente = await this.distanceService.calculateDistance(
      restaurantCoordinates,
      clientCoordinates
    );
    
    // 2. Aplicar cálculo baseado no tipo
    switch (tipoCalculo) {
      case 'taxa_fixa':
        return this.calculateFixedFee();
        
      case 'taxa_base_km_restaurante':
        return this.calculateBaseKmRestaurante(distanciaRestaurante.distance);
        
      case 'taxa_base_km_cliente':
        return this.calculateBaseKmCliente(distanciaCliente.distance);
        
      case 'combinada':
        return this.calculateCombined(distanciaRestaurante.distance, distanciaCliente.distance);
        
      default:
        throw new Error('Tipo de cálculo não suportado');
    }
  }
}
```

---

## 📊 **Dashboard e Relatórios**

### **Dashboard Principal:**

```jsx
// src/components/admin/PlatformDashboard.jsx
export default function PlatformDashboard() {
  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">€25,450</div>
            <p className="text-sm text-gray-600">+18% vs mês anterior</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Comissões (30%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">€18,750</div>
            <p className="text-sm text-gray-600">€62,500 em vendas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Taxas de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">€6,200</div>
            <p className="text-sm text-gray-600">2,480 entregas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Taxa Média por Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">€2.50</div>
            <p className="text-sm text-gray-600">por entrega</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receita por Fonte</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Taxas de Entrega por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <DeliveryFeeChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 🚀 **Cronograma de Implementação**

### **Fase 1: Estrutura Base (Semana 1-2)**
- [ ] Criar tabelas do banco de dados
- [ ] Implementar modelos Prisma
- [ ] Configurar Google Maps API
- [ ] Criar serviços básicos

### **Fase 2: Sistema de Comissões (Semana 3)**
- [ ] Implementar CommissionService
- [ ] Interface de configuração de comissões
- [ ] Sistema de comissões especiais
- [ ] Integração com checkout

### **Fase 3: Sistema de Taxas (Semana 4-5)**
- [ ] Implementar DeliveryFeeService
- [ ] 4 tipos de cálculo
- [ ] Interface de configuração
- [ ] Simulador de taxas

### **Fase 4: Interface e Relatórios (Semana 6)**
- [ ] Dashboard administrativo
- [ ] Relatórios de receita
- [ ] Gráficos e métricas
- [ ] Configuração de zonas

### **Fase 5: Testes e Deploy (Semana 7-8)**
- [ ] Testes abrangentes
- [ ] Otimização de performance
- [ ] Deploy em produção
- [ ] Monitoramento

---

## 💡 **Vantagens do Sistema Avançado**

### **Para Você (Admin):**
- ✅ **Controle total** sobre comissões e taxas
- ✅ **Flexibilidade máxima** na precificação
- ✅ **Receita otimizada** baseada em dados
- ✅ **Escalabilidade** para diferentes mercados
- ✅ **Inteligência** com Google Maps

### **Para os Restaurantes:**
- ✅ **Transparência** nas comissões
- ✅ **Possibilidade de negociação** (comissões especiais)
- ✅ **Foco no produto** (não se preocupam com logística)
- ✅ **Receita previsível**

### **Para os Clientes:**
- ✅ **Taxas justas** baseadas na distância real
- ✅ **Transparência** no cálculo
- ✅ **Experiência consistente**
- ✅ **Preços competitivos**

---

## 🎯 **Configuração Recomendada Inicial**

### **Comissões:**
```javascript
const configuracaoInicial = {
  comissao_padrao: 30,
  comissoes_especiais: [],
  comissoes_por_categoria: [
    { categoria: "fast_food", comissao: 28 },
    { categoria: "restaurante_premium", comissao: 25 },
    { categoria: "lanchonete", comissao: 32 }
  ]
};
```

### **Taxas de Entrega:**
```javascript
const configuracaoInicial = {
  tipo_calculo: "taxa_base_km_cliente",
  taxa_base_cliente: 2.00,
  valor_km_cliente: 0.80,
  distancia_maxima_km: 15
};
```

---

**🎯 Objetivo**: Ter um sistema completo e flexível onde você controla tanto as comissões quanto as taxas de entrega, com 4 tipos de cálculo inteligente e integração com Google Maps para máxima precisão e otimização de receita.

Quer que comecemos a implementar essa versão avançada? 🚀
