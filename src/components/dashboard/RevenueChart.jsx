import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { useMemo } from "react";

export default function RevenueChart({ orders = [], isLoading = false }) {
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [];
    }

    // Obter os últimos 7 dias
    const today = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push(date);
    }

    // Nomes dos dias da semana em português
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Calcular faturamento por dia
    const dailyRevenue = last7Days.map(date => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_date);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });
      
      const revenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const pedidos = dayOrders.length;
      
      return {
        dia: dayNames[date.getDay()],
        faturamento: Math.round(revenue * 100) / 100, // Arredondar para 2 casas decimais
        pedidos: pedidos,
        data: date.toISOString().split('T')[0]
      };
    });

    return dailyRevenue;
  }, [orders]);

  // Calcular total da semana e comparação
  const weeklyStats = useMemo(() => {
    const totalRevenue = chartData.reduce((sum, day) => sum + day.faturamento, 0);
    
    // Calcular semana anterior para comparação real
    const today = new Date();
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 13); // 2 semanas atrás
    
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - 7); // 1 semana atrás
    
    const previousWeekOrders = orders.filter(order => {
      const orderDate = new Date(order.created_date);
      return orderDate >= lastWeekStart && orderDate < lastWeekEnd;
    });
    
    const previousWeekRevenue = previousWeekOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    const percentageChange = previousWeekRevenue > 0 ? 
      Math.round(((totalRevenue - previousWeekRevenue) / previousWeekRevenue) * 100) : 0;
    
    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      percentageChange: percentageChange
    };
  }, [chartData, orders]);

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Faturamento da Semana
            </CardTitle>
            <div className="text-right">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mt-1"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-gray-500">Carregando dados...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            Faturamento da Semana
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">€ {weeklyStats.totalRevenue.toLocaleString('pt-PT')}</p>
            <p className={`text-sm ${weeklyStats.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {weeklyStats.percentageChange >= 0 ? '+' : ''}{weeklyStats.percentageChange}% vs semana anterior
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              Nenhum dado disponível para os últimos 7 dias
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="dia" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => `€ ${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value, name) => [
                    name === 'faturamento' ? `€ ${value}` : `${value} pedidos`,
                    name === 'faturamento' ? 'Faturamento' : 'Pedidos'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="faturamento" 
                  stroke="#ea580c" 
                  strokeWidth={3}
                  dot={{ fill: '#ea580c', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}