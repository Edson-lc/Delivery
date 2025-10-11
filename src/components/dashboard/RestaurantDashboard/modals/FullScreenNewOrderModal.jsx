import React from "react";
import { ShoppingCart } from "lucide-react";

export default function FullScreenNewOrderModal({ isOpen, onClose, order, onViewDetails }) {
  if (!isOpen) return null;

  const handleClick = () => {
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer overflow-hidden"
      onClick={handleClick}
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 4s ease infinite'
      }}
    >
      {/* Efeito de círculos concêntricos animados */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full border-4 border-white transform -translate-x-1/2 -translate-y-1/2"
          style={{
            animation: 'pulse 3s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2"
          style={{
            animation: 'pulse 2s ease-in-out infinite reverse'
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full border border-white transform -translate-x-1/2 -translate-y-1/2"
          style={{
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        />
      </div>
      
      {/* Efeito de estrelas brilhantes */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-80"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
              boxShadow: '0 0 6px rgba(255,255,255,0.8)'
            }}
          />
        ))}
      </div>
      
      {/* Efeito de linhas de energia */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-full bg-gradient-to-b from-transparent via-white to-transparent"
            style={{
              left: `${12.5 + i * 12.5}%`,
              animation: `energyFlow ${4 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Conteúdo Principal */}
      <div className="relative z-10 text-center text-white">
        {/* Ícone de Cesto Animado */}
        <div className="mb-8">
          <ShoppingCart 
            className="h-32 w-32 mx-auto animate-bounce text-white drop-shadow-lg" 
            style={{
              animation: 'bounce 1s infinite, pulse 2s infinite'
            }}
          />
        </div>
        
        {/* Texto Principal */}
        <h1 
          className="text-6xl font-bold mb-4 drop-shadow-lg"
          style={{
            animation: 'textGlow 2s ease-in-out infinite, textBounce 3s ease-in-out infinite'
          }}
        >
          Temos um Novo Pedido!
        </h1>
        
        {/* Instrução */}
        <p className="text-lg opacity-90">
          Clique na tela para ver os pedidos pendentes
        </p>
      </div>
    </div>
  );
}