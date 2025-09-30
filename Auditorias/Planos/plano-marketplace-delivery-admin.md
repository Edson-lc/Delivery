# 🏢 Plano de Negócios - Marketplace de Delivery (Modelo Administrador)

## 🎯 **Visão Geral do Modelo de Negócio**

### **Estrutura da Plataforma:**
- **Você**: Administrador da plataforma (AmaDelivery)
- **Restaurantes**: Parceiros que vendem na sua plataforma
- **Clientes**: Usuários finais que fazem pedidos
- **Comissão**: 30% sobre todas as vendas dos restaurantes
- **Taxa de Entrega**: Definida e controlada pelo administrador

---

## 💰 **Modelo de Receita**

### **Fontes de Receita:**
1. **Comissão de 30%** sobre vendas dos restaurantes
2. **Taxa de entrega** paga pelos clientes
3. **Taxa de serviço** (opcional, 2-5% sobre o pedido)
4. **Taxa de adesão** dos restaurantes (opcional)

### **Exemplo de Fluxo Financeiro:**
```
Pedido do Cliente: €25.00
├── Produtos: €20.00
├── Taxa de Entrega: €3.50 (definida pelo admin)
└── Taxa de Serviço: €1.50 (2% sobre €25.00)

Distribuição:
├── Restaurante recebe: €14.00 (€20.00 - 30% comissão)
├── Plataforma recebe: €6.00 (30% de €20.00)
├── Taxa de Entrega: €3.50 (para custos de entrega)
└── Taxa de Serviço: €1.50 (receita adicional)
```

---

## 🎛️ **Sistema de Taxas de Entrega (Controlado pelo Admin)**

### **Configuração Centralizada:**
Como administrador, você define **UMA** estratégia de taxas de entrega que se aplica a **TODOS** os restaurantes da plataforma.

### **Opções de Configuração:**

#### **1. Taxa Fixa Global**
```javascript
const configuracaoGlobal = {
  tipo: "taxa_fixa",
  valor: 3.50, // €3.50 para todas as entregas
  aplicacao: "todos_restaurantes"
};
```

#### **2. Taxa por Distância (Recomendado)**
```javascript
const configuracaoGlobal = {
  tipo: "taxa_por_distancia",
  configuracoes: {
    taxa_base: 2.00,
    valor_por_km: 0.80,
    km_gratis: 3,
    distancia_maxima: 15 // km
  },
  aplicacao: "todos_restaurantes"
};
```

#### **3. Taxa por Zona (Flexível)**
```javascript
const configuracaoGlobal = {
  tipo: "taxa_por_zona",
  zonas: [
    {
      nome: "Centro da Cidade",
      taxa: 2.50,
      coordenadas: [/* polígono do centro */]
    },
    {
      nome: "Bairros Próximos", 
      taxa: 3.50,
      coordenadas: [/* polígono dos bairros */]
    },
    {
      nome: "Área Periférica",
      taxa: 5.00,
      coordenadas: [/* polígono periférico */]
    }
  ],
  aplicacao: "todos_restaurantes"
};
```

---

## 🏗️ **Arquitetura Simplificada**

### **Estrutura do Banco de Dados:**

