// Script para corrigir coordenadas do restaurante
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRestaurantCoordinates() {
    try {
        console.log('🔧 Corrigindo coordenadas do restaurante...');
        
        const restaurantId = '6c0d64a6-1f89-46c7-ac91-f103c7a1d1c5'; // ID do AmaEats Central
        
        // Coordenadas corretas para Amarante, Portugal (próximo ao endereço de entrega)
        const correctLatitude = 41.270000; // Amarante, Portugal
        const correctLongitude = -8.080000; // Amarante, Portugal
        
        console.log('📍 Coordenadas atuais (incorretas):');
        const currentRestaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            select: { nome: true, latitude: true, longitude: true }
        });
        
        console.log('Nome:', currentRestaurant.nome);
        console.log('Latitude atual:', currentRestaurant.latitude);
        console.log('Longitude atual:', currentRestaurant.longitude);
        
        console.log('\n📍 Coordenadas corretas (Amarante, Portugal):');
        console.log('Nova latitude:', correctLatitude);
        console.log('Nova longitude:', correctLongitude);
        
        // Atualizar coordenadas do restaurante
        await prisma.restaurant.update({
            where: { id: restaurantId },
            data: {
                latitude: correctLatitude,
                longitude: correctLongitude
            }
        });
        
        console.log('\n✅ Coordenadas do restaurante atualizadas!');
        
        // Recalcular distância
        const deliveryCoords = [41.26266533501208, -8.072474850392611];
        const restaurantCoords = [correctLatitude, correctLongitude];
        
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
        
        const newDistance = calculateDistance(restaurantCoords, deliveryCoords);
        
        console.log('\n📏 Nova distância calculada:');
        console.log('Restaurante:', restaurantCoords);
        console.log('Entrega:', deliveryCoords);
        console.log('Distância:', newDistance.toFixed(2), 'km');
        
        if (newDistance < 50) {
            console.log('✅ Distância agora está correta!');
        } else {
            console.log('⚠️ Distância ainda parece alta');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixRestaurantCoordinates();
