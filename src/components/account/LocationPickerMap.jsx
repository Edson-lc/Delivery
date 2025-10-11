import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

// Fix para ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ícone personalizado para o marcador
const createCustomMarkerIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 4px solid #f97316;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      ">
        <div style="
          font-size: 20px;
          color: #f97316;
        ">📍</div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    className: 'custom-location-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

// Componente para capturar eventos do mapa
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      console.log("🗺️ Evento de clique capturado:", e.latlng);
      onMapClick(e);
    }
  });
  return null;
}

export default function LocationPickerMap({ 
  initialPosition = [41.2704, -8.0818], // Amarante como padrão
  onLocationSelect,
  onClose,
  addressData = {},
  forceCenterOnAddress = false
}) {
  console.log("🗺️ LocationPickerMap renderizado:", { initialPosition, addressData });
  const [selectedPosition, setSelectedPosition] = useState(initialPosition);
  const [isLoading, setIsLoading] = useState(false);
  const [addressInfo, setAddressInfo] = useState(null);
  const mapRef = useRef(null);

  // Efeito para atualizar o mapa quando a posição muda
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setView(selectedPosition, 16);
      console.log("🗺️ Mapa centralizado em:", selectedPosition);
    }
  }, [selectedPosition]);

  // Efeito para forçar centralização quando o modal abre
  useEffect(() => {
    if (mapRef.current && forceCenterOnAddress) {
      const map = mapRef.current;
      // Pequeno delay para garantir que o mapa está renderizado
      setTimeout(() => {
        map.setView(selectedPosition, 16);
        console.log("🎯 Forçando centralização no endereço:", selectedPosition);
      }, 100);
    }
  }, [forceCenterOnAddress, selectedPosition]);

  // Coordenadas padrão para cidades portuguesas
  const defaultPositions = {
    'amarante': [41.2704, -8.0818],
    'porto': [41.1579, -8.6291],
    'lisboa': [38.7223, -9.1393],
    'braga': [41.5518, -8.4229],
    'coimbra': [40.2033, -8.4103],
    'aveiro': [40.6443, -8.6455],
    'viseu': [40.6566, -7.9139],
    'faro': [37.0194, -7.9322],
    'leiria': [39.7436, -8.8071],
    'setubal': [38.5244, -8.8882]
  };

  // Função para obter coordenadas aproximadas baseadas na cidade
  const getApproximatePosition = () => {
    if (addressData.cidade) {
      const cidade = addressData.cidade.toLowerCase().trim();
      if (defaultPositions[cidade]) {
        return defaultPositions[cidade];
      }
    }
    return initialPosition;
  };

  // Função para geocodificar endereço
  const geocodeAddress = async (addressString) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1&countrycodes=pt&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'AmaDelivery-App/1.0',
            'Accept-Language': 'pt-PT,pt;q=0.9'
          }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Erro na geocodificação:', error);
      return null;
    }
  };

  // Função para obter endereço reverso (coordenadas -> endereço)
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
      console.error('Erro no reverse geocoding:', error);
      return null;
    }
  };

  // Efeito para inicializar posição baseada no endereço
  useEffect(() => {
    const initializePosition = async () => {
      // PRIORIDADE 1: Se tem coordenadas salvas, usar elas
      if (addressData.latitude && addressData.longitude) {
        console.log("🎯 Usando coordenadas salvas do endereço:", { 
          lat: addressData.latitude, 
          lng: addressData.longitude 
        });
        setSelectedPosition([addressData.latitude, addressData.longitude]);
        setAddressInfo(`Localização salva: ${addressData.latitude.toFixed(6)}, ${addressData.longitude.toFixed(6)}`);
        return;
      }

      // PRIORIDADE 2: Geocodificar endereço se disponível
      if (addressData.rua && addressData.numero && addressData.cidade) {
        setIsLoading(true);
        const addressString = `${addressData.rua}, ${addressData.numero}, ${addressData.cidade}, Portugal`;
        const result = await geocodeAddress(addressString);
        
        if (result) {
          setSelectedPosition([result.lat, result.lng]);
          setAddressInfo(result.address);
        } else {
          // Fallback para coordenadas aproximadas da cidade
          const approxPos = getApproximatePosition();
          setSelectedPosition(approxPos);
        }
        setIsLoading(false);
      } else {
        // PRIORIDADE 3: Usar coordenadas aproximadas da cidade se disponível
        const approxPos = getApproximatePosition();
        setSelectedPosition(approxPos);
      }
    };

    initializePosition();
  }, [addressData]);

  // Função para lidar com clique no mapa
  const handleMapClick = async (e) => {
    console.log("🗺️ Clique no mapa detectado:", e.latlng);
    const { lat, lng } = e.latlng;
    setSelectedPosition([lat, lng]);
    
    // Obter informações do endereço
    setIsLoading(true);
    try {
      const addressInfo = await reverseGeocode(lat, lng);
      if (addressInfo) {
        setAddressInfo(addressInfo.display_name);
        console.log("📍 Endereço obtido:", addressInfo.display_name);
      }
    } catch (error) {
      console.error("Erro ao obter endereço:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para confirmar seleção
  const handleConfirmSelection = () => {
    onLocationSelect({
      latitude: selectedPosition[0],
      longitude: selectedPosition[1],
      addressInfo: addressInfo
    });
  };

  // Função para usar localização atual
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo navegador');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedPosition([latitude, longitude]);
        
        // Obter informações do endereço
        const addressInfo = await reverseGeocode(latitude, longitude);
        if (addressInfo) {
          setAddressInfo(addressInfo.display_name);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        alert('Não foi possível obter sua localização atual');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            Selecionar Localização
          </CardTitle>
          <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
            ✕
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            {/* Mapa */}
            <div className="h-96 w-full relative">
              <div className="absolute top-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm">
                <p className="text-xs text-gray-600 font-medium">Clique no mapa para selecionar a localização</p>
              </div>
              <MapContainer
                center={selectedPosition}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  attribution=""
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                
                {/* Componente para capturar cliques */}
                <MapClickHandler onMapClick={handleMapClick} />
                
                {/* Marcador da localização selecionada */}
                <Marker 
                  position={selectedPosition} 
                  icon={createCustomMarkerIcon()}
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold text-orange-700">Localização Selecionada</p>
                      <p className="text-sm text-gray-600">Clique no mapa para alterar</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            {/* Overlay de carregamento */}
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Processando localização...</p>
                </div>
              </div>
            )}

            {/* Informações da localização */}
            <div className="p-4 bg-gray-50 border-t">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Coordenadas:</p>
                  <p className="text-sm text-gray-600">
                    {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
                  </p>
                </div>
                
                {addressInfo && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Endereço detectado:</p>
                    <p className="text-sm text-gray-600">{addressInfo}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleUseCurrentLocation}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Minha Localização
                  </Button>
                  
                  <Button
                    onClick={handleConfirmSelection}
                    disabled={isLoading}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Confirmar Localização
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
