import React from "react";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  ShoppingCart, 
  UserIcon, 
  MapPin, 
  Euro, 
  CheckCircle, 
  X 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Função auxiliar para formatar endereço
const formatAddress = (address) => {
  if (!address) return 'Endereço não informado';
  
  if (typeof address === 'string') {
    return address;
  }
  
  if (typeof address === 'object') {
    const parts = [];
    if (address.rua) parts.push(address.rua);
    if (address.numero) parts.push(address.numero);
    if (address.complemento) parts.push(address.complemento);
    if (address.bairro) parts.push(address.bairro);
    if (address.cidade) parts.push(address.cidade);
    if (address.cep) parts.push(address.cep);
    
    return parts.length > 0 ? parts.join(', ') : 'Endereço não informado';
  }
  
  return 'Endereço não informado';
};

export default function NewOrderModal({ 
  order, 
  isOpen, 
  onAccept, 
  onReject, 
  onClose 
}) {
  if (!order || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 border-2 border-red-500">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              🚨 NOVO PEDIDO RECEBIDO! 🚨
            </h2>
            <p className="text-lg text-gray-700">
              Um novo pedido chegou e precisa da sua atenção imediatamente!
            </p>
          </div>

          <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
            {/* Informações do Pedido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="h-6 w-6 text-blue-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Pedido #{order.id.slice(-6)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(order.created_date), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <UserIcon className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.cliente_nome || order.clienteNome || 'Nome não informado'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.cliente_telefone || order.clienteTelefone || 'Telefone não informado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Euro className="h-6 w-6 text-purple-500" />
                  <div>
                    <p className="font-medium text-gray-900">Total do Pedido</p>
                    <p className="text-lg font-bold text-green-600">
                      €{(order.total || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-6 w-6 text-orange-500" />
                  <div>
                    <p className="font-medium text-gray-900">Endereço de Entrega</p>
                    <p className="text-sm text-gray-500">
                      {formatAddress(order.endereco_entrega)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Itens do Pedido */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Itens do Pedido</h3>
              <div className="space-y-2">
                {order.itens && Array.isArray(order.itens) ? (
                  order.itens.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {item.quantidade || 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.nome || item.menu_item?.nome || item.name || 'Item'}
                          </p>
                          {item.observacoes && (
                            <p className="text-xs text-blue-600">Obs: {item.observacoes}</p>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">
                        €{(item.preco || item.price || item.valor || 0).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Itens não disponíveis</p>
                )}
              </div>
            </div>

            {/* Observações do Cliente */}
            {order.observacoes && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Observações do Cliente</h4>
                <p className="text-blue-800">{order.observacoes}</p>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex space-x-4 pt-4 border-t border-gray-200">
              <Button
                onClick={onAccept}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 text-lg font-semibold"
              >
                <CheckCircle className="w-6 h-6 mr-2" />
                ACEITAR PEDIDO
              </Button>
              <Button
                onClick={onReject}
                variant="outline"
                className="flex-1 border-red-500 text-red-500 hover:bg-red-50 py-3 text-lg font-semibold"
              >
                <X className="w-6 h-6 mr-2" />
                REJEITAR PEDIDO
              </Button>
            </div>

            {/* Aviso */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Este pedido precisa da sua confirmação para prosseguir. 
                  O cliente está aguardando sua resposta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
