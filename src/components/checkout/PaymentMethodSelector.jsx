import React, { useState } from 'react';
import { User } from '@/api/entities';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Plus, Banknote, Loader2, CheckCircle } from 'lucide-react';
import CardBrandIcon from '@/components/ui/CardBrandIcon';

export default function PaymentMethodSelector({ 
  user, 
  selectedPaymentMethod, 
  onPaymentMethodSelect,
  totalAmount 
}) {
  const { refreshUser } = useAuth();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Limite máximo para pagamento em dinheiro
  const CASH_PAYMENT_LIMIT = 30;
  
  // Notas não permitidas para facilitar o troco
  const FORBIDDEN_NOTES = [100, 200, 500];
  const [newCard, setNewCard] = useState({
    bandeira: 'Visa',
    final_cartao: '',
    nome_titular: '',
    validade: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Função para formatar valor monetário
  const formatCurrencyValue = (value) => {
    if (!value || value.trim() === '') return '';
    
    // Remove tudo que não é número, vírgula ou ponto
    const cleanValue = value.replace(/[^\d,.]/g, '');
    
    // Se tem vírgula e ponto, manter apenas o último
    const parts = cleanValue.split(/[,.]/);
    if (parts.length > 2) {
      // Se tem mais de 2 partes, manter apenas as duas primeiras
      return parts[0] + ',' + parts[1];
    }
    
    // Se tem apenas números, permitir valores maiores sem formatação automática
    if (parts.length === 1) {
      return cleanValue; // Deixar o usuário digitar livremente
    }
    
    return cleanValue;
  };

  // Função para converter valor formatado para número
  const parseCurrencyValue = (value) => {
    if (!value || value.trim() === '') return 0;
    
    // Converter vírgula para ponto
    const normalizedValue = value.replace(',', '.');
    const amount = parseFloat(normalizedValue);
    
    return isNaN(amount) ? 0 : amount;
  };

  // Verificação de segurança para user
  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Carregando dados do usuário...</p>
        </CardContent>
      </Card>
    );
  }

  // Use the same logic as PaymentMethods component in MinhaConta
  const savedCards = user?.metodos_pagamento_salvos || user?.metodos_pagamento || [];

  // Debug: Log payment methods data
  console.log("PaymentMethodSelector - User:", user);
  console.log("PaymentMethodSelector - Saved Cards (metodos_pagamento_salvos):", user?.metodos_pagamento_salvos);
  console.log("PaymentMethodSelector - Saved Cards (metodos_pagamento):", user?.metodos_pagamento);
  console.log("PaymentMethodSelector - Final saved cards:", savedCards);

  const handleSaveNewCard = async () => {
    if (!newCard.final_cartao || !newCard.nome_titular || !newCard.validade) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedCards = [...savedCards, { 
        ...newCard, 
        id: `card_${Date.now()}`,
        tipo: 'cartao_credito'
      }];
      
      const updatedUser = await User.updateMyUserData({ 
        metodos_pagamento_salvos: updatedCards,
        metodos_pagamento: updatedCards
      });
      
      await refreshUser(); // Atualiza o contexto global
      onPaymentMethodSelect({ ...newCard, id: `card_${Date.now()}`, tipo: 'cartao_credito' });
      setIsAddingNew(false);
      setNewCard({
        bandeira: 'Visa',
        final_cartao: '',
        nome_titular: '',
        validade: ''
      });
    } catch (error) {
      console.error("Erro ao salvar cartão:", error);
    }
    setIsSaving(false);
  };

  const handleCashAmountChange = (value) => {
    // Formatar o valor automaticamente
    const formattedValue = formatCurrencyValue(value);
    setCashAmount(formattedValue);
    
    // Se o campo estiver vazio, usar valor mínimo
    if (!formattedValue || formattedValue.trim() === '') {
      const paymentData = {
        tipo: 'dinheiro',
        valor_pago: totalAmount,
        troco: 0
      };
      
      console.log("=== DEBUG VALOR VAZIO - USANDO MÍNIMO ===");
      console.log("Payment Data:", paymentData);
      
      onPaymentMethodSelect(paymentData);
      return;
    }
    
    // Converter valor formatado para número
    const amount = parseCurrencyValue(formattedValue);
    
    // Verificar se é um número válido
    if (amount <= 0) {
      console.log("=== DEBUG VALOR INVÁLIDO ===");
      return;
    }
    
    // Verificar se é uma nota não permitida
    if (isForbiddenNote(amount)) {
      console.log("=== DEBUG NOTA NÃO PERMITIDA ===");
      console.log("Valor inserido:", value);
      console.log("Amount:", amount);
      console.log("Notas não permitidas:", FORBIDDEN_NOTES);
      return; // Não permitir confirmação
    }
    
    // Confirmar automaticamente quando o valor for válido
    if (amount >= totalAmount) {
      const paymentData = {
        tipo: 'dinheiro',
        valor_pago: amount,
        troco: amount - totalAmount
      };
      
      // Debug: Log dos dados de pagamento
      console.log("=== DEBUG PAYMENT METHOD SELECTOR ===");
      console.log("Valor inserido:", value);
      console.log("Valor formatado:", formattedValue);
      console.log("Amount:", amount);
      console.log("Total Amount:", totalAmount);
      console.log("Payment Data:", paymentData);
      
      onPaymentMethodSelect(paymentData);
      
      // Mostrar confirmação temporariamente
      setShowConfirmation(true);
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000); // Desaparece após 3 segundos
    } else {
      // Se valor for menor que o mínimo, mostrar erro mas não alterar automaticamente
      console.log("=== DEBUG VALOR INSUFICIENTE ===");
      console.log("Valor inserido:", value);
      console.log("Valor formatado:", formattedValue);
      console.log("Amount:", amount);
      console.log("Total Amount:", totalAmount);
      
      // Não alterar o pagamento automaticamente, deixar o usuário corrigir
    }
  };

  const calculateChange = () => {
    if (!cashAmount || cashAmount.trim() === '') {
      return '0.00';
    }
    
    const amount = parseCurrencyValue(cashAmount);
    
    if (amount <= 0) {
      return '0.00';
    }
    
    if (amount >= totalAmount) {
      return (amount - totalAmount).toFixed(2);
    }
    
    return '0.00';
  };

  // Verificar se o valor é uma nota não permitida
  const isForbiddenNote = (amount) => {
    return FORBIDDEN_NOTES.includes(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Forma de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup 
          value={selectedPaymentMethod?.id || selectedPaymentMethod?.tipo || ''} 
          onValueChange={(value) => {
            if (value === 'dinheiro') {
              // Verificar se o valor total excede o limite para pagamento em dinheiro
              if (totalAmount > CASH_PAYMENT_LIMIT) {
                // Não permitir seleção de dinheiro se exceder o limite
                return;
              }
              
              // Se já tem valor em dinheiro definido, manter os valores
              if (selectedPaymentMethod?.tipo === 'dinheiro' && selectedPaymentMethod?.valor_pago) {
                onPaymentMethodSelect(selectedPaymentMethod);
              } else {
                // Preencher input com valor total formatado automaticamente
                const formattedTotal = totalAmount.toFixed(2).replace('.', ',');
                onPaymentMethodSelect({ 
                  tipo: 'dinheiro',
                  valor_pago: totalAmount,
                  troco: 0
                });
                setCashAmount(formattedTotal);
                
                console.log("=== DEBUG AUTO-FILL TOTAL ===");
                console.log("Total Amount:", totalAmount);
                console.log("Formatted Total:", formattedTotal);
                console.log("Cash Amount Set:", formattedTotal);
              }
            } else {
              const card = savedCards.find(c => c.id === value);
              if (card) {
                onPaymentMethodSelect(card);
              }
            }
          }}
        >
          {/* Cartões Salvos */}
          {savedCards.length > 0 ? (
            savedCards.map((card) => (
              <div key={card.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={card.id} id={card.id} />
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center">
                    <CardBrandIcon brand={card.bandeira} className="w-12 h-8" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={card.id} className="cursor-pointer">
                      <div className="font-medium">{card.bandeira} •••• {card.final_cartao}</div>
                      <div className="text-sm text-gray-600">{card.nome_titular}</div>
                      <div className="text-xs text-gray-500">Válido até {card.validade}</div>
                    </Label>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum cartão salvo</p>
            </div>
          )}

          {/* Pagamento em Dinheiro */}
          <div className={`flex items-center space-x-3 p-3 border rounded-lg ${totalAmount > CASH_PAYMENT_LIMIT ? 'bg-red-50 border-red-200' : 'hover:bg-gray-50'}`}>
            <RadioGroupItem 
              value="dinheiro" 
              id="dinheiro" 
              disabled={totalAmount > CASH_PAYMENT_LIMIT}
            />
            <div className="flex items-center gap-3 flex-1">
              <div className={`p-2 rounded-full ${totalAmount > CASH_PAYMENT_LIMIT ? 'bg-red-100' : 'bg-green-100'}`}>
                <Banknote className={`w-4 h-4 ${totalAmount > CASH_PAYMENT_LIMIT ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <div className="flex-1">
                <Label htmlFor="dinheiro" className={`cursor-pointer ${totalAmount > CASH_PAYMENT_LIMIT ? 'text-red-600' : ''}`}>
                  <div className="font-medium">
                    Dinheiro (Pagar na entrega)
                    {totalAmount > CASH_PAYMENT_LIMIT && (
                      <span className="text-red-600 ml-2">- Não disponível</span>
                    )}
                  </div>
                  <div className={`text-sm ${totalAmount > CASH_PAYMENT_LIMIT ? 'text-red-500' : 'text-gray-600'}`}>
                    {totalAmount > CASH_PAYMENT_LIMIT 
                      ? `Valor excede o limite de €${CASH_PAYMENT_LIMIT}. Use cartão ou outro método.`
                      : 'Pague com dinheiro na entrega'
                    }
                  </div>
                </Label>
              </div>
            </div>
          </div>
        </RadioGroup>

        {/* Campo para valor em dinheiro */}
        {selectedPaymentMethod?.tipo === 'dinheiro' && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-green-600" />
              <Label className="font-medium text-black">Valor em Dinheiro</Label>
            </div>
            <div className="space-y-2">
              <Label className="text-black">Valor que você vai pagar (já preenchido com o total):</Label>
              <Input
                type="number"
                step="0.01"
                min={totalAmount}
                value={cashAmount}
                onChange={(e) => handleCashAmountChange(e.target.value)}
                placeholder={`Valor total: €${totalAmount.toFixed(2)} (valor exato)`}
                className="border-gray-300 focus:border-gray-500"
              />
              
              {/* Sempre mostrar informações quando dinheiro estiver selecionado */}
              {selectedPaymentMethod?.tipo === 'dinheiro' && (
                <div className="space-y-2">
                  <div className="text-sm text-black">
                    <strong>Valor a pagar: €{selectedPaymentMethod.valor_pago?.toFixed(2) || totalAmount.toFixed(2)}</strong>
                  </div>
                  <div className="text-sm text-black">
                    <strong>Troco: €{(selectedPaymentMethod.troco || 0).toFixed(2)}</strong>
                  </div>
                  
                  {/* Mostrar erro se for uma nota não permitida */}
                  {cashAmount && isForbiddenNote(parseCurrencyValue(cashAmount)) && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                      <div className="font-medium">Notas de €100, €200 e €500 não são aceitas</div>
                      <div className="text-xs mt-1">Para facilitar o troco ao entregador, use notas menores</div>
                    </div>
                  )}
                  
                  {/* Mostrar erro se valor for insuficiente */}
                  {cashAmount && parseCurrencyValue(cashAmount) < totalAmount && parseCurrencyValue(cashAmount) > 0 && !isForbiddenNote(parseCurrencyValue(cashAmount)) && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                      Valor insuficiente. Mínimo: €{totalAmount.toFixed(2)}
                    </div>
                  )}
                  
                  {/* Mostrar confirmação temporariamente quando valor for válido */}
                  {showConfirmation && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md animate-pulse">
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        {selectedPaymentMethod.troco === 0 ? 
                          "Pagamento em dinheiro confirmado (valor exato)!" : 
                          "Pagamento em dinheiro confirmado!"
                        }
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Opção para adicionar novo cartão */}
        <div className="border-t pt-4">
          <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Novo Cartão
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" aria-describedby="card-form-description">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cartão</DialogTitle>
              </DialogHeader>
              <div id="card-form-description" className="sr-only">
                Formulário para adicionar um novo cartão de pagamento
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Bandeira do Cartão</Label>
                  <Select value={newCard.bandeira} onValueChange={(value) => setNewCard(prev => ({ ...prev, bandeira: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Visa">Visa</SelectItem>
                      <SelectItem value="Mastercard">Mastercard</SelectItem>
                      <SelectItem value="American Express">American Express</SelectItem>
                      <SelectItem value="Multibanco">Multibanco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Últimos 4 dígitos do cartão</Label>
                  <Input
                    value={newCard.final_cartao}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setNewCard(prev => ({ ...prev, final_cartao: value }));
                    }}
                    maxLength="4"
                    placeholder="1234"
                  />
                </div>
                
                <div>
                  <Label>Nome no Cartão</Label>
                  <Input
                    value={newCard.nome_titular}
                    onChange={(e) => setNewCard(prev => ({ ...prev, nome_titular: e.target.value }))}
                    placeholder="João Silva"
                  />
                </div>
                
                <div>
                  <Label>Data de Validade</Label>
                  <Input
                    value={newCard.validade}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      setNewCard(prev => ({ ...prev, validade: value }));
                    }}
                    placeholder="MM/AA"
                    maxLength="5"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveNewCard}
                    disabled={isSaving || !newCard.final_cartao || !newCard.nome_titular || !newCard.validade}
                  >
                    {isSaving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

      </CardContent>
    </Card>
  );
}
