import React from 'react';
import { X, Phone, MapPin, Star, Timer, User, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateDeliveryDistance, calculateEstimatedDeliveryTime } from '../utils/orderCalculations';
import DeliveryMap from '../components/DeliveryMap';

export default function DeliveryPersonModal({
  entregador,
  restaurant,
  order,
  isOpen,
  onClose
}) {
  console.log("🔍 DEBUG - Order completo no modal:", order);
  console.log("🔍 DEBUG - Endereço de entrega (camelCase):", order?.enderecoEntrega);
  console.log("🔍 DEBUG - Endereço de entrega (underscore):", order?.endereco_entrega);
  if (!isOpen || !entregador) return null;

  // Debug: verificar dados do entregador
  console.log("🔍 DEBUG - Dados do entregador no modal:", {
    id: entregador.id,
    avaliacao: entregador.avaliacao,
    totalEntregas: entregador.totalEntregas,
    total_entregas: entregador.total_entregas,
    todosOsCampos: Object.keys(entregador)
  });

  const distance = calculateDeliveryDistance(entregador, restaurant);
  const estimatedTime = distance ? calculateEstimatedDeliveryTime(distance) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto rounded-xl">
        <CardHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Informações do Entregador
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Avatar e Informações */}
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="relative">
              {(entregador.fotoUrl || entregador.foto_url) ? (
                <img 
                  src={entregador.fotoUrl || entregador.foto_url} 
                  alt={entregador.nomeCompleto || entregador.nome_completo}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200"
                style={{ display: (entregador.fotoUrl || entregador.foto_url) ? 'none' : 'flex' }}
              >
                <span className="text-gray-600 font-semibold text-2xl">
                  {(entregador.nomeCompleto || entregador.nome_completo)?.charAt(0) || 'E'}
                </span>
              </div>
              {/* Status indicator */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

                  {/* Informações */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {entregador.nomeCompleto || entregador.nome_completo || 'Nome não disponível'}
                    </h3>
                    
                    {/* Telefone */}
                    {entregador.telefone && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700 font-medium">{entregador.telefone}</span>
                      </div>
                    )}
                    
                    {/* Avaliação e Total de Entregas */}
                    {entregador.avaliacao && entregador.avaliacao > 0 && (
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-gray-700 font-medium">
                          {typeof entregador.avaliacao === 'number' ? entregador.avaliacao.toFixed(1) : entregador.avaliacao}
                          {(entregador.totalEntregas || entregador.total_entregas) && (entregador.totalEntregas > 0 || entregador.total_entregas > 0) && (
                            <span className="text-gray-400 ml-1 text-sm">
                              ({entregador.totalEntregas || entregador.total_entregas} entregas)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
          </div>

          {/* Email */}
          {entregador.email && (
            <div className="space-y-3">
              <h4 className="text-lg font-medium text-gray-900">
                Email
              </h4>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{entregador.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Informações de Localização */}
          {distance && estimatedTime && (
            <div className="space-y-3">
              <h4 className="text-lg font-medium text-gray-900">
                Informações de Entrega
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Distância</p>
                    <p className="font-medium text-gray-900">{distance.toFixed(1)} km</p>
                  </div>
                </div>

                       <div className="flex items-center space-x-3">
                         <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                           <Timer className="w-4 h-4 text-purple-600" />
                         </div>
                         <div>
                           <p className="text-sm text-gray-600">Tempo Estimado</p>
                           <p className="font-medium text-gray-900">~{estimatedTime} min</p>
                         </div>
                       </div>
              </div>
            </div>
          )}

          {/* Mapa de Localização */}
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-gray-900">
              Localização no Mapa
            </h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <DeliveryMap entregador={entregador} restaurant={restaurant} order={order} />
            </div>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Entregador</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Restaurante</span>
              </div>
              {(order?.endereco_entrega || order?.enderecoEntrega) && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse border-2 border-blue-300"></div>
                  <span className="font-semibold text-blue-600">Cliente (DESTAQUE)</span>
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
