import React, { useState } from 'react';
import { User } from '@/api/entities';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Plus, Home, Briefcase } from 'lucide-react';

export default function AddressSelector({ 
  user, 
  selectedAddress, 
  onAddressSelect
}) {
  const { refreshUser } = useAuth();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState({
    nome: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: 'Lisboa',
    cep: '',
    referencia: ''
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

  // Use the same logic as AddressManager component in MinhaConta
  const addresses = user?.enderecos_salvos || [];

  // Debug: Log addresses data
  console.log("AddressSelector - User:", user);
  console.log("AddressSelector - Addresses (enderecos_salvos):", user?.enderecos_salvos);
  console.log("AddressSelector - Final addresses:", addresses);

  const handleSaveNewAddress = async () => {
    if (!newAddress.nome || !newAddress.rua || !newAddress.numero || !newAddress.bairro) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedAddresses = [...addresses, { 
        ...newAddress, 
        id: `addr_${Date.now()}` 
      }];
      
      const updatedUser = await User.updateMyUserData({ 
        enderecos_salvos: updatedAddresses
      });
      
      await refreshUser(); // Atualiza o contexto global
      onAddressSelect(newAddress);
      setIsAddingNew(false);
      setNewAddress({
        nome: '',
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: 'Lisboa',
        cep: '',
        referencia: ''
      });
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
    }
    setIsSaving(false);
  };

  const getAddressIcon = (addressName) => {
    const name = addressName?.toLowerCase() || '';
    if (name.includes('casa') || name.includes('home')) return <Home className="w-4 h-4" />;
    if (name.includes('trabalho') || name.includes('work') || name.includes('escritório')) return <Briefcase className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Endereço de Entrega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {addresses.length > 0 ? (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Endereços Salvos:</Label>
            <RadioGroup 
              value={selectedAddress?.id || ''} 
              onValueChange={(value) => {
                const address = addresses.find(addr => addr.id === value);
                onAddressSelect(address);
              }}
            >
              {addresses.map((address) => (
                <div key={address.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value={address.id} id={address.id} />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-orange-100 p-2 rounded-full">
                      {getAddressIcon(address.nome)}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={address.id} className="cursor-pointer">
                        <div className="font-medium">{address.nome}</div>
                        <div className="text-sm text-gray-600">
                          {address.rua}, {address.numero}
                          {address.complemento && ` - ${address.complemento}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {address.bairro}, {address.cidade}
                        </div>
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Nenhum endereço salvo</p>
            <p className="text-sm">Adicione um endereço para facilitar seus pedidos</p>
          </div>
        )}

        {/* Opção para adicionar novo endereço */}
        <div className="border-t pt-4">
          <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Nova Morada
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" aria-describedby="address-form-description">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Endereço</DialogTitle>
              </DialogHeader>
              <div id="address-form-description" className="sr-only">
                Formulário para adicionar um novo endereço de entrega
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Endereço</Label>
                  <Input
                    value={newAddress.nome}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Casa, Trabalho"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label>Rua *</Label>
                    <Input
                      value={newAddress.rua}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, rua: e.target.value }))}
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div>
                    <Label>Número *</Label>
                    <Input
                      value={newAddress.numero}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, numero: e.target.value }))}
                      placeholder="123"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Complemento</Label>
                    <Input
                      value={newAddress.complemento}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, complemento: e.target.value }))}
                      placeholder="Apt, Bloco, etc."
                    />
                  </div>
                  <div>
                    <Label>Freguesia *</Label>
                    <Input
                      value={newAddress.bairro}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, bairro: e.target.value }))}
                      placeholder="Freguesia"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      value={newAddress.cidade}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, cidade: e.target.value }))}
                      placeholder="Lisboa"
                    />
                  </div>
                  <div>
                    <Label>Código Postal</Label>
                    <Input
                      value={newAddress.cep}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, cep: e.target.value }))}
                      placeholder="1000-001"
                    />
                  </div>
                </div>

                <div>
                  <Label>Referência</Label>
                  <Input
                    value={newAddress.referencia}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, referencia: e.target.value }))}
                    placeholder="Ponto de referência"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveNewAddress}
                    disabled={isSaving || !newAddress.nome || !newAddress.rua || !newAddress.numero || !newAddress.bairro}
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
