import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Bell, Settings as SettingsIcon, User as UserIcon, Mail, Tag, CheckCircle, Store, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSound } from '@/components/dashboard/RestaurantDashboard/hooks/useNotificationSound';
import { Restaurant } from '@/api/entities';

// Tipos de som disponíveis
const SOUND_TYPES = [
  { value: 'classic', label: 'Clássico' },
  { value: 'bell', label: 'Sino' },
  { value: 'chime', label: 'Sino Suave' },
  { value: 'beep', label: 'Beep' },
  { value: 'custom', label: 'Personalizado' }
];

export default function Definicoes() {
  const { currentUser } = useAuth();
  const {
    soundEnabled,
    soundType,
    setSoundEnabled,
    setSoundType,
    playNotificationSound,
  } = useNotificationSound();

  const [restaurant, setRestaurant] = useState(null);
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(false);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(true);

  // Carregar dados do restaurante
  useEffect(() => {
    const loadRestaurant = async () => {
      if (!currentUser?.restaurant_id) return;
      
      try {
        setIsLoadingRestaurant(true);
        const restaurantData = await Restaurant.get(currentUser.restaurant_id);
        setRestaurant(restaurantData);
        setIsRestaurantOpen(restaurantData.open);
        console.log('🏪 Restaurante carregado:', restaurantData);
      } catch (error) {
        console.error('❌ Erro ao carregar restaurante:', error);
      } finally {
        setIsLoadingRestaurant(false);
      }
    };

    loadRestaurant();
  }, [currentUser?.restaurant_id]);

  const handleRestaurantToggle = useCallback(async () => {
    if (!restaurant) return;

    try {
      const newStatus = !isRestaurantOpen;
      console.log(`🏪 ${newStatus ? 'Abrindo' : 'Fechando'} restaurante...`);
      
      const updatedRestaurant = await Restaurant.update(restaurant.id, {
        open: newStatus
      });
      
      setRestaurant(updatedRestaurant);
      setIsRestaurantOpen(newStatus);
      
      console.log(`✅ Restaurante ${newStatus ? 'aberto' : 'fechado'} com sucesso!`);
    } catch (error) {
      console.error('❌ Erro ao atualizar status do restaurante:', error);
      alert('Erro ao atualizar status do restaurante. Tente novamente.');
    }
  }, [restaurant, isRestaurantOpen]);

  const handleTestSound = useCallback(() => {
    console.log(`🔊 Testando som: ${soundType}`);
    playNotificationSound();
  }, [playNotificationSound, soundType]);

  const getUserRoleLabel = (user) => {
    if (!user) return 'N/A';
    if (user.role === 'admin') return 'Administrador';
    if (user.tipo_usuario === 'restaurante') return 'Restaurante';
    if (user.tipo_usuario === 'entregador') return 'Entregador';
    return 'Cliente';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
         <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
           <SettingsIcon className="h-8 w-8 text-gray-700" />
           Definições
         </h1>

         {/* Configurações do Restaurante */}
         {currentUser?.tipo_usuario === 'restaurante' && (
           <Card className="shadow-lg rounded-xl">
             <CardHeader className="border-b pb-4">
               <CardTitle className="flex items-center gap-3 text-2xl text-gray-800">
                 <Store className="h-6 w-6 text-green-600" />
                 Configurações do Restaurante
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
               {isLoadingRestaurant ? (
                 <div className="flex items-center justify-center py-8">
                   <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
                   <span className="ml-3 text-gray-600">Carregando dados do restaurante...</span>
                 </div>
               ) : restaurant ? (
                 <>
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       {isRestaurantOpen ? (
                         <Clock className="h-6 w-6 text-green-500" />
                       ) : (
                         <Clock className="h-6 w-6 text-red-500" />
                       )}
                       <div>
                         <Label htmlFor="restaurant-toggle" className="text-lg font-medium text-gray-900">
                           Status do Restaurante
                         </Label>
                         <p className="text-sm text-gray-600">
                           {isRestaurantOpen ? 'Aberto para pedidos' : 'Fechado para pedidos'}
                         </p>
                       </div>
                     </div>
                     <Switch
                       id="restaurant-toggle"
                       checked={isRestaurantOpen}
                       onCheckedChange={handleRestaurantToggle}
                     />
                   </div>

                 </>
               ) : (
                 <div className="text-center py-8">
                   <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                   <p className="text-gray-500">Restaurante não encontrado</p>
                 </div>
               )}
             </CardContent>
           </Card>
         )}

         {/* Configurações de Áudio */}
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl text-gray-800">
              <Volume2 className="h-6 w-6 text-blue-600" />
              Configurações de Áudio
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {soundEnabled ? (
                  <Volume2 className="h-6 w-6 text-green-500" />
                ) : (
                  <VolumeX className="h-6 w-6 text-gray-400" />
                )}
                <div>
                  <Label htmlFor="sound-toggle" className="text-lg font-medium text-gray-900">
                    Notificações Sonoras
                  </Label>
                  <p className="text-sm text-gray-600">
                    {soundEnabled ? 'Ativadas' : 'Desativadas'}
                  </p>
                </div>
              </div>
              <Switch
                id="sound-toggle"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>

            {soundEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sound-type" className="text-lg font-medium text-gray-900">
                    Tipo de Som
                  </Label>
                  <Select value={soundType} onValueChange={setSoundType}>
                    <SelectTrigger id="sound-type" className="w-full">
                      <SelectValue placeholder="Selecione o tipo de som" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOUND_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>


                <Button onClick={handleTestSound} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Bell className="h-5 w-5 mr-2" />
                  Testar Som
                </Button>
              </>
            )}
          </CardContent>
         </Card>

         {/* Informações da Conta */}
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl text-gray-800">
              <UserIcon className="h-6 w-6 text-purple-600" />
              Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-gray-700">
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-gray-500" />
              <p><strong>Nome:</strong> {currentUser?.full_name || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-gray-500" />
              <p><strong>Tipo de Usuário:</strong> {getUserRoleLabel(currentUser)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <p><strong>Email:</strong> {currentUser?.email || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-gray-500" />
              <p><strong>Status:</strong> {currentUser?.status === 'active' ? 'Ativo' : 'Inativo'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}