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
import { CreditCard, Plus, Banknote, Loader2 } from 'lucide-react';
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
  const [newCard, setNewCard] = useState({
    bandeira: 'Visa',
    final_cartao: '',
    nome_titular: '',
    validade: ''
  });
  const [isSaving, setIsSaving] = useState(false);

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

  const handleCashPayment = () => {
    const amount = parseFloat(cashAmount);
    if (amount >= totalAmount) {
      onPaymentMethodSelect({
        tipo: 'dinheiro',
        valor_pago: amount,
        troco: amount - totalAmount
      });
    }
  };

  const calculateChange = () => {
    const amount = parseFloat(cashAmount);
    if (amount >= totalAmount) {
      return (amount - totalAmount).toFixed(2);
    }
    return '0.00';
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
              // Se já tem valor em dinheiro definido, manter os valores
              if (selectedPaymentMethod?.tipo === 'dinheiro' && selectedPaymentMethod?.valor_pago) {
                onPaymentMethodSelect(selectedPaymentMethod);
              } else {
                onPaymentMethodSelect({ tipo: 'dinheiro' });
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
          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="dinheiro" id="dinheiro" />
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-green-100 p-2 rounded-full">
                <Banknote className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <Label htmlFor="dinheiro" className="cursor-pointer">
                  <div className="font-medium">Dinheiro (Pagar na entrega)</div>
                  <div className="text-sm text-gray-600">Pague com dinheiro na entrega</div>
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
              <Label className="text-black">Valor que você vai pagar:</Label>
              <Input
                type="number"
                step="0.01"
                min={totalAmount}
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder={`Mínimo: €${totalAmount.toFixed(2)}`}
                className="border-gray-300 focus:border-gray-500"
              />
              {cashAmount && parseFloat(cashAmount) >= totalAmount && (
                <div className="space-y-2">
                  <div className="text-sm text-black">
                    <strong>Troco: €{calculateChange()}</strong>
                  </div>
                  <Button 
                    onClick={handleCashPayment}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    Confirmar Pagamento em Dinheiro
                  </Button>
                </div>
              )}
              {cashAmount && parseFloat(cashAmount) < totalAmount && (
                <div className="text-sm text-red-600">
                  Valor insuficiente. Mínimo: €{totalAmount.toFixed(2)}
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
