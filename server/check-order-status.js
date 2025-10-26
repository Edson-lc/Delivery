// Script para verificar status atual do pedido
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrderStatus() {
    try {
        console.log('🔍 Verificando status atual do pedido...');
        
        // Buscar o pedido
        const order = await prisma.order.findFirst({
            where: { numeroPedido: '#38535576' },
            include: { 
                restaurant: {
                    select: {
                        nome: true,
                        latitude: true,
                        longitude: true
                    }
                },
                entregador: {
                    select: {
                        nomeCompleto: true
                    }
                }
            }
        });
        
        if (!order) {
            console.log('❌ Pedido não encontrado');
            return;
        }
        
        console.log('📋 Status atual do pedido:');
        console.log('Número:', order.numeroPedido);
        console.log('Status:', order.status);
        console.log('Cliente:', order.clienteNome);
        console.log('Restaurante:', order.restaurant.nome);
        console.log('Entregador:', order.entregador?.nomeCompleto || 'Nenhum');
        console.log('Data criação:', order.createdDate);
        console.log('Data atualização:', order.updatedDate);
        
        // Verificar se pode aparecer para entregadores
        if (order.status === 'pronto' && !order.entregadorId) {
            console.log('\n✅ Pedido pode aparecer para entregadores!');
            console.log('- Status: pronto');
            console.log('- Sem entregador atribuído');
        } else if (order.status === 'pronto' && order.entregadorId) {
            console.log('\n⚠️ Pedido já foi atribuído a um entregador');
            console.log('- Status: pronto');
            console.log('- Entregador:', order.entregador.nomeCompleto);
        } else {
            console.log('\n❌ Pedido não pode aparecer para entregadores');
            console.log('- Status:', order.status);
            console.log('- Motivo: Status não é "pronto"');
        }
        
        // Verificar todos os pedidos prontos sem entregador
        const availableOrders = await prisma.order.findMany({
            where: {
                status: 'pronto',
                entregadorId: null
            },
            select: {
                id: true,
                numeroPedido: true,
                clienteNome: true,
                createdDate: true,
                restaurant: {
                    select: {
                        nome: true
                    }
                }
            },
            orderBy: { createdDate: 'desc' }
        });
        
        console.log(`\n📋 Todos os pedidos disponíveis para entregadores: ${availableOrders.length}`);
        availableOrders.forEach((order, index) => {
            console.log(`${index + 1}. ${order.numeroPedido} - ${order.clienteNome} - ${order.restaurant.nome}`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkOrderStatus();
