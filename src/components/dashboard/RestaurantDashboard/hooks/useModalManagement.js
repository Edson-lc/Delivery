import { useState, useCallback } from 'react';
import { createPageUrl } from '@/utils';

export function useModalManagement({ updateOrderStatus, setStatusFilter, updatePreparationTime, stopContinuousAlert } = {}) {
  const [pendingOrder, setPendingOrder] = useState(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showFullScreenModal, setShowFullScreenModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);

  const handleAcceptOrder = useCallback(async () => {
    if (!pendingOrder) return;

    console.log("✅ Aceitando pedido:", pendingOrder.id);
    
    if (pendingOrder.id.startsWith('test-')) {
      console.log("🧪 Pedido de teste - apenas fechando modal");
      handleCloseModal();
      return;
    }
    
    try {
      await updateOrderStatus(pendingOrder.id, 'confirmado');
      handleCloseModal();
    } catch (error) {
      console.error("❌ Erro ao aceitar pedido:", error);
      throw new Error("Erro ao aceitar pedido. Tente novamente.");
    }
  }, [pendingOrder, updateOrderStatus]);

  const handleRejectOrder = useCallback(async () => {
    if (!pendingOrder) return;

    console.log("❌ Rejeitando pedido:", pendingOrder.id);
    
    if (pendingOrder.id.startsWith('test-')) {
      console.log("🧪 Pedido de teste - apenas fechando modal");
      handleCloseModal();
      return;
    }
    
    try {
      await updateOrderStatus(pendingOrder.id, 'rejeitado');
      handleCloseModal();
    } catch (error) {
      console.error("❌ Erro ao rejeitar pedido:", error);
      throw new Error("Erro ao rejeitar pedido. Tente novamente.");
    }
  }, [pendingOrder, updateOrderStatus]);

  const handleCloseModal = useCallback(() => {
    setShowFullScreenModal(false);
    setShowOrderModal(false);
    setPendingOrder(null);
    setStatusFilter('pendente');
    
    // Parar som de alerta contínuo
    if (stopContinuousAlert) {
      console.log("🔇 Parando som de alerta ao fechar modal...");
      stopContinuousAlert();
    }
  }, [setStatusFilter, stopContinuousAlert]);

  const handleViewOrderDetails = useCallback((order) => {
    console.log("🔍 DEBUG - Dados do pedido selecionado:", order);
    setSelectedOrderForDetails(order);
    setShowOrderDetailsModal(true);
  }, []);

  const handleCloseOrderDetailsModal = useCallback(() => {
    setShowOrderDetailsModal(false);
    setSelectedOrderForDetails(null);
  }, []);

  const handlePrintReceipt = useCallback(() => {
    if (!selectedOrderForDetails) return;
    
    const order = selectedOrderForDetails;
    const now = new Date();
    
    // Criar nova janela para impressão
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    
    const receiptHTML = generateReceiptHTML(order, now);
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Aguardar o conteúdo carregar e então imprimir
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  }, [selectedOrderForDetails]);

  const openNewOrderModal = useCallback((order) => {
    setPendingOrder(order);
    setShowOrderModal(true);
  }, []);

  const openFullScreenModal = useCallback((order) => {
    setPendingOrder(order);
    setShowFullScreenModal(true);
  }, []);

  const handleUpdatePreparationTime = useCallback(async (orderId, preparationTime) => {
    try {
      if (updatePreparationTime) {
        await updatePreparationTime(orderId, preparationTime);
        // Atualizar o pedido selecionado com o novo tempo
        if (selectedOrderForDetails && selectedOrderForDetails.id === orderId) {
          // Calcular tempo adicional baseado no tempo atual do pedido
          const currentOrderPrepTime = selectedOrderForDetails.tempoPreparo || selectedOrderForDetails.restaurant?.tempoPreparo || selectedOrderForDetails.restaurant?.tempo_preparo || 30;
          const additionalTime = Math.max(0, preparationTime - currentOrderPrepTime);
          
          setSelectedOrderForDetails(prev => ({
            ...prev,
            tempoPreparo: preparationTime,
            tempoPreparoAlterado: true,
            tempoAdicional: additionalTime
          }));
        }
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar tempo de preparo:", error);
      throw new Error("Erro ao atualizar tempo de preparo. Tente novamente.");
    }
  }, [updatePreparationTime, selectedOrderForDetails]);

  return {
    // Estados
    pendingOrder,
    selectedOrderForDetails,
    showOrderModal,
    showFullScreenModal,
    showOrderDetailsModal,
    
    // Setters
    setPendingOrder,
    setShowOrderModal,
    setShowFullScreenModal,
    setShowOrderDetailsModal,
    setSelectedOrderForDetails,
    
    // Handlers
    handleAcceptOrder,
    handleRejectOrder,
    handleCloseModal,
    handleViewOrderDetails,
    handleCloseOrderDetailsModal,
    handlePrintReceipt,
    handleUpdatePreparationTime,
    openNewOrderModal,
    openFullScreenModal
  };
}

// Função auxiliar para gerar HTML do cupom
function generateReceiptHTML(order, now) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cupom Fiscal - Pedido #${order.id.slice(-6)}</title>
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          color: #333;
          background: #fff;
          margin: 0;
          padding: 20px;
        }
        .receipt-container {
          max-width: 400px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 24px;
          font-weight: bold;
          color: #2d3748;
          margin: 0;
        }
        .card {
          background: #f7fafc;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #e2e8f0;
        }
        .card h2 {
          font-size: 16px;
          font-weight: bold;
          color: #2d3748;
          margin: 0 0 15px 0;
        }
        .client-info {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        .client-info .icon {
          color: #48bb78;
          margin-right: 8px;
        }
        .client-info .text {
          color: #2d3748;
          font-weight: 500;
        }
        .phone {
          color: #4a5568;
          margin-bottom: 8px;
        }
        .total-info {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        .total-info .icon {
          color: #48bb78;
          margin-right: 8px;
        }
        .total-info .text {
          color: #2d3748;
          font-weight: 500;
        }
        .payment-method {
          color: #718096;
          font-size: 13px;
        }
        .address-info {
          display: flex;
          align-items: flex-start;
        }
        .address-info .icon {
          color: #48bb78;
          margin-right: 8px;
          margin-top: 2px;
        }
        .address-info .text {
          color: #2d3748;
          line-height: 1.5;
        }
        .item {
          margin-bottom: 15px;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .item-name {
          color: #2d3748;
          font-weight: 500;
        }
        .item-price {
          color: #2d3748;
          font-weight: 500;
        }
        .item-observation {
          color: #4a5568;
          font-size: 13px;
          margin-left: 10px;
          margin-bottom: 8px;
          padding: 8px;
          background: #edf2f7;
          border-radius: 6px;
          border-left: 3px solid #48bb78;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .totals-label {
          color: #4a5568;
        }
        .totals-value {
          color: #2d3748;
        }
        .totals-discount {
          color: #e53e3e;
        }
        .totals-divider {
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          margin-top: 12px;
        }
        .totals-final {
          display: flex;
          justify-content: space-between;
        }
        .totals-final-label {
          color: #2d3748;
          font-weight: bold;
          font-size: 16px;
        }
        .totals-final-value {
          color: #2d3748;
          font-weight: bold;
          font-size: 16px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #718096;
          font-size: 12px;
        }
        .no-items {
          color: #718096;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <!-- Cabeçalho -->
        <div class="header">
          <h1>Pedido #${order.id.slice(-6)}</h1>
        </div>
        
        <!-- Informações do Cliente -->
        <div class="card">
          <h2>Informações do Cliente</h2>
          
          <div class="client-info">
            <span class="icon">👤</span>
            <span class="text">${order.cliente_nome || order.clienteNome || 'Cliente AmaEats'}</span>
          </div>
          
          <div class="phone">
            ${order.cliente_telefone || order.clienteTelefone || '920321593'}
          </div>
          
          <div class="total-info">
            <span class="icon">€</span>
            <span class="text">€${(order.total || 0).toFixed(2)}</span>
          </div>
          
          <div class="payment-method">
            Cartão de Crédito
          </div>
        </div>
        
        <!-- Endereço de Entrega -->
        <div class="card">
          <h2>Endereço de Entrega</h2>
          
          <div class="address-info">
            <span class="icon">📍</span>
            <div class="text">
              ${order.endereco_entrega || 'Endereço não informado'}
            </div>
          </div>
        </div>
        
        <!-- Itens do Pedido -->
        <div class="card">
          <h2>Itens do Pedido</h2>
          
          ${order.itens && Array.isArray(order.itens) ? order.itens.map((item, index) => {
            return `
              <div class="item">
                <div class="item-header">
                  <span class="item-name">${item.quantidade}x ${item.nome}</span>
                  <span class="item-price">€${(item.subtotal || 0).toFixed(2)}</span>
                </div>
                
                ${item.observacoes ? `
                  <div class="item-observation">
                    <strong>OBS:</strong> "${item.observacoes}"
                  </div>
                ` : ''}
              </div>
            `;
          }).join('') : '<div class="no-items">Nenhum item encontrado</div>'}
        </div>
        
        <!-- Totais -->
        <div class="card">
          <div class="totals-row">
            <span class="totals-label">Subtotal:</span>
            <span class="totals-value">€${(order.subtotal || 0).toFixed(2)}</span>
          </div>
          
          ${order.taxaEntrega > 0 ? `
            <div class="totals-row">
              <span class="totals-label">Taxa de Entrega:</span>
              <span class="totals-value">€${order.taxaEntrega.toFixed(2)}</span>
            </div>
          ` : ''}
          
          ${order.taxaServico > 0 ? `
            <div class="totals-row">
              <span class="totals-label">Taxa de Serviço:</span>
              <span class="totals-value">€${order.taxaServico.toFixed(2)}</span>
            </div>
          ` : ''}
          
          ${order.desconto > 0 ? `
            <div class="totals-row">
              <span class="totals-label">Desconto:</span>
              <span class="totals-discount">-€${order.desconto.toFixed(2)}</span>
            </div>
          ` : ''}
          
          <div class="totals-divider">
            <div class="totals-final">
              <span class="totals-final-label">Total:</span>
              <span class="totals-final-value">€${(order.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <!-- Rodapé -->
        <div class="footer">
          <div>Pedido criado em ${new Date(order.created_date).toLocaleDateString('pt-BR')} ${new Date(order.created_date).toLocaleTimeString('pt-BR')}</div>
          <div>Impresso em ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
