// Script para verificar coordenadas do Mediterrâneo Fresh
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMediterraneoCoordinates() {
    try {
        console.log('🔍 Verificando coordenadas do Mediterrâneo Fresh...');
        
        // Buscar o restaurante Mediterrâneo Fresh
        const restaurant = await prisma.restaurant.findFirst({
            where: {
                nome: {
                    contains: 'Mediterrâneo'
                }
            },
            select: {
                id: true,
                nome: true,
                latitude: true,
                longitude: true,
                endereco: true,
                cidade: true
            }
        });
        
        if (!restaurant) {
            console.log('❌ Restaurante Mediterrâneo Fresh não encontrado');
            return;
        }
        
        console.log('🏪 Restaurante encontrado:');
        console.log('Nome:', restaurant.nome);
        console.log('Endereço:', restaurant.endereco);
        console.log('Cidade:', restaurant.cidade);
        console.log('Latitude:', restaurant.latitude);
        console.log('Longitude:', restaurant.longitude);
        
        // Buscar o pedido atual
        const order = await prisma.order.findFirst({
            where: { numeroPedido: '#39868939' },
            include: {
                restaurant: true
            }
        });
        
        if (order) {
            console.log('\n📋 Pedido atual:');
            console.log('Número:', order.numeroPedido);
            console.log('Status:', order.status);
            console.log('Cliente:', order.clienteNome);
            
            // Verificar endereço de entrega
            if (order.enderecoEntrega && typeof order.enderecoEntrega === 'object') {
                console.log('\n🏠 Endereço de entrega:');
                console.log('Rua:', order.enderecoEntrega.rua);
                console.log('Cidade:', order.enderecoEntrega.cidade);
                console.log('Latitude:', order.enderecoEntrega.latitude);
                console.log('Longitude:', order.enderecoEntrega.longitude);
                
                // Calcular distância se temos coordenadas válidas
                if (restaurant.latitude && restaurant.longitude && order.enderecoEntrega.latitude && order.enderecoEntrega.longitude) {
                    const restaurantCoords = [restaurant.latitude, restaurant.longitude];
                    const deliveryCoords = [order.enderecoEntrega.latitude, order.enderecoEntrega.longitude];
                    
                    // Função de cálculo de distância
                    function calculateDistance(coord1, coord2) {
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
                    
                    const distance = calculateDistance(restaurantCoords, deliveryCoords);
                    
                    console.log('\n📏 Cálculo de distância:');
                    console.log('Restaurante:', restaurantCoords);
                    console.log('Entrega:', deliveryCoords);
                    console.log('Distância:', distance.toFixed(2), 'km');
                    
                    if (distance > 100) {
                        console.log('⚠️ PROBLEMA: Distância muito alta!');
                        console.log('🔧 Vamos corrigir as coordenadas do restaurante...');
                        
                        // Coordenadas corretas para Porto (onde deve estar o Mediterrâneo Fresh)
                        const correctLatitude = 41.1579; // Porto
                        const correctLongitude = -8.6291; // Porto
                        
                        await prisma.restaurant.update({
                            where: { id: restaurant.id },
                            data: {
                                latitude: correctLatitude,
                                longitude: correctLongitude
                            }
                        });
                        
                        console.log('✅ Coordenadas do restaurante atualizadas para Porto');
                        
                        // Recalcular distância
                        const newDistance = calculateDistance([correctLatitude, correctLongitude], deliveryCoords);
                        console.log('📏 Nova distância:', newDistance.toFixed(2), 'km');
                    } else {
                        console.log('✅ Distância está correta!');
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMediterraneoCoordinates();
