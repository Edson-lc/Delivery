import React, { memo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Percent, Tag, Clock, MapPin, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const RestaurantCard = memo(function RestaurantCard({ restaurant, isPromotional = false, onRestaurantClick }) {
  const defaultImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&crop=center";

  const getPromoBadge = useCallback(() => {
    // Lógica de promoção simulada
    if (restaurant.nome.toLowerCase().includes('pizza')) {
      return (
        <Badge className="absolute top-2 left-2 bg-red-600 text-white border-none">
          <Percent className="w-3 h-3 mr-1" />
          -20% em pizzas
        </Badge>
      );
    }
    if (restaurant.categoria === 'hamburguer') {
      return (
        <Badge className="absolute top-2 left-2 bg-orange-500 text-white border-none">
          <Tag className="w-3 h-3 mr-1" />
          2 por 1
        </Badge>
      );
    }
    return null;
  }, [restaurant.nome, restaurant.categoria]);

  const handleClick = useCallback(() => {
    if (onRestaurantClick) {
      onRestaurantClick();
    }
  }, [onRestaurantClick]);

  return (
    <Link 
      to={createPageUrl(`RestaurantMenu?id=${restaurant.id}`)} 
      className="group block"
      onClick={handleClick}
    >
      <Card className="overflow-hidden border-gray-200 rounded-xl hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-white">
        <div className="relative">
          <img
            src={restaurant.imagem_url || defaultImage}
            alt={restaurant.nome}
            className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${isPromotional ? 'h-48' : 'h-48'}`}
            onError={(e) => { e.target.src = defaultImage; }}
            loading="lazy"
          />
          {getPromoBadge()}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                <ArrowRight className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 flex-grow flex flex-col">
          <div className="flex-grow">
            <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{restaurant.nome}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {restaurant.descricao || `Deliciosos pratos de ${restaurant.categoria} para você saborear.`}
            </p>
          </div>
          
          <div className="space-y-3">
            {/* Category and Rating */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="capitalize text-xs">
                {restaurant.categoria}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="font-semibold text-sm">{restaurant.avaliacao?.toFixed(1) || 'Novo'}</span>
              </div>
            </div>
            
            {/* Delivery Info */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{restaurant.tempoPreparo || 30} min</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>€{restaurant.taxaEntrega?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
});

export default RestaurantCard;