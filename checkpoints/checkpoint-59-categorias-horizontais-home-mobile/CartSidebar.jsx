import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  Clock
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export default function CartSidebar({ cart, restaurant, onRemoveItem, onClearCart, onCheckout, onUpdateQuantity }) {
  const [fallingItems, setFallingItems] = useState(new Set());
  
  // Adicionar CSS customizado para scrollbar transparente no normal e 15% no hover
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .cart-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .cart-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .cart-scrollbar::-webkit-scrollbar-thumb {
        background: transparent;
        border-radius: 3px;
      }
      .cart-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.15);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Função para animar item desaparecendo com efeito de poeira
  const animateItemRemoval = (index) => {
    const item = normalizedCart.itens[index];
    setFallingItems(prev => new Set([...prev, index]));
    
    // Mostrar toast de remoção
    toast.success(`${item.nome} removido do carrinho`, {
      description: "Item removido com sucesso",
      duration: 2000,
    });
    
    // Remover o item após a animação
    setTimeout(() => {
      if (onRemoveItem) {
        onRemoveItem(index);
      }
      setFallingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }, 1200); // Duração da animação mais lenta
  };
  
  // Função para normalizar nomes de grupos de personalização
  const normalizeGroupName = (groupName) => {
    return groupName
      .replace(/^_/, '') // Remove underscore do início
      .replace(/_/g, ' ') // Substitui underscores por espaços
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitaliza primeira letra de cada palavra
  };

  // Normalizar dados do carrinho
  const normalizedCart = cart ? {
    ...cart,
    itens: cart.itens.map(item => {
      if (!item.personalizacoes) return item;

      const normalizedPersonalizacoes = {};
      Object.entries(item.personalizacoes).forEach(([grupo, opcao]) => {
        const nomeGrupoNormalizado = normalizeGroupName(grupo);
        normalizedPersonalizacoes[nomeGrupoNormalizado] = opcao;
      });

      return {
        ...item,
        personalizacoes: normalizedPersonalizacoes
      };
    })
  } : null;
  if (!normalizedCart || !normalizedCart.itens || normalizedCart.itens.length === 0) {
    return (
      <Card className="sticky top-6 border-none shadow-lg bg-white/80 backdrop-blur-sm" data-cart-sidebar>
        <CardHeader className="text-center py-8">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <CardTitle className="text-gray-500">Seu carrinho está vazio</CardTitle>
          <p className="text-sm text-gray-400 mt-2">
            Adicione itens do cardápio para continuar
          </p>
        </CardHeader>
      </Card>
    );
  }

  const calculateItemTotal = (item) => {
    let total = item.preco_unitario * item.quantidade;
    
    // Adicionar preço dos adicionais
    if (item.adicionais_selecionados) {
      const adicionaisTotal = item.adicionais_selecionados.reduce((sum, add) => sum + (add.preco || 0), 0);
      total += adicionaisTotal * item.quantidade;
    }

    // Adicionar preço das personalizações
    if (item.preco_personalizacoes) {
      total += item.preco_personalizacoes * item.quantidade;
    }

    return total;
  };

  // Função para atualizar quantidade com animação de desaparecimento
  const handleQuantityUpdate = (index, newQuantity) => {
    const item = normalizedCart.itens[index];
    
    if (newQuantity === 0) {
      // Animar desaparecimento quando quantidade for 0
      animateItemRemoval(index);
    } else if (newQuantity > item.quantidade) {
      // Quantidade aumentada - mostrar toast de sucesso
      toast.success(`${item.nome} adicionado`, {
        description: `Quantidade: ${newQuantity}`,
        duration: 1500,
      });
      
      // Atualização normal da quantidade
      if (onUpdateQuantity) {
        onUpdateQuantity(index, newQuantity);
      }
    } else {
      // Quantidade diminuída (mas não zero) - toast informativo
      toast.info(`${item.nome} atualizado`, {
        description: `Quantidade: ${newQuantity}`,
        duration: 1500,
      });
      
      // Atualização normal da quantidade
      if (onUpdateQuantity) {
        onUpdateQuantity(index, newQuantity);
      }
    }
  };

  const total = normalizedCart.itens.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const taxaEntrega = restaurant?.taxa_entrega || 0;
  const totalFinal = total + taxaEntrega;

  return (
    <Card className="sticky top-6 border-none shadow-lg bg-white/80 backdrop-blur-sm" data-cart-sidebar>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-orange-600" />
          O seu pedido
        </CardTitle>
        <p className="text-sm text-gray-600">{restaurant?.nome}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lista de Itens */}
        <div className="space-y-3 max-h-96 overflow-y-auto cart-scrollbar">
          {normalizedCart.itens.map((item, index) => (
            <div 
              key={index} 
              className={`border-b border-gray-100 pb-3 last:border-b-0 transition-all duration-1000 ease-in-out relative ${
                fallingItems.has(index) 
                  ? 'transform scale-0 opacity-0 rotate-12 translate-y-4 blur-sm' 
                  : 'transform scale-100 opacity-100 rotate-0 translate-y-0 blur-0'
              }`}
              style={{
                transitionProperty: 'transform, opacity, filter',
                transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
                ...(fallingItems.has(index) && {
                  '--tw-shadow': '0 0 20px rgba(251, 146, 60, 0.3), 0 0 40px rgba(251, 146, 60, 0.1)',
                  boxShadow: 'var(--tw-shadow)'
                })
              }}
            >
              {/* Nome e preço */}
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-sm flex-1">{item.nome}</h4>
                <p className="font-semibold text-sm text-gray-900">€{item.preco_unitario.toFixed(2)}</p>
              </div>

              {/* Personalizações */}
              {item.personalizacoes && Object.keys(item.personalizacoes).length > 0 && (
                <div className="text-xs text-gray-600 space-y-1">
                  {Object.entries(item.personalizacoes).map(([grupo, opcao]) => (
                    <div key={grupo} className="flex justify-between items-center">
                      <span className="text-gray-600">• {grupo}: {opcao.nome || opcao}</span>
                      {opcao.preco_adicional > 0 && (
                        <span className="font-medium text-gray-800">+€{opcao.preco_adicional.toFixed(2)}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Adicionais */}
              {item.adicionais_selecionados && item.adicionais_selecionados.length > 0 && (
                <div className="text-xs text-gray-600 space-y-1 mt-1">
                  {item.adicionais_selecionados.map((adicional, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-gray-600">+ {adicional.nome}</span>
                      <span className="font-medium text-gray-800">€{adicional.preco.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Ingredientes Removidos */}
              {item.ingredientes_removidos && item.ingredientes_removidos.length > 0 && (
                <div className="text-xs text-red-600 mt-1">
                  {Array.isArray(item.ingredientes_removidos) ? 
                    item.ingredientes_removidos.map((ingrediente, idx) => (
                      <div key={idx}>- Sem {ingrediente}</div>
                    )) : 
                    <div>- Sem {String(item.ingredientes_removidos)}</div>
                  }
                </div>
              )}

              {/* Observações */}
              {item.observacoes && (
                <div className="text-xs text-gray-600 mt-1 italic">
                  <span className="font-bold">OBS:</span> "{item.observacoes}"
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleQuantityUpdate(index, Math.max(0, item.quantidade - 1))}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-medium px-2">{item.quantidade}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleQuantityUpdate(index, item.quantidade + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-sm text-gray-900">€{calculateItemTotal(item).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Resumo dos valores */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>€{total.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Taxa de entrega</span>
            <span>€{taxaEntrega.toFixed(2)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>€{totalFinal.toFixed(2)}</span>
          </div>
        </div>

        {/* Tempo estimado */}
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-orange-700">
            <Clock className="w-4 h-4" />
            <span>Entrega em {(restaurant?.tempo_preparo || 30) + 30} min</span>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="space-y-2">
          <Button 
            onClick={onCheckout}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
          >
            Finalizar Pedido • €{totalFinal.toFixed(2)}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast.warning("Carrinho limpo", {
                description: "Todos os itens foram removidos",
                duration: 2000,
              });
              if (onClearCart) {
                onClearCart();
              }
            }}
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            Limpar Carrinho
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}