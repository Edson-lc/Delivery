# 📋 Fluxo Completo de Pedidos - AmaDelivery

## 🎯 Visão Geral
Sistema completo de gestão de pedidos com fluxo profissional desde a criação até a entrega.

## 🔄 Fluxo de Estados

### 1. **PENDENTE** (Aguardando Confirmação)
- **Quando**: Cliente faz pedido e confirma pagamento
- **Ação**: Restaurante recebe notificação com som de alerta
- **Modal**: Abre automaticamente para aceitar/rejeitar
- **Próximo**: `confirmado` ou `rejeitado`

### 2. **CONFIRMADO** (Pedido Aceito)
- **Quando**: Restaurante aceita o pedido
- **Ação**: Cliente é notificado da confirmação
- **Próximo**: `preparando`

### 3. **PREPARANDO** (Em Preparo)
- **Quando**: Restaurante inicia o preparo
- **Ação**: Cliente pode acompanhar o progresso
- **Próximo**: `pronto`

### 4. **PRONTO** (Pronto para Entrega)
- **Quando**: Restaurante marca como pronto
- **Ação**: Sistema busca entregador disponível
- **Próximo**: `saiu_entrega`

### 5. **SAIU_ENTREGA** (Saiu para Entrega)
- **Quando**: Entregador recolhe o pedido
- **Ação**: Cliente pode acompanhar a entrega
- **Próximo**: `entregue`

### 6. **ENTREGUE** (Pedido Entregue)
- **Quando**: Entregador confirma entrega
- **Ação**: Pedido finalizado
- **Próximo**: Fim do fluxo

### 7. **REJEITADO** (Pedido Rejeitado)
- **Quando**: Restaurante rejeita o pedido
- **Ação**: Cliente é notificado e reembolsado
- **Próximo**: Fim do fluxo

### 8. **CANCELADO** (Pedido Cancelado)
- **Quando**: Cliente cancela antes da confirmação
- **Ação**: Pedido cancelado e reembolsado
- **Próximo**: Fim do fluxo

## 🏪 Dashboard do Restaurante

### Cards de Status:
- **🟡 Aguardando Confirmação**: Pedidos pendentes
- **🔵 Confirmados**: Pedidos aceitos
- **🟠 Preparando**: Pedidos em preparo
- **🟣 Prontos**: Pedidos prontos para entrega

### Ações Disponíveis:
- **Pendente**: Aceitar Pedido / Rejeitar Pedido
- **Confirmado**: Iniciar Preparo
- **Preparando**: Marcar Pronto
- **Pronto**: Aguardando Entregador (botão desabilitado)

## 🚚 Dashboard do Entregador

### Estados Relevantes:
- **Pronto**: Pedidos disponíveis para recolha
- **Saiu Entrega**: Pedidos em trânsito
- **Entregue**: Pedidos finalizados

### Ações Disponíveis:
- **Pronto**: Aceitar Entrega
- **Saiu Entrega**: Confirmar Entrega

## 📱 Notificações

### Restaurante:
- **Som de Alerta**: Para pedidos pendentes
- **Modal Automático**: Abre para novos pedidos
- **Som Contínuo**: Até ação ser tomada

### Cliente:
- **Confirmação**: Quando pedido é aceito
- **Preparo**: Quando restaurante inicia preparo
- **Pronto**: Quando pedido está pronto
- **Entrega**: Quando entregador sai para entrega
- **Finalizado**: Quando pedido é entregue

### Entregador:
- **Novo Pedido**: Quando há pedido pronto
- **Atualização**: Status do pedido em tempo real

## 🔧 Configurações Técnicas

### Intervalos de Atualização:
- **Detecção de Pedidos**: 30 segundos
- **Som de Alerta**: 3 segundos
- **Timeout de Pedidos**: 10 minutos

### Estados de Controle:
- `IN_PROGRESS_STATUSES`: Pedidos ativos
- `RESTAURANT_ACTION_STATUSES`: Pedidos que precisam de ação do restaurante

## 🎨 Interface

### Modal de Confirmação:
- **Título**: "🚨 NOVO PEDIDO RECEBIDO! 🚨"
- **Informações**: Cliente, total, endereço, itens
- **Botões**: Aceitar Pedido / Rejeitar Pedido
- **Som**: Contínuo até ação

### Cards de Pedidos:
- **Status Colorido**: Badge com cor do estado
- **Informações Completas**: Cliente, total, endereço
- **Botões Contextuais**: Ações disponíveis para cada estado
- **Tempo Decorrido**: "há X minutos"

## 🚀 Próximos Passos

1. **Dashboard do Entregador**: Implementar interface para entregadores
2. **Notificações Push**: Sistema de notificações em tempo real
3. **Geolocalização**: Rastreamento de entregas
4. **Avaliações**: Sistema de feedback pós-entrega
5. **Relatórios**: Analytics de performance

## 📊 Métricas Importantes

- **Tempo de Resposta**: Tempo para aceitar pedido
- **Tempo de Preparo**: Tempo para preparar pedido
- **Tempo de Entrega**: Tempo total de entrega
- **Taxa de Aceitação**: % de pedidos aceitos
- **Taxa de Cancelamento**: % de pedidos cancelados
