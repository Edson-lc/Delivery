# 🗺️ Especificação Técnica - Sistema de Taxas de Entrega

## 📋 **Visão Geral**
Este documento detalha a implementação técnica do sistema de taxas de entrega inteligente, incluindo estrutura de dados, APIs, algoritmos e interfaces.

---

## 🗄️ **Estrutura do Banco de Dados**

### **1. Tabela: `delivery_zones`**

```sql
-- Zonas de entrega configuráveis por restaurante
CREATE TABLE delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Identificação da zona
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    
    -- Tipo de cálculo de taxa
    tipo_calculo VARCHAR(20) NOT NULL CHECK (tipo_calculo IN (
        'fixa', 
        'km_restaurante', 
        'km_cliente', 
        'combinada'
    )),
    
    -- Configurações para Taxa Fixa
    taxa_fixa DECIMAL(10,2) DEFAULT 0,
    
    -- Configurações para Taxa por KM até Restaurante
    valor_km_restaurante DECIMAL(10,2) DEFAULT 0,
    raio_maximo_km DECIMAL(5,2) DEFAULT 0,
    
    -- Configurações para Taxa por KM até Cliente
    valor_km_cliente DECIMAL(10,2) DEFAULT 0,
    
    -- Configurações para Taxa Combinada
    taxa_base DECIMAL(10,2) DEFAULT 0,
    valor_km_adicional DECIMAL(10,2) DEFAULT 0,
    km_gratis DECIMAL(5,2) DEFAULT 0,
    
    -- Configurações da zona
    ativo BOOLEAN DEFAULT true,
    ordem_prioridade INTEGER DEFAULT 1,
    
    -- Geometria da zona (polígono)
    coordenadas JSONB, -- Array de pontos: [{lat, lng}, {lat, lng}, ...]
    
    -- Metadados
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

-- Índices
CREATE INDEX idx_delivery_zones_restaurant ON delivery_zones(restaurant_id);
CREATE INDEX idx_delivery_zones_ativo ON delivery_zones(ativo);
CREATE INDEX idx_delivery_zones_prioridade ON delivery_zones(restaurant_id, ordem_prioridade);
```

### **2. Tabela: `delivery_calculations`**

```sql
-- Histórico de cálculos de entrega
CREATE TABLE delivery_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    
    -- Coordenadas utilizadas no cálculo
    lat_restaurante DECIMAL(10,8) NOT NULL,
    lng_restaurante DECIMAL(10,8) NOT NULL,
    lat_cliente DECIMAL(10,8) NOT NULL,
    lng_cliente DECIMAL(10,8) NOT NULL,
    
    -- Endereços utilizados
    endereco_restaurante TEXT,
    endereco_cliente TEXT,
    
    -- Distâncias calculadas (em km)
    distancia_km_restaurante DECIMAL(8,3), -- Centro até restaurante
    distancia_km_cliente DECIMAL(8,3),     -- Restaurante até cliente
    distancia_total_km DECIMAL(8,3),      -- Total da rota
    
    -- Tempos estimados (em minutos)
    tempo_estimado_minutos INTEGER,
    tempo_trafico_minutos INTEGER,
    
    -- Cálculo aplicado
    zona_id UUID REFERENCES delivery_zones(id),
    tipo_calculo VARCHAR(20),
    
    -- Valores calculados
    taxa_base DECIMAL(10,2) DEFAULT 0,
    taxa_km_restaurante DECIMAL(10,2) DEFAULT 0,
    taxa_km_cliente DECIMAL(10,2) DEFAULT 0,
    taxa_total DECIMAL(10,2) NOT NULL,
    
    -- Metadados do cálculo
    api_usada VARCHAR(50), -- 'google', 'fallback', 'cache'
    cache_hit BOOLEAN DEFAULT false,
    tempo_calculo_ms INTEGER,
    
    -- Observações
    observacoes TEXT,
    
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_delivery_calculations_order ON delivery_calculations(order_id);
CREATE INDEX idx_delivery_calculations_restaurant ON delivery_calculations(restaurant_id);
CREATE INDEX idx_delivery_calculations_date ON delivery_calculations(created_date);
```

