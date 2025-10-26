// Script para verificar coordenadas do pedido e calcular distância correta
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para calcular distância (cópia da função do frontend)
function calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2 || coord1.length !== 2 || coord2.length !== 2) {
        return 0;
    }
    
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    
    const R = 6371; // Raio da Terra em km
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

async function checkCoordinates() {
    try {
        console.log('🔍 Verificando coordenadas do pedido...');
        
        // Buscar o pedido mais recente
        const order = await prisma.order.findFirst({
            where: { numeroPedido: '#38535576' },
            include: { 
                restaurant: {
                    select: {
                        nome: true,
                        latitude: true,
                        longitude: true
                    }
                }
            }
        });
        
        if (!order) {
            console.log('❌ Pedido não encontrado');
            return;
        }
        
        console.log('📋 Pedido encontrado:');
        console.log('Número:', order.numeroPedido);
        console.log('Cliente:', order.clienteNome);
        
        // Verificar coordenadas do restaurante
        console.log('\n🏪 Restaurante:');
        console.log('Nome:', order.restaurant.nome);
        console.log('Latitude:', order.restaurant.latitude);
        console.log('Longitude:', order.restaurant.longitude);
        
        // Verificar endereço de entrega
        console.log('\n🏠 Endereço de entrega:');
        console.log('Tipo:', typeof order.enderecoEntrega);
        console.log('Conteúdo:', JSON.stringify(order.enderecoEntrega, null, 2));
        
        // Extrair coordenadas do endereço de entrega
        let deliveryLat = null;
        let deliveryLon = null;
        
        if (order.enderecoEntrega && typeof order.enderecoEntrega === 'object') {
            deliveryLat = order.enderecoEntrega.latitude;
            deliveryLon = order.enderecoEntrega.longitude;
        }
        
        console.log('\n📍 Coordenadas de entrega:');
        console.log('Latitude:', deliveryLat);
        console.log('Longitude:', deliveryLon);
        
        // Calcular distância se temos coordenadas válidas
        if (order.restaurant.latitude && order.restaurant.longitude && deliveryLat && deliveryLon) {
            const restaurantCoords = [order.restaurant.latitude, order.restaurant.longitude];
            const deliveryCoords = [deliveryLat, deliveryLon];
            
            const distance = calculateDistance(restaurantCoords, deliveryCoords);
            
            console.log('\n📏 Cálculo de distância:');
            console.log('Restaurante:', restaurantCoords);
            console.log('Entrega:', deliveryCoords);
            console.log('Distância:', distance.toFixed(2), 'km');
            
            if (distance > 100) {
                console.log('⚠️ ATENÇÃO: Distância muito alta! Possível erro nas coordenadas.');
            }
        } else {
            console.log('❌ Coordenadas incompletas para cálculo de distância');
        }
        
        // Verificar entregadores próximos
        console.log('\n🚗 Entregadores disponíveis:');
        const drivers = await prisma.entregador.findMany({
            where: {
                disponivel: true,
                latitude: { not: null },
                longitude: { not: null }
            },
            select: {
                id: true,
                nomeCompleto: true,
                latitude: true,
                longitude: true
            }
        });
        
        console.log(`Encontrados ${drivers.length} entregadores com coordenadas:`);
        drivers.forEach((driver, index) => {
            console.log(`${index + 1}. ${driver.nomeCompleto} - [${driver.latitude}, ${driver.longitude}]`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCoordinates();
