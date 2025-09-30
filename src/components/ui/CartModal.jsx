import React from 'react';
import { X, Plus, Minus, ShoppingCart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const CartModal = ({ isOpen, onClose, cart, onRemoveItem, onUpdateQuantity, onClearCart, onCheckout, restaurant }) => {
  if (!isOpen) return null;

  const itemCount = cart?.itens?.reduce((total, item) => total + item.quantidade, 0) || 0;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 lg:hidden"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 border-2 border-orange-500 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-orange-500" />
              </div>
              <h2 className="text-lg font-bold text-black">O seu pedido</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">{restaurant?.nome}</p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart?.itens && cart.itens.length > 0 ? (
            <div className="space-y-4">
              {cart.itens.map((item, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 mb-4 last:border-b-0 last:mb-0">
                  {/* Item Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-black">{item.nome || 'Item sem nome'}</h3>
                      <p className="text-sm text-gray-600">€{(item.preco || item.preco_unitario || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Personalizações */}
                  {item.personalizacoes && Object.keys(item.personalizacoes).length > 0 && (
                    <div className="mb-2">
                      {Object.entries(item.personalizacoes).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">• {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {typeof value === 'object' ? value.nome || value : value}</span>
                          <span className="text-gray-600">+€{(typeof value === 'object' ? value.preco_adicional : 0)?.toFixed(2) || '0.00'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Adicionais */}
                  {item.adicionais_selecionados && item.adicionais_selecionados.length > 0 && (
                    <div className="mb-2">
                      {item.adicionais_selecionados.map((adicional, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">+ {adicional.nome}</span>
                          <span className="text-gray-600">+€{adicional.preco?.toFixed(2) || '0.00'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ingredientes removidos */}
                  {item.ingredientes_removidos && item.ingredientes_removidos.length > 0 && (
                    <div className="mb-2">
                      {item.ingredientes_removidos.map((ingrediente, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-red-500">- Sem {ingrediente}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Observações */}
                  {item.observacoes && (
                    <div className="mb-2">
                      <div className="text-sm">
                        <span className="text-gray-600">OBS: </span>
                        <span className="text-gray-600 italic">"{item.observacoes}"</span>
                      </div>
                    </div>
                  )}

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center bg-gray-100 rounded-full px-2 py-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateQuantity(index, (item.quantidade || 1) - 1)}
                        className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium mx-2 min-w-[20px] text-center">
                        {item.quantidade || 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateQuantity(index, (item.quantidade || 1) + 1)}
                        className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {/* Total do item */}
                    <span className="text-sm font-semibold text-black">
                      €{(() => {
                        const precoBase = parseFloat(item.preco || item.preco_unitario) || 0;
                        const quantidade = parseInt(item.quantidade) || 1;
                        
                        // Calcular preço das personalizações
                        let precoPersonalizacoes = 0;
                        if (item.personalizacoes && typeof item.personalizacoes === 'object') {
                          Object.values(item.personalizacoes).forEach(opcao => {
                            if (opcao && typeof opcao === 'object' && opcao.preco_adicional) {
                              precoPersonalizacoes += parseFloat(opcao.preco_adicional) || 0;
                            }
                          });
                        }
                        
                        // Calcular preço dos adicionais
                        let precoAdicionais = 0;
                        if (item.adicionais_selecionados && Array.isArray(item.adicionais_selecionados)) {
                          precoAdicionais = item.adicionais_selecionados.reduce((sum, add) => {
                            return sum + (parseFloat(add.preco) || 0);
                          }, 0);
                        }
                        
                        const totalItem = (precoBase + precoPersonalizacoes + precoAdicionais) * quantidade;
                        return totalItem.toFixed(2);
                      })()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Seu carrinho está vazio</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 space-y-4">
          {/* Order Summary */}
          <div className="space-y-2">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-black">Subtotal</span>
              <span className="text-black">€{cart?.subtotal?.toFixed(2) || '0.00'}</span>
            </div>

            {/* Taxa de entrega */}
            <div className="flex justify-between text-sm">
              <span className="text-black">Taxa de entrega</span>
              <span className="text-black">€{restaurant?.taxa_entrega?.toFixed(2) || '0.00'}</span>
            </div>

            <Separator className="my-2" />

            {/* Total */}
            <div className="flex justify-between text-lg font-bold">
              <span className="text-black">Total</span>
              <span className="text-black">€{((cart?.subtotal || 0) + (restaurant?.taxa_entrega || 0)).toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-orange-600 font-medium">
                Entrega em {restaurant?.tempo_preparo || 30}-{(restaurant?.tempo_preparo || 30) + 15} min
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={onCheckout}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg"
              disabled={!cart?.itens || cart.itens.length === 0}
            >
              Finalizar Pedido • €{((cart?.subtotal || 0) + (restaurant?.taxa_entrega || 0)).toFixed(2)}
            </Button>
            
            {cart?.itens && cart.itens.length > 0 && (
              <Button
                variant="outline"
                onClick={onClearCart}
                className="w-full border-gray-300 text-red-600 hover:text-red-700 hover:bg-red-50 py-3 rounded-lg"
              >
                Limpar Carrinho
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
