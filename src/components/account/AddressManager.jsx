
import React, { useState } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Home, Briefcase, MapPin, AlertTriangle, Pencil, Navigation } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LocationPickerMap from './LocationPickerMap';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ícone personalizado para o cliente
const createCustomerMarkerIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid #f97316;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          font-size: 18px;
          color: #f97316;
        ">🏠</div>
      </div>
    `,
    className: 'customer-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

export default function AddressManager({ user, onUserUpdate }) {
    const [addresses, setAddresses] = useState(user?.enderecos_salvos || []);
    const [isEditing, setIsEditing] = useState(false);
    const [currentAddress, setCurrentAddress] = useState(null);
    const [editIndex, setEditIndex] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState(null);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [hasLocationChanged, setHasLocationChanged] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [showCoordinatesObtained, setShowCoordinatesObtained] = useState(false);

    const handleAddNew = async () => {
        setEditIndex(addresses.length);
        setCurrentAddress({ id: `new_${Date.now()}`, nome: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', cep: '' });
        setIsEditing(true);
        setHasLocationChanged(false); // Reset do estado de mudança
        setValidationErrors({}); // Limpar erros de validação
        setShowCoordinatesObtained(false); // Limpar indicador de coordenadas
        
        // Buscar localização atual automaticamente
        await getCurrentLocation();
    };

    const handleEdit = (index) => {
        setEditIndex(index);
        setCurrentAddress(addresses[index]);
        setIsEditing(true);
        setHasLocationChanged(false); // Reset do estado de mudança
        setValidationErrors({}); // Limpar erros de validação
        setShowCoordinatesObtained(false); // Limpar indicador de coordenadas
    };

    const handleDelete = (index) => {
        const address = addresses[index];
        setAddressToDelete({ ...address, index });
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (addressToDelete) {
            setIsLoading(true);
            const updatedAddresses = addresses.filter((_, i) => i !== addressToDelete.index);
            try {
                const updatedUser = await User.updateMyUserData({ enderecos_salvos: updatedAddresses });
                setAddresses(updatedAddresses);
                onUserUpdate(updatedUser);
            } catch (error) {
                console.error("Erro ao deletar endereço:", error);
                
                // Tratar erros de autenticação
                if (error.message.includes('No authenticated user') || error.message.includes('Authorization header')) {
                    alert('Sua sessão expirou. Por favor, faça login novamente.');
                    // Redirecionar para login
                    window.location.href = '/login';
                } else {
                    alert('Erro ao deletar endereço. Tente novamente.');
                }
            }
            setIsLoading(false);
        }
        setIsDeleteDialogOpen(false);
        setAddressToDelete(null);
    };

    const cancelDelete = () => {
        setIsDeleteDialogOpen(false);
        setAddressToDelete(null);
    };

    const handleSave = async () => {
        // Validar campos obrigatórios
        const requiredFields = ['nome', 'rua', 'numero', 'cidade'];
        const errors = {};
        
        requiredFields.forEach(field => {
            if (!currentAddress[field] || currentAddress[field].trim() === '') {
                errors[field] = 'Este campo é obrigatório';
            }
        });
        
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        
        // Limpar erros de validação se todos os campos estão preenchidos
        setValidationErrors({});

        setIsLoading(true);
        let updatedAddresses = [...addresses];
        if (editIndex === addresses.length) { // Novo endereço
            updatedAddresses.push(currentAddress);
        } else { // Editando endereço existente
            updatedAddresses[editIndex] = currentAddress;
        }

        try {
            const updatedUser = await User.updateMyUserData({ enderecos_salvos: updatedAddresses });
            setAddresses(updatedAddresses);
            onUserUpdate(updatedUser);
            
            // Limpar estado após salvar com sucesso
            setIsEditing(false);
            setCurrentAddress(null);
            setEditIndex(null);
            setIsMapOpen(false); // Fechar mapa se estiver aberto
            setHasLocationChanged(false); // Reset do estado de mudança
            
        } catch (error) {
            console.error("Erro ao salvar endereço:", error);
            
            // Tratar erros de autenticação
            if (error.message.includes('No authenticated user') || error.message.includes('Authorization header')) {
                alert('Sua sessão expirou. Por favor, faça login novamente.');
                // Redirecionar para login
                window.location.href = '/login';
            } else {
                alert('Erro ao salvar endereço. Tente novamente.');
            }
        }
        setIsLoading(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setCurrentAddress(null);
        setEditIndex(null);
        setIsMapOpen(false); // Fechar mapa se estiver aberto
        setHasLocationChanged(false); // Reset do estado de mudança
        setValidationErrors({}); // Limpar erros de validação
        setShowCoordinatesObtained(false); // Limpar indicador de coordenadas
    };

    const handleInputChange = (field, value) => {
        setCurrentAddress(prev => ({ ...prev, [field]: value }));
        
        // Limpar erro de validação quando o usuário começar a digitar
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleLocationSelect = (locationData) => {
        // Atualizar endereço com coordenadas selecionadas
        setCurrentAddress(prev => ({
            ...prev,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            referencia: `Coordenadas: ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`
        }));
        setHasLocationChanged(true); // Marcar que a localização foi alterada
        setShowCoordinatesObtained(true);
        setIsMapOpen(false);
        
        // Esconder o indicador após 3 segundos
        setTimeout(() => {
            setShowCoordinatesObtained(false);
        }, 3000);
    };

    const handleOpenMap = () => {
        console.log("🗺️ Abrindo mapa...", { isMapOpen, currentAddress });
        setIsMapOpen(true);
    };

    // Função para obter localização atual do cliente
    const getCurrentLocation = async () => {
        if (!navigator.geolocation) {
            console.log("⚠️ Geolocalização não suportada pelo navegador");
            return;
        }

        setIsGettingLocation(true);

        try {
            console.log("📍 Buscando localização atual do cliente...");
            
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutos
                });
            });

            const { latitude, longitude } = position.coords;
            console.log("✅ Localização atual obtida:", { latitude, longitude });

            // Obter endereço da localização
            const addressInfo = await reverseGeocode(latitude, longitude);
            
            // Atualizar apenas as coordenadas, mantendo os campos do formulário como estão
            setCurrentAddress(prev => ({
                ...prev,
                latitude,
                longitude,
                referencia: `Localização atual: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            }));

            setHasLocationChanged(true);
            setShowCoordinatesObtained(true);
            console.log("🎯 Coordenadas obtidas do GPS - campos devem ser preenchidos pelo cliente");
            
            // Esconder o indicador após 3 segundos
            setTimeout(() => {
                setShowCoordinatesObtained(false);
            }, 3000);

        } catch (error) {
            console.error("❌ Erro ao obter localização atual:", error);
            
            if (error.code === 1) {
                console.log("⚠️ Usuário negou permissão de localização");
            } else if (error.code === 2) {
                console.log("⚠️ Localização indisponível");
            } else if (error.code === 3) {
                console.log("⚠️ Timeout ao obter localização");
            }
        } finally {
            setIsGettingLocation(false);
        }
    };

    // Função para geocodificação reversa
    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pt-PT`,
                {
                    headers: {
                        'User-Agent': 'AmaDelivery-App/1.0'
                    }
                }
            );

            if (!response.ok) return null;

            const data = await response.json();
            if (data && data.address) {
                return {
                    rua: data.address.road || '',
                    numero: data.address.house_number || '',
                    bairro: data.address.suburb || data.address.quarter || '',
                    cidade: data.address.city || data.address.town || data.address.village || '',
                    cep: data.address.postcode || '',
                    display_name: data.display_name
                };
            }
            return null;
        } catch (error) {
            console.error("❌ Erro no reverse geocoding:", error);
            return null;
        }
    };

    if (isEditing) {
        return (
            <>
                <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>{editIndex === addresses.length ? 'Adicionar Novo Endereço' : 'Editar Endereço'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Object.keys(validationErrors).length > 0 && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    <p className="text-sm font-medium text-red-700">
                                        Campos obrigatórios não preenchidos
                                    </p>
                                </div>
                                <p className="text-xs text-red-600">
                                    Por favor, preencha todos os campos marcados com (*) para continuar.
                                </p>
                            </div>
                        )}
                        
                        <div className="space-y-1">
                            <Label htmlFor="nome">Nome do Endereço (ex: Casa, Trabalho) <span className="text-red-500">*</span></Label>
                            <Input 
                                id="nome" 
                                value={currentAddress.nome} 
                                onChange={e => handleInputChange('nome', e.target.value)} 
                                className={`h-12 ${validationErrors.nome ? 'border-red-500 focus:border-red-500' : ''}`}
                                placeholder="Ex: Casa, Trabalho, Apartamento"
                                required
                            />
                            {validationErrors.nome && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.nome}</p>
                            )}
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="rua">Rua <span className="text-red-500">*</span></Label>
                            <Input 
                                id="rua" 
                                value={currentAddress.rua} 
                                onChange={e => handleInputChange('rua', e.target.value)} 
                                className={`h-12 ${validationErrors.rua ? 'border-red-500 focus:border-red-500' : ''}`}
                                placeholder="Nome da rua"
                                required
                            />
                            {validationErrors.rua && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.rua}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="numero">Número <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="numero" 
                                    value={currentAddress.numero} 
                                    onChange={e => handleInputChange('numero', e.target.value)} 
                                    className={`h-12 ${validationErrors.numero ? 'border-red-500 focus:border-red-500' : ''}`}
                                    placeholder="Número"
                                    required
                                />
                                {validationErrors.numero && (
                                    <p className="text-red-500 text-xs mt-1">{validationErrors.numero}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="complemento">Complemento</Label>
                                <Input 
                                    id="complemento" 
                                    value={currentAddress.complemento} 
                                    onChange={e => handleInputChange('complemento', e.target.value)} 
                                    className="h-12" 
                                    placeholder="Apto, bloco, etc. (opcional)"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="bairro">Freguesia</Label>
                                <Input 
                                    id="bairro" 
                                    value={currentAddress.bairro} 
                                    onChange={e => handleInputChange('bairro', e.target.value)} 
                                    className="h-12" 
                                    placeholder="Freguesia (opcional)"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="cidade">Cidade <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="cidade" 
                                    value={currentAddress.cidade} 
                                    onChange={e => handleInputChange('cidade', e.target.value)} 
                                    className={`h-12 ${validationErrors.cidade ? 'border-red-500 focus:border-red-500' : ''}`}
                                    placeholder="Nome da cidade"
                                    required
                                />
                                {validationErrors.cidade && (
                                    <p className="text-red-500 text-xs mt-1">{validationErrors.cidade}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="cep">Código Postal</Label>
                            <Input 
                                id="cep" 
                                value={currentAddress.cep} 
                                onChange={e => handleInputChange('cep', e.target.value)} 
                                className="h-12" 
                                placeholder="CEP (opcional)"
                            />
                        </div>
                        
                    {/* Seção de Localização no Mapa */}
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">Localização no Mapa</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleOpenMap}
                                    className="h-10 px-4 text-sm"
                                >
                                    <MapPin className="w-4 h-4 mr-2" />
                                    Selecionar no Mapa
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={getCurrentLocation}
                                    disabled={isGettingLocation}
                                    className="h-10 px-4 text-sm"
                                >
                                    {isGettingLocation ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Navigation className="w-4 h-4 mr-2" />
                                    )}
                                    {isGettingLocation ? 'Buscando...' : 'Minha Localização'}
                                </Button>
                            </div>
                        </div>
                            
                        {isGettingLocation ? (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm font-medium">Buscando sua localização...</span>
                                </div>
                                <p className="text-xs text-blue-600 mt-1">
                                    Aguarde enquanto obtemos sua localização atual
                                </p>
                            </div>
                        ) : showCoordinatesObtained ? (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 text-green-700">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-sm font-medium">Coordenadas obtidas</span>
                                </div>
                                <p className="text-xs text-green-600 mt-1">
                                    Localização: {currentAddress.latitude.toFixed(6)}, {currentAddress.longitude.toFixed(6)}
                                </p>
                                <p className="text-xs text-green-500 mt-1">
                                    ✅ Preencha os campos do endereço e salve
                                </p>
                            </div>
                        ) : !currentAddress.latitude || !currentAddress.longitude ? (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2 text-yellow-700">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm font-medium">Localização não definida</span>
                                </div>
                                <p className="text-xs text-yellow-600 mt-1">
                                    Clique em "Minha Localização" ou "Selecionar no Mapa"
                                </p>
                            </div>
                        ) : null}
                    </div>
                    
                    {/* Mapa de Visualização da Localização Salva */}
                    {currentAddress.latitude && currentAddress.longitude && (
                        <div className="space-y-3 pt-4 border-t border-gray-200">
                            <Label className="text-base font-medium">Localização Salva</Label>
                            <div className="h-48 w-full rounded-lg overflow-hidden border border-gray-200">
                                <MapContainer
                                    center={[currentAddress.latitude, currentAddress.longitude]}
                                    zoom={16}
                                    style={{ height: '100%', width: '100%' }}
                                    scrollWheelZoom={false}
                                    zoomControl={false}
                                    dragging={false}
                                    touchZoom={false}
                                    doubleClickZoom={false}
                                    boxZoom={false}
                                    keyboard={false}
                                >
                                    <TileLayer
                                        attribution=""
                                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                    />
                                    
                                    {/* Marcador do Cliente */}
                                    <Marker 
                                        position={[currentAddress.latitude, currentAddress.longitude]} 
                                        icon={createCustomerMarkerIcon()}
                                    >
                                        <Popup>
                                            <div className="text-center">
                                                <h4 className="font-semibold text-orange-700 mb-1">
                                                    {currentAddress.nome || 'Seu Endereço'}
                                                </h4>
                                                <p className="text-sm text-gray-600">📍 Localização salva</p>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {currentAddress.rua && <div>{currentAddress.rua}</div>}
                                                    {currentAddress.cidade && <div>{currentAddress.cidade}</div>}
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                                Esta é a localização exata que será usada para entregas
                            </p>
                        </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                            <Button variant="ghost" onClick={handleCancel} className="h-12 text-base font-medium touch-manipulation">
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={isLoading} className="h-12 text-base font-medium touch-manipulation">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Modal do Mapa de Seleção de Localização */}
                {isMapOpen && (
                <LocationPickerMap
                    initialPosition={currentAddress.latitude && currentAddress.longitude 
                        ? [currentAddress.latitude, currentAddress.longitude] 
                        : [41.2704, -8.0818]
                    }
                    onLocationSelect={handleLocationSelect}
                    onClose={() => setIsMapOpen(false)}
                    addressData={currentAddress}
                    forceCenterOnAddress={true}
                />
                )}
            </>
        );
    }

    return (
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Meus Endereços</CardTitle>
                    <CardDescription>Gerencie seus endereços de entrega.</CardDescription>
                </div>
                <Button onClick={handleAddNew} className="h-12 px-6 text-base font-medium touch-manipulation">
                    <Plus className="mr-2 h-5 w-5" />
                    Adicionar
                </Button>
            </CardHeader>
            <CardContent>
                {addresses.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhum endereço salvo.</p>
                ) : (
                    <div className="space-y-4">
                        {addresses.map((address, index) => (
                            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="bg-orange-100 p-3 rounded-full">
                                        <MapPin className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{address.nome}</p>
                                        <p className="text-sm text-gray-600">{`${address.rua}, ${address.numero} - ${address.cidade}`}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="lg" 
                                        className="h-12 w-12 touch-manipulation"
                                        onClick={() => handleEdit(index)}
                                    >
                                        <Pencil className="h-5 w-5" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="lg" 
                                        className="h-12 w-12 touch-manipulation text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDelete(index)}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            
            {/* Modal de Confirmação de Exclusão */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md" aria-describedby="delete-address-description">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Confirmar Exclusão
                        </DialogTitle>
                    </DialogHeader>
                    <div id="delete-address-description" className="sr-only">
                        Confirmação para excluir o endereço selecionado
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            {addressToDelete && (
                                <>
                                    <div className="bg-orange-100 p-2 rounded-full">
                                        <MapPin className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{addressToDelete.nome}</p>
                                        <p className="text-sm text-gray-600">
                                            {addressToDelete.rua}, {addressToDelete.numero}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {addressToDelete.bairro}, {addressToDelete.cidade}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        <p className="text-gray-700">
                            Tem certeza que deseja remover este endereço? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button 
                                variant="outline" 
                                onClick={cancelDelete}
                                className="px-6"
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={confirmDelete}
                                className="px-6"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Excluir Endereço
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