```sql
-- Configuração global de taxas (UMA por plataforma)
CREATE TABLE delivery_fee_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_calculo VARCHAR(20) NOT NULL, -- 'fixa', 'por_distancia', 'por_zona'
    
    -- Configurações para taxa fixa
    taxa_fixa DECIMAL(10,2),
    
    -- Configurações para taxa por distância
    taxa_base DECIMAL(10,2),
    valor_por_km DECIMAL(10,2),
    km_gratis DECIMAL(5,2),
    distancia_maxima DECIMAL(5,2),
    
    -- Configurações para taxa por zona
    zonas JSONB, -- Array de zonas com coordenadas e taxas
    
    -- Metadados
    ativo BOOLEAN DEFAULT true,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Histórico de cálculos (para relatórios)
CREATE TABLE delivery_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    restaurant_id UUID REFERENCES restaurants(id),
    
    -- Coordenadas
    lat_restaurante DECIMAL(10,8),
    lng_restaurante DECIMAL(10,8),
    lat_cliente DECIMAL(10,8),
    lng_cliente DECIMAL(10,8),
    
    -- Distâncias
    distancia_km DECIMAL(8,3),
    
    -- Cálculo aplicado
    tipo_calculo VARCHAR(20),
    zona_aplicada VARCHAR(100),
    
    -- Valores
    taxa_calculada DECIMAL(10,2),
    taxa_aplicada DECIMAL(10,2), // Pode ser diferente se houver promoções
    
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎨 **Interface Administrativa**

### **Painel de Controle do Admin:**

```jsx
// src/components/admin/DeliveryFeeManager.jsx
export default function DeliveryFeeManager() {
  const [configuracaoAtual, setConfiguracaoAtual] = useState(null);
  const [tipoSelecionado, setTipoSelecionado] = useState('taxa_fixa');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configuração de Taxas de Entrega</h1>
        <Badge variant="outline">Aplicado a todos os restaurantes</Badge>
      </div>

      {/* Seleção do Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Escolha o Tipo de Cálculo</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={tipoSelecionado} onValueChange={setTipoSelecionado}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="taxa_fixa" id="taxa_fixa" />
              <Label htmlFor="taxa_fixa">Taxa Fixa</Label>
              <span className="text-sm text-gray-500">- Valor único para todas as entregas</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="por_distancia" id="por_distancia" />
              <Label htmlFor="por_distancia">Taxa por Distância</Label>
              <span className="text-sm text-gray-500">- Baseada na distância real</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="por_zona" id="por_zona" />
              <Label htmlFor="por_zona">Taxa por Zona</Label>
              <span className="text-sm text-gray-500">- Diferentes valores por área</span>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Configurações Específicas */}
      {tipoSelecionado === 'taxa_fixa' && <TaxaFixaConfig />}
      {tipoSelecionado === 'por_distancia' && <TaxaPorDistanciaConfig />}
      {tipoSelecionado === 'por_zona' && <TaxaPorZonaConfig />}

      {/* Preview e Simulador */}
      <Card>
        <CardHeader>
          <CardTitle>Simulador de Taxas</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryFeeSimulator configuracao={configuracaoAtual} />
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <Button onClick={salvarConfiguracao} className="bg-green-600">
          Salvar Configuração
        </Button>
        <Button variant="outline" onClick={testarConfiguracao}>
          Testar com Pedidos Reais
        </Button>
      </div>
    </div>
  );
}
```

---

## 📊 **Relatórios e Métricas**

### **Dashboard Administrativo:**

```jsx
// src/components/admin/DeliveryDashboard.jsx
export default function DeliveryDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Receita Total */}
      <Card>
        <CardHeader>
          <CardTitle>Receita Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">€12,450</div>
          <p className="text-sm text-gray-600">+15% vs mês anterior</p>
        </CardContent>
      </Card>

      {/* Comissões dos Restaurantes */}
      <Card>
        <CardHeader>
          <CardTitle>Comissões (30%)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">€8,750</div>
          <p className="text-sm text-gray-600">€29,167 em vendas</p>
        </CardContent>
      </Card>

      {/* Taxas de Entrega */}
      <Card>
        <CardHeader>
          <CardTitle>Taxas de Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">€3,200</div>
          <p className="text-sm text-gray-600">1,280 entregas</p>
        </CardContent>
      </Card>

      {/* Taxa Média por Entrega */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa Média</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">€2.50</div>
          <p className="text-sm text-gray-600">por entrega</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🚀 **Implementação Simplificada**

### **Fase 1: Estrutura Base (Semana 1)**
- [ ] Criar tabela `delivery_fee_config`
- [ ] Criar tabela `delivery_calculations`
- [ ] Interface administrativa básica
- [ ] API para configuração de taxas

### **Fase 2: Cálculo de Taxas (Semana 2)**
- [ ] Integração Google Maps
- [ ] Algoritmos de cálculo
- [ ] Sistema de cache
- [ ] Integração com checkout

### **Fase 3: Interface e Relatórios (Semana 3)**
- [ ] Dashboard administrativo
- [ ] Simulador de taxas
- [ ] Relatórios de receita
- [ ] Configuração de zonas (se necessário)

### **Fase 4: Testes e Deploy (Semana 4)**
- [ ] Testes com dados reais
- [ ] Otimização de performance
- [ ] Deploy em produção
- [ ] Monitoramento

---

## 💡 **Vantagens do Modelo Simplificado**

### **Para Você (Admin):**
- ✅ **Controle total** sobre as taxas de entrega
- ✅ **Receita previsível** (30% + taxas de entrega)
- ✅ **Implementação mais simples** e rápida
- ✅ **Menos complexidade** técnica
- ✅ **Foco na receita** principal (comissões)

### **Para os Restaurantes:**
- ✅ **Simplicidade** - não precisam configurar nada
- ✅ **Foco no produto** - não se preocupam com logística
- ✅ **Transparência** - sabem exatamente quanto recebem
- ✅ **Menos trabalho** administrativo

### **Para os Clientes:**
- ✅ **Consistência** - mesma experiência em todos os restaurantes
- ✅ **Transparência** - taxas claras e previsíveis
- ✅ **Simplicidade** - não precisam entender diferentes sistemas

---

## 🎯 **Configuração Recomendada**

### **Para Começar (Taxa Fixa):**
```javascript
const configuracaoInicial = {
  tipo: "taxa_fixa",
  taxa_fixa: 3.50,
  ativo: true
};
```

### **Para Escalar (Taxa por Distância):**
```javascript
const configuracaoEscalada = {
  tipo: "por_distancia",
  taxa_base: 2.00,
  valor_por_km: 0.80,
  km_gratis: 3,
  distancia_maxima: 15
};
```

### **Para Otimizar (Taxa por Zona):**
```javascript
const configuracaoOtimizada = {
  tipo: "por_zona",
  zonas: [
    { nome: "Centro", taxa: 2.50 },
    { nome: "Bairros", taxa: 3.50 },
    { nome: "Periferia", taxa: 5.00 }
  ]
};
```

---

## 📋 **Próximos Passos**

### **Imediato:**
1. ✅ Definir estratégia de taxas (recomendo começar com taxa fixa)
2. ✅ Criar estrutura do banco de dados
3. ✅ Implementar interface administrativa
4. ✅ Integrar com sistema de checkout existente

### **Curto Prazo:**
1. Implementar cálculo de distâncias
2. Adicionar relatórios de receita
3. Otimizar baseado em dados reais
4. Considerar taxa por zona se necessário

---

**🎯 Objetivo**: Ter um sistema simples e eficiente onde você controla todas as taxas de entrega, focando na receita principal das comissões dos restaurantes (30%) + taxas de entrega dos clientes.

Quer que comecemos a implementar essa versão simplificada? 🚀