### **3. Tabela: `delivery_cache`**

```sql
-- Cache de cálculos para performance
CREATE TABLE delivery_calculation_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Chave do cache (hash das coordenadas)
    cache_key VARCHAR(64) UNIQUE NOT NULL,
    
    -- Coordenadas
    lat_origem DECIMAL(10,8) NOT NULL,
    lng_origem DECIMAL(10,8) NOT NULL,
    lat_destino DECIMAL(10,8) NOT NULL,
    lng_destino DECIMAL(10,8) NOT NULL,
    
    -- Resultado em cache
    distancia_km DECIMAL(8,3) NOT NULL,
    tempo_minutos INTEGER NOT NULL,
    
    -- Metadados
    api_usada VARCHAR(50),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_delivery_cache_key ON delivery_calculation_cache(cache_key);
CREATE INDEX idx_delivery_cache_expires ON delivery_calculation_cache(expires_at);
```

---

## 🔧 **APIs e Serviços**

### **1. Serviço de Cálculo de Distâncias**

```typescript
// src/services/DistanceService.ts
export interface DistanceResult {
  distance: number; // em km
  duration: number; // em minutos
  apiUsed: 'google' | 'fallback' | 'cache';
  fromCache: boolean;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export class DistanceService {
  private googleMapsClient: any;
  private cacheService: CacheService;

  async calculateDistance(
    origin: Coordinates, 
    destination: Coordinates
  ): Promise<DistanceResult> {
    // 1. Verificar cache primeiro
    const cached = await this.cacheService.get(origin, destination);
    if (cached) {
      return { ...cached, fromCache: true, apiUsed: 'cache' };
    }

    // 2. Tentar Google Maps API
    try {
      const result = await this.calculateWithGoogleMaps(origin, destination);
      await this.cacheService.set(origin, destination, result);
      return { ...result, fromCache: false, apiUsed: 'google' };
    } catch (error) {
      // 3. Fallback para cálculo aproximado
      const result = await this.calculateFallback(origin, destination);
      return { ...result, fromCache: false, apiUsed: 'fallback' };
    }
  }

  private async calculateWithGoogleMaps(
    origin: Coordinates, 
    destination: Coordinates
  ): Promise<{ distance: number; duration: number }> {
    const response = await this.googleMapsClient.distanceMatrix({
      origins: [`${origin.lat},${origin.lng}`],
      destinations: [`${destination.lat},${destination.lng}`],
      units: 'metric',
      mode: 'driving'
    });

    const element = response.rows[0].elements[0];
    return {
      distance: element.distance.value / 1000, // converter para km
      duration: Math.ceil(element.duration.value / 60) // converter para minutos
    };
  }

  private calculateFallback(
    origin: Coordinates, 
    destination: Coordinates
  ): { distance: number; duration: number } {
    // Fórmula de Haversine para distância aproximada
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(destination.lat - origin.lat);
    const dLng = this.toRad(destination.lng - origin.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(origin.lat)) * Math.cos(this.toRad(destination.lat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Estimativa de tempo baseada na distância (30km/h média)
    const duration = Math.ceil(distance * 2);
    
    return { distance, duration };
  }

  private toRad(deg: number): number {
    return deg * (Math.PI/180);
  }
}
```

### **2. Serviço de Cálculo de Taxas**

