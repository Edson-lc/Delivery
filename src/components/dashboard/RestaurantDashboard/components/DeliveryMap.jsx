import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodeAddress, hasCoordinates, getApproximateCoordinates } from '@/utils/geocoding';

// Componente para controlar popup aberto
const OpenPopupMarker = ({ position, icon, children }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.openPopup();
    }
  }, []);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  );
};

// Componente para exibir rota de entrega
const DeliveryRoute = ({ map, restaurant, customerAddress, orderStatus }) => {
  const routeRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    console.log("🔍 DeliveryRoute useEffect:", {
      map: !!map,
      restaurant: !!restaurant,
      customerAddress: !!customerAddress,
      orderStatus,
      restaurantCoords: restaurant ? [restaurant.latitude, restaurant.longitude] : null,
      customerHasCoords: customerAddress ? hasCoordinates(customerAddress) : false
    });

    if (!map || !restaurant || !customerAddress || orderStatus !== 'entregue') {
      console.log("🔍 DeliveryRoute: Condições não atendidas para exibir rota");
      return;
    }

    console.log("✅ DeliveryRoute: Mapa está pronto, criando rota...");

      // Limpar linha e marcadores anteriores se existirem
      if (routeRef.current) {
        map.removeLayer(routeRef.current);
        routeRef.current = null;
      }
      
      // Limpar marcadores anteriores
      markersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      markersRef.current = [];

      // Obter coordenadas do restaurante
      const restaurantCoords = [restaurant.latitude, restaurant.longitude];
      
      // Obter coordenadas do cliente
      const customerCoords = hasCoordinates(customerAddress) 
        ? [customerAddress.latitude, customerAddress.longitude]
        : null;

      if (!customerCoords) {
        console.log("🔍 DeliveryRoute: Coordenadas do cliente não disponíveis");
        return;
      }

      console.log("🔍 DeliveryRoute: Criando rota de entrega", {
        restaurant: restaurantCoords,
        customer: customerCoords,
        status: orderStatus
      });

      // Criar linha simples conectando restaurante e cliente
      console.log("🔍 DeliveryRoute: Criando linha de entrega...");
      console.log("📍 Direção da rota: Restaurante → Cliente");
      console.log("   Ponto inicial (restaurante):", restaurantCoords);
      console.log("   Ponto final (cliente):", customerCoords);
      
      try {
        const polyline = L.polyline([
          [restaurantCoords[0], restaurantCoords[1]], // Ponto inicial: Restaurante
          [customerCoords[0], customerCoords[1]]        // Ponto final: Cliente
        ], {
          color: '#10B981', // Verde para rota de entrega
          weight: 6,
          opacity: 0.8,
          dashArray: '10, 10' // Linha tracejada para diferenciar da rota real
        }).addTo(map);
        
        routeRef.current = polyline;
        console.log("✅ DeliveryRoute: Linha de entrega criada com sucesso");

        // Criar marcadores específicos para início e fim da rota
        const startMarker = L.marker(restaurantCoords, {
          icon: L.divIcon({
            html: `
              <div style="
                background: #10B981;
                color: white;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">
                🏪
              </div>
            `,
            className: 'custom-start-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(map);

        const endMarker = L.marker(customerCoords, {
          icon: L.divIcon({
            html: `
              <div style="
                background: #3B82F6;
                color: white;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">
                🏠
              </div>
            `,
            className: 'custom-end-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(map);

        // Armazenar referências dos marcadores
        markersRef.current.push(startMarker, endMarker);

        // Adicionar popups informativos
        startMarker.bindPopup(`
          <div style="text-align: center;">
            <strong>🏪 Restaurante</strong><br>
            <small>Ponto de partida da entrega</small>
          </div>
        `);

        endMarker.bindPopup(`
          <div style="text-align: center;">
            <strong>🏠 Cliente</strong><br>
            <small>Destino da entrega</small>
          </div>
        `);

        // Ajustar zoom para mostrar toda a rota
        console.log("🔍 DeliveryRoute: Ajustando zoom para mostrar toda a rota...");
        const group = new L.featureGroup([
          startMarker,
          endMarker,
          polyline
        ]);
        map.fitBounds(group.getBounds().pad(0.1));
        console.log("✅ DeliveryRoute: Zoom ajustado");

      } catch (error) {
        console.error("❌ DeliveryRoute: Erro ao criar linha de entrega:", error);
      }

    return () => {
      if (routeRef.current) {
        map?.removeLayer(routeRef.current);
        routeRef.current = null;
        console.log("🔍 DeliveryRoute: Linha de entrega removida");
      }
      
      // Limpar marcadores
      markersRef.current.forEach(marker => {
        map?.removeLayer(marker);
      });
      markersRef.current = [];
      console.log("🔍 DeliveryRoute: Marcadores removidos");
    };
  }, [map, restaurant, customerAddress, orderStatus]);

  return null;
};

// Fix para ícones padrão do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Função para criar ícone personalizado com foto do entregador
const createDeliveryIcon = (entregador) => {
  const fotoUrl = entregador.fotoUrl || entregador.foto_url;
  const nome = entregador.nomeCompleto || entregador.nome_completo || 'E';
  
  if (fotoUrl) {
    // Ícone com foto
    return L.divIcon({
      html: `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid #10B981;
          overflow: hidden;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <img 
            src="${fotoUrl}" 
            alt="${nome}"
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
            "
            onerror="this.style.display='none'; this.nextSibling.style.display='flex';"
          />
          <div style="
            width: 100%;
            height: 100%;
            background: #10B981;
            display: none;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
          ">${nome.charAt(0)}</div>
        </div>
      `,
      className: 'custom-delivery-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  } else {
    // Ícone padrão verde
    return new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }
};

// Função para criar ícone personalizado do cliente
const createCustomerIcon = (order) => {
  const endereco = order?.enderecoEntrega;
  const clienteNome = order?.clienteNome || order?.cliente_nome || 'C';
  
  return L.divIcon({
    html: `
      <div style="
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: 4px solid #3B82F6;
        background: linear-gradient(135deg, #3B82F6, #1D4ED8);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5);
        animation: pulse 2s infinite;
        position: relative;
      ">
        <div style="
          font-size: 28px;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        ">🏠</div>
        <div style="
          position: absolute;
          top: -5px;
          right: -5px;
          width: 20px;
          height: 20px;
          background: #EF4444;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          font-weight: bold;
        ">!</div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    className: 'custom-customer-icon',
    iconSize: [60, 60],
    iconAnchor: [30, 30],
    popupAnchor: [0, -30]
  });
};

// Função para criar ícone personalizado com foto do restaurante
const createRestaurantIcon = (restaurant) => {
  const fotoUrl = restaurant.imagemUrl || restaurant.imagem_url;
  const nome = restaurant.nome || 'R';
  
  if (fotoUrl) {
    // Ícone com foto
    return L.divIcon({
      html: `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid #EF4444;
          overflow: hidden;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <img 
            src="${fotoUrl}" 
            alt="${nome}"
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
            "
            onerror="this.style.display='none'; this.nextSibling.style.display='flex';"
          />
          <div style="
            width: 100%;
            height: 100%;
            background: #EF4444;
            display: none;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
          ">${nome.charAt(0)}</div>
        </div>
      `,
      className: 'custom-restaurant-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  } else {
    // Ícone padrão com símbolo de restaurante
    return L.divIcon({
      html: `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid #EF4444;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <div style="
            font-size: 20px;
            color: #EF4444;
          ">🏪</div>
        </div>
      `,
      className: 'custom-restaurant-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  }
};

export default function DeliveryMap({ entregador, restaurant, order }) {
  const [clienteCoords, setClienteCoords] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapReady, setMapReady] = useState(false); // Added mapReady state
  const mapRef = useRef(null);

  console.log("🔍 DeliveryMap: Componente iniciado", {
    entregador: !!entregador,
    restaurant: !!restaurant,
    order: !!order
  });

  if (!entregador || !restaurant) {
    console.log("❌ DeliveryMap: Props obrigatórias não fornecidas");
    return null;
  }

  const entregadorLat = entregador.latitude;
  const entregadorLon = entregador.longitude;
  const restauranteLat = restaurant.latitude;
  const restauranteLon = restaurant.longitude;

  // Coordenadas do cliente - priorizar endereço da ordem
  const enderecoCliente = order?.endereco_entrega || order?.enderecoEntrega;
  let clienteLat = null;
  let clienteLon = null;
  
  console.log("🔍 DEBUG - Endereço do cliente:", enderecoCliente);
  console.log("🔍 DEBUG - Cliente coords:", clienteCoords);
  console.log("🔍 DEBUG - Is geocoding:", isGeocoding);
  
  if (enderecoCliente && typeof enderecoCliente === 'object') {
    // PRIORIDADE 1: Coordenadas salvas no endereço da ordem (selecionadas pelo cliente no mapa)
    if (hasCoordinates(enderecoCliente)) {
      clienteLat = enderecoCliente.latitude || enderecoCliente.lat;
      clienteLon = enderecoCliente.longitude || enderecoCliente.lng || enderecoCliente.lon;
      console.log("✅ PRIORIDADE 1 - Coordenadas do endereço da ordem:", { clienteLat, clienteLon });
    } 
    // PRIORIDADE 2: Coordenadas geocodificadas automaticamente (serviço automático)
    else if (clienteCoords) {
      clienteLat = clienteCoords.latitude;
      clienteLon = clienteCoords.longitude;
      console.log("✅ PRIORIDADE 2 - Coordenadas do serviço automático:", { clienteLat, clienteLon });
    } 
    // PRIORIDADE 3: Iniciar geocodificação automática
    else {
      console.log("⚠️ Sem coordenadas - iniciando serviço automático de geocodificação");
    }
  }

  // Efeito para monitorar mudanças no mapReady
  useEffect(() => {
    console.log("🔍 DeliveryMap: mapReady mudou para:", mapReady);
  }, [mapReady]);

  // Efeito para serviço automático de geocodificação (apenas se não houver coordenadas do endereço da ordem)
  useEffect(() => {
    // Só usar serviço automático se não houver coordenadas salvas no endereço da ordem
    if (enderecoCliente && typeof enderecoCliente === 'object' && !hasCoordinates(enderecoCliente) && !clienteCoords && !isGeocoding) {
      setIsGeocoding(true);
      
      console.log("🔍 Iniciando serviço automático de geocodificação:", enderecoCliente);
      
      // Serviço automático: geocodificação precisa baseada em rua e número
      geocodeAddress(enderecoCliente)
        .then(coords => {
          if (coords) {
            setClienteCoords(coords);
            console.log("✅ Serviço automático - coordenadas precisas obtidas:", coords);
          } else {
            console.log("⚠️ Serviço automático falhou, tentando coordenadas aproximadas");
            // Fallback para coordenadas aproximadas apenas se a geocodificação falhar
            return getApproximateCoordinates(enderecoCliente);
          }
        })
        .then(fallbackCoords => {
          if (fallbackCoords && !clienteCoords) {
            setClienteCoords(fallbackCoords);
            console.log("⚡ Serviço automático - usando coordenadas aproximadas:", fallbackCoords);
          }
        })
        .catch(error => {
          console.error("❌ Erro no serviço automático de geocodificação:", error);
        })
        .finally(() => {
          setIsGeocoding(false);
        });
    } else if (hasCoordinates(enderecoCliente)) {
      console.log("⚡ Usando coordenadas do endereço da ordem - serviço automático não necessário");
    }
  }, [enderecoCliente, clienteCoords, isGeocoding]);

  if (!entregadorLat || !entregadorLon || !restauranteLat || !restauranteLon) {
    console.log("❌ DeliveryMap: Coordenadas obrigatórias não disponíveis", {
      entregadorLat,
      entregadorLon,
      restauranteLat,
      restauranteLon
    });
    return (
      <div className="w-full h-56 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">Coordenadas não disponíveis</p>
      </div>
    );
  }

  // Validar se as coordenadas são números válidos
  if (isNaN(entregadorLat) || isNaN(entregadorLon) || isNaN(restauranteLat) || isNaN(restauranteLon)) {
    console.log("❌ DeliveryMap: Coordenadas não são números válidos", {
      entregadorLat,
      entregadorLon,
      restauranteLat,
      restauranteLon
    });
    return (
      <div className="w-full h-56 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">Coordenadas inválidas</p>
      </div>
    );
  }

  // Mostrar indicador de carregamento durante geocodificação (apenas se não houver coordenadas salvas)
  if (isGeocoding && !hasCoordinates(enderecoCliente)) {
    return (
      <div className="w-full h-56 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Obtendo localização do cliente...</p>
        </div>
      </div>
    );
  }

  // Calcular o centro do mapa
  let centerLat, centerLon;
  if (clienteLat && clienteLon) {
    // Se temos coordenadas do cliente, centralizar entre os 3 pontos
    const lats = [entregadorLat, restauranteLat, clienteLat];
    const lons = [entregadorLon, restauranteLon, clienteLon];
    centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
    centerLon = lons.reduce((sum, lon) => sum + lon, 0) / lons.length;
  } else {
    // Se não temos coordenadas do cliente, centralizar entre entregador e restaurante
    centerLat = (entregadorLat + restauranteLat) / 2;
    centerLon = (entregadorLon + restauranteLon) / 2;
  }

  console.log("🔍 DeliveryMap: Renderizando componente", {
    mapReady,
    mapRef: !!mapRef.current,
    centerLat,
    centerLon,
    entregadorLat,
    entregadorLon,
    restauranteLat,
    restauranteLon,
    clienteLat,
    clienteLon
  });

  // Validar coordenadas antes de renderizar o mapa
  if (!centerLat || !centerLon || isNaN(centerLat) || isNaN(centerLon)) {
    console.log("❌ DeliveryMap: Coordenadas inválidas para centro do mapa", {
      centerLat,
      centerLon,
      entregadorLat,
      entregadorLon,
      restauranteLat,
      restauranteLon,
      clienteLat,
      clienteLon
    });
    return (
      <div className="w-full h-56 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">Coordenadas inválidas para o mapa</p>
      </div>
    );
  }

  try {
    return (
      <div className="w-full h-56 rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={[centerLat, centerLon]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          zoomControl={false}
          whenCreated={(map) => {
            console.log("🔍 DeliveryMap: whenCreated callback executado", {
              map: !!map,
              mapReady: mapReady
            });
            mapRef.current = map;
            setMapReady(true); // Mark map as ready
            console.log("✅ DeliveryMap: Mapa inicializado e pronto");
          }}
        >
        <TileLayer
          attribution=""
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Marcador do Entregador */}
        <OpenPopupMarker 
          position={[entregadorLat, entregadorLon]} 
          icon={createDeliveryIcon(entregador)}
        >
          <Popup>
            <div className="text-center">
              <h4 className="font-semibold text-green-700 mb-1">
                {entregador.nomeCompleto || entregador.nome_completo || 'Entregador'}
              </h4>
              <p className="text-sm text-gray-600">📍 Localização atual</p>
            </div>
          </Popup>
        </OpenPopupMarker>

        {/* Marcador do Restaurante */}
        <Marker 
          position={[restauranteLat, restauranteLon]} 
          icon={createRestaurantIcon(restaurant)}
        >
          <Popup>
            <div className="text-center">
              <h4 className="font-semibold text-red-700 mb-1">
                {restaurant.nome || 'Restaurante'}
              </h4>
              <p className="text-sm text-gray-600">🏪 Estabelecimento</p>
            </div>
          </Popup>
        </Marker>

        {/* Marcador do Cliente (se coordenadas disponíveis) */}
        {clienteLat && clienteLon && (
          <>
            {console.log("🎯 RENDERIZANDO marcador do cliente:", { 
              clienteLat, 
              clienteLon, 
              source: hasCoordinates(enderecoCliente) ? 'endereço da ordem' : 'serviço automático' 
            })}
            <Marker 
              position={[clienteLat, clienteLon]} 
              icon={createCustomerIcon(order)}
            >
              <Popup>
                <div className="text-center">
                  <h4 className="font-semibold text-blue-700 mb-1">
                    {order?.clienteNome || order?.cliente_nome || 'Cliente'}
                  </h4>
                  <p className="text-sm text-gray-600">🏠 Endereço de entrega</p>
                  {enderecoCliente && typeof enderecoCliente === 'object' && (
                    <div className="text-xs text-gray-500 mt-1">
                      {enderecoCliente.rua && <div>{enderecoCliente.rua}</div>}
                      {enderecoCliente.cidade && <div>{enderecoCliente.cidade}</div>}
                      {hasCoordinates(enderecoCliente) ? (
                        <div className="text-green-600 font-medium">📍 Localização do cliente (precisa)</div>
                      ) : (
                        <div className="text-blue-600 font-medium">📍 Localização automática</div>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          </>
        )}
        {!clienteLat && !clienteLon && (
          <>
            {console.log("❌ NÃO renderizando marcador do cliente - sem coordenadas")}
          </>
        )}
        
        {/* Rota de entrega para status "entregue" */}
        {(() => {
          console.log("🔍 DeliveryMap: Renderizando DeliveryRoute", {
            mapReady,
            mapRef: !!mapRef.current,
            restaurant: !!restaurant,
            enderecoCliente: !!enderecoCliente,
            orderStatus: order?.status,
            orderId: order?.id
          });
          return null;
        })()}
        {mapReady && (
          <DeliveryRoute 
            map={mapRef.current}
            restaurant={restaurant}
            customerAddress={enderecoCliente}
            orderStatus={order?.status}
          />
        )}
      </MapContainer>
    </div>
  );
  } catch (error) {
    console.error("❌ DeliveryMap: Erro ao renderizar mapa:", error);
    return (
      <div className="w-full h-56 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-sm mb-2">Erro ao carregar mapa</p>
          <p className="text-gray-500 text-xs">{error.message}</p>
        </div>
      </div>
    );
  }
}
