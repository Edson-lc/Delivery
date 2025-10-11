/**
 * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
 * @param {number} lat1 - Latitude do primeiro ponto
 * @param {number} lon1 - Longitude do primeiro ponto
 * @param {number} lat2 - Latitude do segundo ponto
 * @param {number} lon2 - Longitude do segundo ponto
 * @returns {number} - Distância em quilômetros
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em quilômetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

/**
 * Formata um endereço para exibição
 * @param {string|Object} address - Endereço como string ou objeto
 * @returns {string} - Endereço formatado
 */
export function formatAddress(address) {
  if (!address) return 'Endereço não informado';
  
  if (typeof address === 'string') {
    return address;
  }
  
  if (typeof address === 'object') {
    const parts = [];
    if (address.rua) parts.push(address.rua);
    if (address.numero) parts.push(address.numero);
    if (address.complemento) parts.push(address.complemento);
    if (address.bairro) parts.push(address.bairro);
    if (address.cidade) parts.push(address.cidade);
    if (address.cep) parts.push(address.cep);
    
    return parts.length > 0 ? parts.join(', ') : 'Endereço não informado';
  }
  
  return 'Endereço não informado';
}

/**
 * Calcula o tempo de atraso de um pedido baseado na data de confirmação e tempo de preparo
 * @param {Object} order - Objeto do pedido
 * @returns {number|null} - Tempo de atraso em minutos (null se não houver atraso ou pedido não confirmado)
 */
export function calculateOrderDelay(order) {
  if (!order) return null;

  // Verificar ambos os nomes possíveis devido à transformação de dados
  const confirmationDate = order?.dataConfirmacao || order?.data_confirmacao;
  const preparationTime = order?.tempoPreparo || order?.tempo_preparo || 30;

  // Só calcular atraso para pedidos confirmados
  if (!confirmationDate) {
    console.log("⚠️ calculateOrderDelay: Pedido não confirmado", { 
      order: order?.id,
      confirmationDate: confirmationDate,
      status: order?.status
    });
    return null;
  }

  const orderDate = new Date(confirmationDate);
  const now = new Date();

  // Calcular quando o pedido deveria estar pronto
  const expectedReadyTime = new Date(orderDate.getTime() + (preparationTime * 60 * 1000));

  // Calcular diferença em minutos
  const diffInMinutes = Math.floor((now - expectedReadyTime) / (1000 * 60));

  console.log("🔍 calculateOrderDelay:", {
    orderId: order.id,
    preparationTime,
    startDate: orderDate.toISOString(),
    dateSource: 'confirmação',
    expectedReadyTime: expectedReadyTime.toISOString(),
    now: now.toISOString(),
    diffInMinutes
  });

  // Retornar apenas se houver atraso (valor positivo)
  return diffInMinutes > 0 ? diffInMinutes : null;
}

/**
 * Calcula a distância entre o entregador e o restaurante
 * @param {Object} entregador - Objeto do entregador
 * @param {Object} restaurante - Objeto do restaurante
 * @returns {number|null} - Distância em quilômetros (null se coordenadas não disponíveis)
 */
export function calculateDeliveryDistance(entregador, restaurante) {
  if (!entregador || !restaurante) return null;

  const entregadorLat = entregador.latitude;
  const entregadorLon = entregador.longitude;
  const restauranteLat = restaurante.latitude;
  const restauranteLon = restaurante.longitude;

  if (!entregadorLat || !entregadorLon || !restauranteLat || !restauranteLon) {
    console.log("⚠️ calculateDeliveryDistance: Coordenadas não disponíveis", {
      entregador: { lat: entregadorLat, lon: entregadorLon },
      restaurante: { lat: restauranteLat, lon: restauranteLon }
    });
    return null;
  }

  const distance = calculateDistance(entregadorLat, entregadorLon, restauranteLat, restauranteLon);
  
  console.log("🔍 calculateDeliveryDistance:", {
    entregador: { lat: entregadorLat, lon: entregadorLon },
    restaurante: { lat: restauranteLat, lon: restauranteLon },
    distance: distance.toFixed(2)
  });

  return distance;
}

/**
 * Calcula o tempo estimado de entrega baseado na distância
 * @param {number} distanceKm - Distância em quilômetros
 * @returns {number} - Tempo estimado em minutos
 */
export function calculateEstimatedDeliveryTime(distanceKm) {
  if (!distanceKm || distanceKm <= 0) return 0;

  // Velocidade média de entrega: 20 km/h (0.33 km/min)
  const averageSpeedKmPerMin = 0.33;
  
  // Tempo base: 5 minutos para preparação e coleta
  const baseTimeMinutes = 5;
  
  // Tempo de deslocamento
  const travelTimeMinutes = distanceKm / averageSpeedKmPerMin;
  
  // Tempo total estimado
  const totalTimeMinutes = Math.ceil(baseTimeMinutes + travelTimeMinutes);
  
  console.log("🔍 calculateEstimatedDeliveryTime:", {
    distanceKm: distanceKm.toFixed(2),
    travelTimeMinutes: travelTimeMinutes.toFixed(1),
    baseTimeMinutes,
    totalTimeMinutes
  });

  return totalTimeMinutes;
}