```typescript
// src/services/DeliveryFeeService.ts
export interface DeliveryFeeCalculation {
  zonaId: string;
  tipoCalculo: string;
  distanciaKmRestaurante: number;
  distanciaKmCliente: number;
  taxaBase: number;
  taxaKmRestaurante: number;
  taxaKmCliente: number;
  taxaTotal: number;
  tempoEstimado: number;
}

export class DeliveryFeeService {
  private distanceService: DistanceService;
  private prisma: PrismaClient;

  async calculateDeliveryFee(
    restaurantId: string,
    clientCoordinates: Coordinates,
    restaurantCoordinates: Coordinates
  ): Promise<DeliveryFeeCalculation> {
    // 1. Buscar zonas de entrega ativas para o restaurante
    const zonas = await this.prisma.deliveryZone.findMany({
      where: {
        restaurantId,
        ativo: true
      },
      orderBy: { ordemPrioridade: 'asc' }
    });

    // 2. Calcular distâncias
    const distanciaRestaurante = await this.distanceService.calculateDistance(
      { lat: 0, lng: 0 }, // Centro da cidade (configurável)
      restaurantCoordinates
    );

    const distanciaCliente = await this.distanceService.calculateDistance(
      restaurantCoordinates,
      clientCoordinates
    );

    // 3. Encontrar zona aplicável
    const zonaAplicavel = this.findApplicableZone(
      zonas, 
      distanciaRestaurante.distance, 
      distanciaCliente.distance
    );

    if (!zonaAplicavel) {
      throw new Error('Cliente fora da zona de entrega');
    }

    // 4. Calcular taxa baseada no tipo
    const calculo = await this.calculateFeeByType(
      zonaAplicavel,
      distanciaRestaurante.distance,
      distanciaCliente.distance
    );

    // 5. Salvar cálculo no histórico
    await this.saveCalculation({
      restaurantId,
      clientCoordinates,
      restaurantCoordinates,
      zonaAplicavel,
      calculo
    });

    return calculo;
  }

  private findApplicableZone(
    zonas: DeliveryZone[], 
    distanciaRestaurante: number, 
    distanciaCliente: number
  ): DeliveryZone | null {
    for (const zona of zonas) {
      switch (zona.tipoCalculo) {
        case 'fixa':
          return zona;
          
        case 'km_restaurante':
          if (distanciaRestaurante <= zona.raioMaximoKm) {
            return zona;
          }
          break;
          
        case 'km_cliente':
          return zona;
          
        case 'combinada':
          return zona;
      }
    }
    return null;
  }

  private async calculateFeeByType(
    zona: DeliveryZone,
    distanciaRestaurante: number,
    distanciaCliente: number
  ): Promise<DeliveryFeeCalculation> {
    let taxaBase = 0;
    let taxaKmRestaurante = 0;
    let taxaKmCliente = 0;

    switch (zona.tipoCalculo) {
      case 'fixa':
        taxaBase = zona.taxaFixa;
        break;

      case 'km_restaurante':
        taxaKmRestaurante = distanciaRestaurante * zona.valorKmRestaurante;
        break;

      case 'km_cliente':
        taxaKmCliente = distanciaCliente * zona.valorKmCliente;
        break;

      case 'combinada':
        taxaBase = zona.taxaBase;
        const kmCobrados = Math.max(0, distanciaCliente - zona.kmGratis);
        taxaKmCliente = kmCobrados * zona.valorKmAdicional;
        break;
    }

    const taxaTotal = taxaBase + taxaKmRestaurante + taxaKmCliente;

    return {
      zonaId: zona.id,
      tipoCalculo: zona.tipoCalculo,
      distanciaKmRestaurante,
      distanciaKmCliente,
      taxaBase,
      taxaKmRestaurante,
      taxaKmCliente,
      taxaTotal,
      tempoEstimado: Math.ceil(distanciaCliente * 2) // Estimativa simples
    };
  }
}
```

---

## 🌐 **Endpoints da API**

### **1. Cálculo de Taxa de Entrega**

```typescript
// POST /api/delivery/calculate-fee
export interface CalculateFeeRequest {
  restaurantId: string;
  clientAddress: string;
  clientCoordinates?: {
    lat: number;
    lng: number;
  };
}

export interface CalculateFeeResponse {
  success: boolean;
  data: {
    taxaTotal: number;
    breakdown: {
      taxaBase: number;
      taxaKmRestaurante: number;
      taxaKmCliente: number;
    };
    distanciaKm: number;
    tempoEstimado: number;
    zonaAplicada: string;
  };
  error?: string;
}
```

### **2. Configuração de Zonas**

```typescript
// GET /api/delivery/zones/:restaurantId
export interface DeliveryZonesResponse {
  zones: Array<{
    id: string;
    nome: string;
    tipoCalculo: string;
    ativo: boolean;
    configuracoes: any;
  }>;
}

// POST /api/delivery/zones
export interface CreateZoneRequest {
  restaurantId: string;
  nome: string;
  tipoCalculo: 'fixa' | 'km_restaurante' | 'km_cliente' | 'combinada';
  configuracoes: {
    taxaFixa?: number;
    valorKmRestaurante?: number;
    raioMaximoKm?: number;
    valorKmCliente?: number;
    taxaBase?: number;
    valorKmAdicional?: number;
    kmGratis?: number;
  };
  coordenadas?: Array<{ lat: number; lng: number }>;
}
```

