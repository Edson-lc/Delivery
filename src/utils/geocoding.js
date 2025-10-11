/**
 * Utilitários para geocodificação de endereços
 */

// Cache para coordenadas geocodificadas
const geocodingCache = new Map();

/**
 * Converte um endereço em coordenadas usando a API do OpenStreetMap Nominatim
 * @param {Object} endereco - Objeto com dados do endereço
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export async function geocodeAddress(endereco) {
  if (!endereco) return null;

  try {
    // Construir string do endereço priorizando rua e número
    const addressParts = [];
    
    // Priorizar rua e número para maior precisão
    if (endereco.rua && endereco.numero) {
      addressParts.push(`${endereco.rua}, ${endereco.numero}`);
    } else if (endereco.rua) {
      addressParts.push(endereco.rua);
    }
    
    // Adicionar cidade para contexto
    if (endereco.cidade) addressParts.push(endereco.cidade);
    
    // Adicionar país para garantir resultados em Portugal
    addressParts.push('Portugal');
    
    const addressString = addressParts.join(', ');
    
    if (!addressString.trim()) {
      console.log("⚠️ Endereço vazio para geocodificação");
      return null;
    }

    // Verificar cache primeiro
    const cacheKey = addressString.toLowerCase().trim();
    if (geocodingCache.has(cacheKey)) {
      console.log("⚡ Coordenadas obtidas do cache:", geocodingCache.get(cacheKey));
      return geocodingCache.get(cacheKey);
    }

    console.log("🔍 Geocodificando endereço:", addressString);

    // Timeout de 5 segundos para evitar travamento
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
    // Usar API do Nominatim (OpenStreetMap) - gratuita e sem chave
    // Priorizar rua e número para maior precisão
    const searchQuery = addressString;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=pt&addressdetails=1&extratags=1`;
    
    console.log("🔍 URL de busca:", url);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AmaDelivery-App/1.0',
        'Accept-Language': 'pt-PT,pt;q=0.9'
      }
    });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        
        // Validar se as coordenadas são válidas
        if (isNaN(latitude) || isNaN(longitude)) {
          console.log("⚠️ Coordenadas inválidas recebidas:", { lat: result.lat, lon: result.lon });
          return null;
        }
        
        // Verificar se está em Portugal (aproximadamente)
        if (latitude < 36.8 || latitude > 42.2 || longitude < -9.5 || longitude > -6.2) {
          console.log("⚠️ Coordenadas fora de Portugal:", { latitude, longitude });
          return null;
        }
        
        const coordinates = {
          latitude,
          longitude
        };
        
        // Salvar no cache
        geocodingCache.set(cacheKey, coordinates);
        
        console.log("✅ Geocodificação bem-sucedida:", coordinates);
        console.log("📍 Endereço encontrado:", result.display_name);
        
        return coordinates;
      } else {
        console.log("⚠️ Nenhum resultado encontrado para o endereço:", addressString);
        return null;
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("⏰ Timeout na geocodificação (5s)");
    } else {
      console.error("❌ Erro na geocodificação:", error);
    }
    return null;
  }
}

/**
 * Formata um endereço para geocodificação
 * @param {Object} endereco - Objeto com dados do endereço
 * @returns {string} - Endereço formatado
 */
export function formatAddressForGeocoding(endereco) {
  if (!endereco) return '';
  
  const parts = [];
  
  if (endereco.rua) parts.push(endereco.rua);
  if (endereco.numero) parts.push(endereco.numero);
  if (endereco.bairro) parts.push(endereco.bairro);
  if (endereco.cidade) parts.push(endereco.cidade);
  if (endereco.cep) parts.push(endereco.cep);
  
  return parts.join(', ');
}

/**
 * Verifica se um endereço já possui coordenadas
 * @param {Object} endereco - Objeto com dados do endereço
 * @returns {boolean}
 */
export function hasCoordinates(endereco) {
  if (!endereco || typeof endereco !== 'object') return false;
  
  const lat = endereco.latitude || endereco.lat;
  const lon = endereco.longitude || endereco.lng || endereco.lon;
  
  return lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon));
}

/**
 * Obtém coordenadas aproximadas baseadas na cidade (fallback rápido)
 * @param {Object} endereco - Objeto com dados do endereço
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export async function getApproximateCoordinates(endereco) {
  if (!endereco) return null;

  // Coordenadas aproximadas de cidades portuguesas conhecidas
  const cityCoordinates = {
    'amarante': { latitude: 41.2704, longitude: -8.0818 },
    'porto': { latitude: 41.1579, longitude: -8.6291 },
    'lisboa': { latitude: 38.7223, longitude: -9.1393 },
    'braga': { latitude: 41.5518, longitude: -8.4229 },
    'coimbra': { latitude: 40.2033, longitude: -8.4103 },
    'aveiro': { latitude: 40.6443, longitude: -8.6455 },
    'viseu': { latitude: 40.6566, longitude: -7.9139 },
    'faro': { latitude: 37.0194, longitude: -7.9322 },
    'leiria': { latitude: 39.7436, longitude: -8.8071 },
    'setubal': { latitude: 38.5244, longitude: -8.8882 }
  };

  const cidade = endereco.cidade?.toLowerCase().trim();
  
  if (cidade && cityCoordinates[cidade]) {
    console.log("⚡ Usando coordenadas aproximadas da cidade:", cidade);
    return cityCoordinates[cidade];
  }

  return null;
}
