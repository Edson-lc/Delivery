# 📋 Plano de Negócios - Sistema de Taxas de Entrega Inteligente

## 🎯 **Objetivo**
Implementar um sistema flexível de cálculo de taxas de entrega que permita diferentes estratégias de precificação baseadas em:
- Taxa fixa
- Valor por km até o estabelecimento
- Valor por km até o cliente (entrega)

---

## 📊 **Análise de Mercado**

### **Cenários de Uso**
1. **Restaurantes Centrais**: Taxa fixa para área urbana
2. **Restaurantes Periféricos**: Taxa por km até o estabelecimento
3. **Entregas Longas**: Taxa por km até o cliente
4. **Combinações**: Taxa fixa + km adicional

### **Vantagens Competitivas**
- ✅ Flexibilidade para diferentes tipos de estabelecimento
- ✅ Precificação justa baseada na distância real
- ✅ Transparência para o cliente
- ✅ Otimização de rotas e custos operacionais

---

## 🏗️ **Arquitetura do Sistema**

### **1. Estrutura de Dados**

#### **Tabela: `delivery_zones` (Zonas de Entrega)**
```sql
CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id),
    nome VARCHAR(100) NOT NULL,
    tipo_calculo VARCHAR(20) NOT NULL, -- 'fixa', 'km_restaurante', 'km_cliente', 'combinada'
    
    -- Taxa Fixa
    taxa_fixa DECIMAL(10,2) DEFAULT 0,
    
    -- Taxa por KM até Restaurante
    valor_km_restaurante DECIMAL(10,2) DEFAULT 0,
    raio_maximo_km DECIMAL(5,2) DEFAULT 0, -- Raio máximo para cobrança
    
    -- Taxa por KM até Cliente
    valor_km_cliente DECIMAL(10,2) DEFAULT 0,
    
    -- Taxa Combinada
    taxa_base DECIMAL(10,2) DEFAULT 0,
    valor_km_adicional DECIMAL(10,2) DEFAULT 0,
    km_gratis DECIMAL(5,2) DEFAULT 0, -- KM gratuitos
    
    -- Configurações
    ativo BOOLEAN DEFAULT true,
    ordem_prioridade INTEGER DEFAULT 1,
    
    -- Coordenadas da zona (para validação)
    coordenadas JSONB, -- Array de pontos que formam a zona
    
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Tabela: `delivery_calculations` (Cálculos de Entrega)**
```sql
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
    distancia_km_restaurante DECIMAL(8,3), -- KM do centro até restaurante
    distancia_km_cliente DECIMAL(8,3),     -- KM do restaurante até cliente
    
    -- Cálculo aplicado
    zona_id UUID REFERENCES delivery_zones(id),
    tipo_calculo VARCHAR(20),
    
    -- Valores calculados
    taxa_base DECIMAL(10,2),
    taxa_km_restaurante DECIMAL(10,2),
    taxa_km_cliente DECIMAL(10,2),
    taxa_total DECIMAL(10,2),
    
    -- Metadados
    tempo_estimado_minutos INTEGER,
    observacoes TEXT,
    
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **2. Tipos de Cálculo**

#### **A) Taxa Fixa**
```javascript
const calcularTaxaFixa = (zona) => {
    return zona.taxa_fixa;
};
```

#### **B) Taxa por KM até Restaurante**
```javascript
const calcularTaxaKmRestaurante = (zona, distanciaKm) => {
    if (distanciaKm <= zona.raio_maximo_km) {
        return distanciaKm * zona.valor_km_restaurante;
    }
    return null; // Fora da zona de entrega
};
```

#### **C) Taxa por KM até Cliente**
```javascript
const calcularTaxaKmCliente = (zona, distanciaKm) => {
    return distanciaKm * zona.valor_km_cliente;
};
```

#### **D) Taxa Combinada**
```javascript
const calcularTaxaCombinada = (zona, distanciaKm) => {
    const kmCobrados = Math.max(0, distanciaKm - zona.km_gratis);
    return zona.taxa_base + (kmCobrados * zona.valor_km_adicional);
};
```

---

## 🚀 **Implementação por Fases**

### **Fase 1: Estrutura Base (Semana 1-2)**
- [ ] Criar tabelas no banco de dados
- [ ] Implementar modelos Prisma
- [ ] Criar APIs básicas para zonas de entrega
- [ ] Interface administrativa para configurar zonas