---

## 🎨 **Interface do Usuário**

### **1. Componente de Cálculo de Taxa**

```jsx
// src/components/delivery/DeliveryFeeCalculator.jsx
export default function DeliveryFeeCalculator({ 
  restaurantId, 
  clientAddress, 
  onFeeCalculated 
}) {
  const [loading, setLoading] = useState(false);
  const [feeData, setFeeData] = useState(null);
  const [error, setError] = useState(null);

  const calculateFee = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/delivery/calculate-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          clientAddress
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setFeeData(result.data);
        onFeeCalculated(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Erro ao calcular taxa de entrega');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa de Entrega</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <Loader2 className="animate-spin" />}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {feeData && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Taxa Base:</span>
              <span>€{feeData.breakdown.taxaBase.toFixed(2)}</span>
            </div>
            
            {feeData.breakdown.taxaKmRestaurante > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Taxa por KM (Restaurante):</span>
                <span>€{feeData.breakdown.taxaKmRestaurante.toFixed(2)}</span>
              </div>
            )}
            
            {feeData.breakdown.taxaKmCliente > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Taxa por KM (Cliente):</span>
                <span>€{feeData.breakdown.taxaKmCliente.toFixed(2)}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>€{feeData.taxaTotal.toFixed(2)}</span>
            </div>
            
            <div className="text-sm text-gray-600">
              <Clock className="w-4 h-4 inline mr-1" />
              Tempo estimado: {feeData.tempoEstimado} min
            </div>
          </div>
        )}
        
        <Button 
          onClick={calculateFee} 
          disabled={loading || !clientAddress}
          className="w-full mt-4"
        >
          Calcular Taxa de Entrega
        </Button>
      </CardContent>
    </Card>
  );
}
```

### **2. Interface Administrativa**

```jsx
// src/components/admin/DeliveryZonesManager.jsx
export default function DeliveryZonesManager({ restaurantId }) {
  const [zones, setZones] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Zonas de Entrega</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Zona
        </Button>
      </div>
      
      <div className="grid gap-4">
        {zones.map(zone => (
          <Card key={zone.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{zone.nome}</h3>
                  <p className="text-sm text-gray-600">
                    Tipo: {zone.tipoCalculo}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {zone.ativo ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {showCreateForm && (
        <CreateZoneForm 
          restaurantId={restaurantId}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            // Recarregar zonas
          }}
        />
      )}
    </div>
  );
}
```

---

## 🧪 **Testes**

### **1. Testes Unitários**

```typescript
// tests/services/DeliveryFeeService.test.ts
describe('DeliveryFeeService', () => {
  let service: DeliveryFeeService;
  
  beforeEach(() => {
    service = new DeliveryFeeService();
  });

  describe('calculateDeliveryFee', () => {
    it('should calculate fixed fee correctly', async () => {
      const mockZone = {
        id: 'zone-1',
        tipoCalculo: 'fixa',
        taxaFixa: 2.50
      };
      
      const result = await service.calculateDeliveryFee(
        'restaurant-1',
        { lat: 40.7128, lng: -74.0060 },
        { lat: 40.7589, lng: -73.9851 }
      );
      
      expect(result.taxaTotal).toBe(2.50);
      expect(result.tipoCalculo).toBe('fixa');
    });

    it('should calculate km-based fee correctly', async () => {
      const mockZone = {
        id: 'zone-2',
        tipoCalculo: 'km_cliente',
        valorKmCliente: 1.20
      };
      
      const result = await service.calculateDeliveryFee(
        'restaurant-1',
        { lat: 40.7128, lng: -74.0060 },
        { lat: 40.7589, lng: -73.9851 }
      );
      
      // Assumindo distância de 5km
      expect(result.taxaTotal).toBe(6.00); // 5km * €1.20
    });
  });
});
```

