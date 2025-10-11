
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  MapPin, 
  Phone, 
  Edit,
  Eye,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCategoryIcon, getCategoryColor } from "@/utils/categoryIcons";

const statusColors = {
  ativo: "bg-green-100 text-green-800 border-green-200",
  inativo: "bg-gray-100 text-gray-800 border-gray-200",
  suspenso: "bg-red-100 text-red-800 border-red-200"
};

const statusLabels = {
  ativo: "Ativo",
  inativo: "Inativo",
  suspenso: "Suspenso"
};

export default function RestaurantCard({ restaurant, onEdit, onViewDetails }) {
  const defaultImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop&crop=center";
  const CategoryIcon = getCategoryIcon(restaurant.categoria);
  const categoryColor = getCategoryColor(restaurant.categoria);

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Imagem do restaurante */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={restaurant.imagem_url || defaultImage}
          alt={restaurant.nome}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = defaultImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Badges de status e aberto/fechado */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={`${restaurant.open ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-orange-100 text-orange-800 border-orange-200'} border font-medium pointer-events-none`}>
            {restaurant.open ? 'Aberto' : 'Fechado'}
          </Badge>
          <Badge className={`${statusColors[restaurant.status]} border font-medium pointer-events-none`}>
            {statusLabels[restaurant.status]}
          </Badge>
        </div>

        {/* Menu de ações */}
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-white/20 backdrop-blur-sm hover:bg-white/30">
                <MoreHorizontal className="w-4 h-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Informações sobrepostas */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-lg mb-1">{restaurant.nome}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryIcon className={`w-4 h-4 ${categoryColor}`} />
                    <span className="text-white/90 text-sm capitalize">
                      {restaurant.categoria}
                    </span>
                  </div>
            {(restaurant.rating || restaurant.avaliacao) && (
              <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-white font-medium text-sm">{(restaurant.rating || restaurant.avaliacao).toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Endereço */}
        {restaurant.endereco && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 line-clamp-2">{restaurant.endereco}</p>
          </div>
        )}

        {/* Contato */}
        <div className="flex items-center gap-4">
          {restaurant.telefone && (
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{restaurant.telefone}</span>
            </div>
          )}
        </div>


        {/* Descrição */}
        {restaurant.descricao && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {restaurant.descricao}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
