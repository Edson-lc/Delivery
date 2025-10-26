// Script para verificar qual pedido está sendo mostrado para entregadores
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCurrentOrder() {
    try {
        console.log('🔍 Verificando pedidos prontos para entregadores...');
        
        // Buscar pedidos prontos sem entregador
        const readyOrders = await prisma.order.findMany({
            where: {
                status: 'pronto',
                entregadorId: null
            },
            include: {
                restaurant: {
                    select: {
                        nome: true,
                        latitude: true,
                        longitude: true
                    }
                }
            },
            orderBy: { createdDate: 'desc' }
        });
        
        console.log(`📋 Pedidos prontos encontrados: ${readyOrders.length}`);
        
        readyOrders.forEach((order, index) => {
            console.log(`\n${index + 1}. Pedido ${order.numeroPedido}:`);
            console.log('   ID:', order.id);
            console.log('   Cliente:', order.clienteNome);
            console.log('   Restaurante:', order.restaurant.nome);
            console.log('   Coordenadas restaurante:', [order.restaurant.latitude, order.restaurant.longitude]);
            console.log('   Status:', order.status);
            console.log('   Data:', order.createdDate);
            
            // Verificar endereço de entrega
            if (order.enderecoEntrega && typeof order.enderecoEntrega === 'object') {
                console.log('   Endereço entrega:', order.enderecoEntrega.rua, order.enderecoEntrega.cidade);
                console.log('   Coordenadas entrega:', [order.enderecoEntrega.latitude, order.enderecoEntrega.longitude]);
                
                // Calcular distância
                if (order.restaurant.latitude && order.restaurant.longitude && order.enderecoEntrega.latitude && order.enderecoEntrega.longitude) {
                    const restaurantCoords = [order.restaurant.latitude, order.restaurant.longitude];
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
                    console.log('   Distância calculada:', distance.toFixed(2), 'km');
                    
                    if (distance > 100) {
                        console.log('   ⚠️ PROBLEMA: Distância muito alta!');
                    }
                }
            }
        });
        
        // Verificar se há pedidos do Mediterrâneo Fresh
        const mediterraneoOrders = await prisma.order.findMany({
            where: {
                status: 'pronto',
                entregadorId: null,
                restaurant: {
                    nome: {
                        contains: 'Mediterrâneo'
                    }
                }
            },
            include: {
                restaurant: true
            }
        });
        
        console.log(`\n🏪 Pedidos do Mediterrâneo Fresh: ${mediterraneoOrders.length}`);
        mediterraneoOrders.forEach(order => {
            console.log(`- ${order.numeroPedido} - ${order.clienteNome}`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCurrentOrder();