### **2. Testes de Integração**

```typescript
// tests/integration/delivery-api.test.ts
describe('Delivery API Integration', () => {
  it('should calculate delivery fee end-to-end', async () => {
    const response = await request(app)
      .post('/api/delivery/calculate-fee')
      .send({
        restaurantId: 'restaurant-1',
        clientAddress: 'Rua Teste, 123, Amarante'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.taxaTotal).toBeGreaterThan(0);
    expect(response.body.data.tempoEstimado).toBeGreaterThan(0);
  });
});
```

---

## 📊 **Monitoramento e Métricas**

### **1. Métricas de Performance**

```typescript
// src/middleware/DeliveryMetrics.ts
export class DeliveryMetrics {
  static async recordCalculation(
    restaurantId: string,
    calculationTime: number,
    apiUsed: string,
    fromCache: boolean
  ) {
    // Registrar métricas no banco ou sistema de monitoramento
    await prisma.deliveryCalculation.create({
      data: {
        restaurantId,
        tempoCalculoMs: calculationTime,
        apiUsada: apiUsed,
        cacheHit: fromCache
      }
    });
  }

  static async getMetrics(restaurantId: string, period: string) {
    return await prisma.deliveryCalculation.aggregate({
      where: {
        restaurantId,
        createdDate: {
          gte: this.getPeriodStart(period)
        }
      },
      _avg: {
        tempoCalculoMs: true
      },
      _count: {
        id: true
      }
    });
  }
}
```

### **2. Dashboard de Métricas**

```jsx
// src/components/admin/DeliveryMetricsDashboard.jsx
export default function DeliveryMetricsDashboard({ restaurantId }) {
  const [metrics, setMetrics] = useState(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Cálculos por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics?.calculationsPerDay || 0}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tempo Médio de Cálculo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics?.avgCalculationTime || 0}ms
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Cache</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics?.cacheHitRate || 0}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🚀 **Deploy e Configuração**

### **1. Variáveis de Ambiente**

```env
# Google Maps API
GOOGLE_MAPS_API_KEY=your_api_key_here
GOOGLE_MAPS_API_URL=https://maps.googleapis.com/maps/api

# Configurações de Cache
DELIVERY_CACHE_TTL=86400 # 24 horas em segundos
DELIVERY_CACHE_MAX_SIZE=10000

# Configurações de Rate Limiting
DELIVERY_RATE_LIMIT_PER_MINUTE=60
DELIVERY_RATE_LIMIT_PER_HOUR=1000

# Configurações de Fallback
DELIVERY_FALLBACK_ENABLED=true
DELIVERY_FALLBACK_ACCURACY_THRESHOLD=0.8
```

### **2. Scripts de Deploy**

```bash
#!/bin/bash
# deploy-delivery-system.sh

echo "🚀 Deploying Delivery Fee System..."

# 1. Executar migrações
echo "📊 Running database migrations..."
npx prisma migrate deploy

# 2. Gerar Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# 3. Executar testes
echo "🧪 Running tests..."
npm run test:delivery

# 4. Build da aplicação
echo "🏗️ Building application..."
npm run build

# 5. Restart dos serviços
echo "🔄 Restarting services..."
pm2 restart delivery-api

echo "✅ Deployment completed successfully!"
```

---

## 📋 **Checklist de Implementação**

### **Fase 1: Estrutura Base**
- [ ] Criar tabelas no banco de dados
- [ ] Implementar modelos Prisma
- [ ] Configurar Google Maps API
- [ ] Criar serviços básicos

### **Fase 2: APIs e Cálculos**
- [ ] Implementar DistanceService
- [ ] Implementar DeliveryFeeService
- [ ] Criar endpoints da API
- [ ] Implementar sistema de cache

### **Fase 3: Interface do Usuário**
- [ ] Componente de cálculo de taxa
- [ ] Interface administrativa
- [ ] Dashboard de métricas
- [ ] Integração com checkout

### **Fase 4: Testes e Deploy**
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Configuração de monitoramento
- [ ] Deploy em produção

---

**🎯 Próximo Passo**: Começar pela Fase 1, criando a estrutura base do banco de dados e os modelos Prisma.
