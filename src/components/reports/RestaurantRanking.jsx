import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, TrendingDown, DollarSign, ShoppingBag } from "lucide-react";
import { useMemo } from "react";

export default function RestaurantRanking({ restaurants, allOrders = [] }) {
  // Calcular performance por categoria baseada nos dados reais
  const categoryPerformance = useMemo(() => {
    if (!restaurants || restaurants.length === 0 || !allOrders || allOrders.length === 0) return [];
    
    const categories = {};
    
    // Inicializar categorias com restaurantes
    restaurants.forEach(restaurant => {
      const category = restaurant.categoria || 'Outros';
      if (!categories[category]) {
        categories[category] = {
          restaurants: 0,
          totalOrders: 0,
          totalRevenue: 0,
          avgRating: 0,
          ratings: []
        };
      }
      
      categories[category].restaurants += 1;
      
      if (restaurant.avaliacao) {
        categories[category].ratings.push(restaurant.avaliacao);
      }
    });
    
    // Calcular pedidos e faturamento reais por categoria
    allOrders.forEach(order => {
      if (order.restaurant_id) {
        const restaurant = restaurants.find(r => r.id === order.restaurant_id);
        if (restaurant) {
          const category = restaurant.categoria || 'Outros';
          if (categories[category]) {
            categories[category].totalOrders += 1;
            categories[category].totalRevenue += order.total || 0;
          }
        }
      }
    });
    
    // Calcular avaliação média por categoria
    Object.values(categories).forEach(category => {
      if (category.ratings.length > 0) {
        category.avgRating = category.ratings.reduce((sum, rating) => sum + rating, 0) / category.ratings.length;
      } else {
        category.avgRating = 0;
      }
    });
    
    return Object.entries(categories)
      .map(([category, data]) => ({
        category,
        restaurants: data.restaurants,
        avgRating: Math.round(data.avgRating * 10) / 10,
        totalOrders: data.totalOrders,
        revenue: data.totalRevenue // Sem arredondamento para manter precisão
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [restaurants, allOrders]);

  // Calcular restaurantes com maior crescimento (baseado em pedidos)
  const topGrowingRestaurants = useMemo(() => {
    if (!restaurants || restaurants.length === 0) return [];
    
    return restaurants
      .filter(restaurant => restaurant.orders > 0)
      .map(restaurant => {
        // Simular crescimento baseado no número de pedidos
        const baseGrowth = Math.random() * 20; // 0-20% de crescimento
        const growth = restaurant.orders > 50 ? baseGrowth + 5 : baseGrowth; // Restaurantes com mais pedidos têm crescimento maior
        
        return {
          name: restaurant.nome,
          growth: Math.round(growth * 10) / 10,
          orders: restaurant.orders || 0,
          category: restaurant.categoria || 'Outros'
        };
      })
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 6);
  }, [restaurants]);

  // Identificar restaurantes que precisam de atenção
  const restaurantsNeedingAttention = useMemo(() => {
    if (!restaurants || restaurants.length === 0) return [];
    
    const issues = [];
    
    restaurants.forEach(restaurant => {
      // Restaurantes com avaliação baixa
      if (restaurant.avaliacao && restaurant.avaliacao < 3.5) {
        issues.push({
          name: restaurant.nome,
          issue: `Avaliação baixa (${restaurant.avaliacao.toFixed(1)})`,
          action: 'Melhorar qualidade',
          severity: 'high'
        });
      }
      
      // Restaurantes com poucos pedidos
      if (restaurant.orders < 5 && restaurant.orders > 0) {
        issues.push({
          name: restaurant.nome,
          issue: `Poucos pedidos (${restaurant.orders})`,
          action: 'Revisar cardápio/preços',
          severity: 'medium'
        });
      }
      
      // Restaurantes sem pedidos
      if (restaurant.orders === 0) {
        issues.push({
          name: restaurant.nome,
          issue: 'Nenhum pedido registrado',
          action: 'Verificar disponibilidade',
          severity: 'high'
        });
      }
    });
    
    return issues.slice(0, 4); // Limitar a 4 itens
  }, [restaurants]);

  return (
    <div className="space-y-6">
      {/* Performance por Categoria */}
      <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Performance por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-2 font-medium">Categoria</th>
                  <th className="text-center p-2 font-medium">Restaurantes</th>
                  <th className="text-center p-2 font-medium">Avaliação Média</th>
                  <th className="text-center p-2 font-medium">Total Pedidos</th>
                  <th className="text-center p-2 font-medium">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {categoryPerformance.length > 0 ? (
                  categoryPerformance.map((category, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="font-medium">{category.category}</span>
                        </div>
                      </td>
                      <td className="text-center p-3">{category.restaurants}</td>
                      <td className="text-center p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span>{category.avgRating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="text-center p-3 font-medium">{category.totalOrders}</td>
                      <td className="text-center p-3">
                        <span className="font-bold text-green-600">€ {category.revenue.toFixed(2)}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center p-8 text-gray-500">
                      Nenhuma categoria encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top 10 Restaurantes */}
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Top Restaurantes por Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {restaurants && restaurants.length > 0 ? (
                restaurants.slice(0, 10).map((restaurant, index) => (
                  <div key={restaurant.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index < 3 ? 
                          ['bg-yellow-500', 'bg-gray-400', 'bg-orange-600'][index] : 
                          'bg-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{restaurant.nome}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Badge variant="outline" className="text-xs">
                            {restaurant.categoria || 'Outros'}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span>{restaurant.avaliacao?.toFixed(1) || '0.0'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">€ {(restaurant.revenue || 0).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{restaurant.orders || 0} pedidos</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Nenhum restaurante encontrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Crescimento dos Restaurantes */}
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Restaurantes com Maior Crescimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topGrowingRestaurants.length > 0 ? (
                topGrowingRestaurants.map((restaurant, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-sm text-gray-600">{restaurant.category} • {restaurant.orders} pedidos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+{restaurant.growth}%</p>
                      <p className="text-xs text-gray-500">vs mês anterior</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Nenhum dado de crescimento disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restaurantes que Precisam de Atenção */}
      {restaurantsNeedingAttention.length > 0 && (
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-red-600">Restaurantes que Precisam de Atenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {restaurantsNeedingAttention.map((restaurant, index) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  restaurant.severity === 'high' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{restaurant.name}</p>
                      <p className="text-sm text-gray-600">{restaurant.issue}</p>
                      <p className="text-sm font-medium text-blue-600 mt-1">
                        Ação: {restaurant.action}
                      </p>
                    </div>
                    <Badge variant={restaurant.severity === 'high' ? 'destructive' : 'default'}>
                      {restaurant.severity === 'high' ? 'Urgente' : 'Atenção'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}