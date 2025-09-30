import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check } from 'lucide-react';

const FloatingCart = ({ isVisible, onAnimationComplete, cart, onCartClick, animationType = 'bounce' }) => {
  const [showCheck, setShowCheck] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Mostrar check após 300ms
      const checkTimer = setTimeout(() => {
        setShowCheck(true);
      }, 300);

      // Esconder animação após 1.5s
             const hideTimer = setTimeout(() => {
               setShowCheck(false);
               // Aguardar transição antes de esconder completamente
               setTimeout(() => {
                 setIsAnimating(false);
                 onAnimationComplete();
               }, 500);
             }, 1200);

      return () => {
        clearTimeout(checkTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isVisible, onAnimationComplete]);

  // Mostrar se está animando OU se tem produtos no carrinho
  if (!isAnimating && (!cart || !cart.itens || cart.itens.length === 0)) return null;

  const itemCount = cart?.itens?.reduce((total, item) => total + item.quantidade, 0) || 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 lg:hidden">
      <div className="relative">
        {/* Carrinho flutuante */}
        <div 
          className={`bg-orange-500 text-white p-4 rounded-full shadow-2xl transition-all duration-300 ${
            isAnimating && animationType === 'bounce' ? 'animate-bounce' : 'hover:scale-110'
          }`}
          onClick={onCartClick}
        >
          <ShoppingCart className="w-8 h-8" />
          
          {/* Contador de itens */}
          {itemCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {itemCount}
            </div>
          )}
        </div>
        
        {/* Check de confirmação */}
               {showCheck && (
                 <div className="absolute -top-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg animate-pulse transition-opacity duration-500 ease-in-out">
                   <Check className="w-4 h-4" />
                 </div>
               )}
        
        {/* Efeito de ondas - só durante animação e com bounce */}
        {isAnimating && animationType === 'bounce' && (
          <>
            <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-10" style={{ animationDelay: '0.2s' }}></div>
          </>
        )}
      </div>
    </div>
  );
};

export default FloatingCart;
