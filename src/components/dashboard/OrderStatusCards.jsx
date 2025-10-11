import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCircle, ChefHat, Package, Truck } from "lucide-react";

const ORDER_STATUSES = {
  pendente: { 
    label: "Aguardando Confirmação", 
    color: "bg-yellow-500", 
    textColor: "text-yellow-600", 
    borderColor: "border-l-yellow-500",
    ringColor: "ring-yellow-300",
    bgColor: "bg-yellow-50",
    priority: 1 
  },
  confirmado: { 
    label: "Confirmado", 
    color: "bg-blue-500", 
    textColor: "text-blue-600", 
    borderColor: "border-l-blue-500",
    ringColor: "ring-blue-300",
    bgColor: "bg-blue-50",
    priority: 2 
  },
  preparando: { 
    label: "Preparando", 
    color: "bg-orange-500", 
    textColor: "text-orange-600", 
    borderColor: "border-l-orange-500",
    ringColor: "ring-orange-300",
    bgColor: "bg-orange-50",
    priority: 3 
  },
  pronto: { 
    label: "Pronto para Entrega", 
    color: "bg-purple-500", 
    textColor: "text-purple-600", 
    borderColor: "border-l-purple-500",
    ringColor: "ring-purple-300",
    bgColor: "bg-purple-50",
    priority: 4 
  },
  saiu_entrega: { 
    label: "Saiu para Entrega", 
    color: "bg-indigo-500", 
    textColor: "text-indigo-600", 
    borderColor: "border-l-indigo-500",
    ringColor: "ring-indigo-300",
    bgColor: "bg-indigo-50",
    priority: 5 
  },
  entregue: { 
    label: "Entregue", 
    color: "bg-green-500", 
    textColor: "text-green-600", 
    borderColor: "border-l-green-500",
    ringColor: "ring-green-300",
    bgColor: "bg-green-50",
    priority: 6 
  },
  cancelado: { 
    label: "Cancelado", 
    color: "bg-red-500", 
    textColor: "text-red-600", 
    borderColor: "border-l-red-500",
    ringColor: "ring-red-300",
    bgColor: "bg-red-50",
    priority: 7 
  },
  rejeitado: { 
    label: "Rejeitado", 
    color: "bg-gray-500", 
    textColor: "text-gray-600", 
    borderColor: "border-l-gray-500",
    ringColor: "ring-gray-300",
    bgColor: "bg-gray-50",
    priority: 8 
  }
};

const STATUS_ICONS = {
  pendente: Bell,
  confirmado: CheckCircle,
  preparando: ChefHat,
  pronto: Package,
  saiu_entrega: Truck
};

export default function OrderStatusCards({ orders, statusFilter, onStatusCardClick }) {
  const getOrderCountByStatus = (status) => {
    if (status === 'todos') {
      return orders.filter(order => order.status === 'entregue' || order.status === 'cancelado').length;
    }
    return orders.filter(order => order.status === status).length;
  };

  const statusCards = [
    { status: 'pendente', icon: Bell },
    { status: 'confirmado', icon: CheckCircle },
    { status: 'preparando', icon: ChefHat },
    { status: 'pronto', icon: Package },
    { status: 'saiu_entrega', icon: Truck },
    { status: 'todos', icon: CheckCircle, label: 'Finalizados', color: 'bg-gray-500', textColor: 'text-gray-600', borderColor: 'border-l-gray-500', ringColor: 'ring-gray-300', bgColor: 'bg-gray-50' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {statusCards.map(({ status, icon: Icon, label, color, textColor, borderColor, ringColor, bgColor }) => {
        const statusConfig = ORDER_STATUSES[status] || { 
          label: label || 'Finalizados', 
          color: color || 'bg-gray-500', 
          textColor: textColor || 'text-gray-600', 
          borderColor: borderColor || 'border-l-gray-500', 
          ringColor: ringColor || 'ring-gray-300', 
          bgColor: bgColor || 'bg-gray-50' 
        };
        const isSelected = statusFilter === status;
        
        return (
          <Card 
            key={status}
            className={`border-l-4 ${statusConfig.borderColor} cursor-pointer transition-all hover:shadow-md ${
              isSelected ? `ring-2 ${statusConfig.ringColor} ${statusConfig.bgColor}` : 'bg-white'
            }`}
            onClick={() => onStatusCardClick(status)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{statusConfig.label}</p>
                  <p className={`text-2xl font-bold ${statusConfig.textColor}`}>
                    {getOrderCountByStatus(status)}
                  </p>
                </div>
                <Icon className={`h-8 w-8 ${statusConfig.textColor}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
