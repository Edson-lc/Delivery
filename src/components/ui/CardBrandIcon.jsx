import React from 'react';

// Componente para exibir a bandeira do cartão
export default function CardBrandIcon({ brand, className = "w-12 h-8" }) {
  const getBrandIcon = (brand) => {
    switch (brand) {
      case 'Visa':
        return (
          <div className={`${className} bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center`}>
            <span className="text-white font-bold text-xs">VISA</span>
          </div>
        );
      
      case 'Mastercard':
        return (
          <div className={`${className} bg-gradient-to-r from-red-500 to-orange-500 rounded flex items-center justify-center`}>
            <span className="text-white font-bold text-xs">MC</span>
          </div>
        );
      
      case 'American Express':
        return (
          <div className={`${className} bg-gradient-to-r from-blue-500 to-blue-700 rounded flex items-center justify-center`}>
            <span className="text-white font-bold text-xs">AMEX</span>
          </div>
        );
      
      case 'Multibanco':
        return (
          <div className={`${className} bg-gradient-to-r from-gray-600 to-gray-800 rounded flex items-center justify-center`}>
            <span className="text-white font-bold text-xs">MB</span>
          </div>
        );
      
      default:
        return (
          <div className={`${className} bg-gradient-to-r from-gray-400 to-gray-600 rounded flex items-center justify-center`}>
            <span className="text-white font-bold text-xs">CARD</span>
          </div>
        );
    }
  };

  return getBrandIcon(brand);
}