### **Fase 2: Cálculo de Distâncias (Semana 3-4)**
- [ ] Integração com Google Maps API
- [ ] Serviço de cálculo de distâncias
- [ ] Validação de coordenadas
- [ ] Cache de cálculos para performance

### **Fase 3: Sistema de Taxas (Semana 5-6)**
- [ ] Implementar algoritmos de cálculo
- [ ] Integração com checkout
- [ ] Validação de zonas de entrega
- [ ] Testes de diferentes cenários

### **Fase 4: Interface e UX (Semana 7-8)**
- [ ] Interface para configurar zonas
- [ ] Exibição de taxas no checkout
- [ ] Relatórios de entregas
- [ ] Dashboard de métricas

---

## 💰 **Modelos de Precificação**

### **1. Restaurante Central (Taxa Fixa)**
```
Zona: Centro da Cidade
Taxa Fixa: €2.50
Aplicação: Restaurantes no centro comercial
```

### **2. Restaurante Periférico (KM até Restaurante)**
```
Zona: Área Metropolitana
Valor por KM: €0.80
Raio Máximo: 15km
Exemplo: 8km = €6.40
```

### **3. Entrega Longa (KM até Cliente)**
```
Zona: Entregas Especiais
Valor por KM: €1.20
Sem limite de distância
Exemplo: 12km = €14.40
```

### **4. Modelo Combinado**
```
Taxa Base: €3.00
KM Gratuitos: 5km
Valor KM Adicional: €0.60
Exemplo: 8km = €3.00 + (3km × €0.60) = €4.80
```

---

## 🔧 **Configurações Técnicas**

### **APIs Necessárias**
1. **Google Maps Distance Matrix API**
   - Cálculo de distâncias reais
   - Tempo de viagem estimado
   - Rotas otimizadas

2. **Google Maps Geocoding API**
   - Conversão de endereços em coordenadas
   - Validação de endereços

### **Configurações de Performance**
- Cache de cálculos por 24h
- Rate limiting para APIs externas
- Fallback para cálculos aproximados
- Compressão de dados de rotas

---

## 📈 **Métricas e KPIs**

### **Métricas Operacionais**
- Tempo médio de cálculo de taxa
- Precisão das distâncias calculadas
- Taxa de erro em entregas
- Satisfação do cliente com transparência

### **Métricas Financeiras**
- Receita por zona de entrega
- Custo operacional por entrega
- Margem de lucro por tipo de cálculo
- Comparação com concorrentes

---

## 🎨 **Interface do Usuário**

### **Para Administradores**
- Mapa interativo para definir zonas
- Configuração de parâmetros por zona
- Relatórios de performance
- Simulador de taxas

### **Para Clientes**
- Exibição clara da taxa no checkout
- Breakdown do cálculo (base + km)
- Estimativa de tempo de entrega
- Histórico de entregas

### **Para Entregadores**
- App com rotas otimizadas
- Informações de distância e tempo
- Tracking em tempo real
- Relatórios de performance

---

## 🔒 **Considerações de Segurança**

### **Validação de Dados**
- Verificação de coordenadas válidas
- Limites de distância razoáveis
- Validação de valores monetários
- Prevenção de manipulação de taxas

### **Rate Limiting**
- Limite de requisições por usuário
- Cache inteligente para evitar recálculos
- Fallback para cenários de erro
- Monitoramento de uso de APIs

---

## 📋 **Próximos Passos**

### **Imediato (Esta Semana)**
1. ✅ Definir estrutura do banco de dados
2. ✅ Criar modelos Prisma
3. ✅ Planejar APIs necessárias
4. ✅ Definir interface administrativa

### **Curto Prazo (Próximas 2 Semanas)**
1. Implementar APIs básicas
2. Criar interface de configuração
3. Integrar Google Maps API
4. Testes básicos de cálculo

### **Médio Prazo (1 Mês)**
1. Sistema completo funcionando
2. Interface administrativa completa
3. Relatórios e métricas
4. Testes com usuários reais

---

## 💡 **Inovações Futuras**

### **IA e Machine Learning**
- Predição de tempo de entrega
- Otimização automática de rotas
- Ajuste dinâmico de taxas por demanda
- Detecção de padrões de entrega

### **Integrações Avançadas**
- Sistema de entregadores independentes
- Integração com apps de navegação
- Sistema de avaliação de entregadores
- Programa de fidelidade

---

**🎯 Objetivo Final**: Criar o sistema de taxas de entrega mais inteligente e flexível do mercado, proporcionando transparência para clientes e otimização de custos para restaurantes.
