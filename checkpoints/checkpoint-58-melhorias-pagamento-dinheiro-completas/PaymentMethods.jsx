
import React, { useState } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, CreditCard, Loader2, Shield, AlertTriangle } from 'lucide-react';
import CardBrandIcon from '@/components/ui/CardBrandIcon';

// Componente para formulÃ¡rio de cartÃ£o
const PaymentForm = ({ onSave, onCancel }) => {
    const [card, setCard] = useState({ 
        final_cartao: '', 
        nome_titular: '', 
        validade: '', 
        bandeira: 'Visa' 
    });
    const [errors, setErrors] = useState({});

    const validateCard = () => {
        const newErrors = {};
        
        if (!card.final_cartao || card.final_cartao.length !== 4) {
            newErrors.final_cartao = 'Digite os últimos 4 dígitos do cartão';
        }
        
        if (!card.nome_titular.trim()) {
            newErrors.nome_titular = 'Nome do titular é obrigatório';
        }
        
        if (!card.validade) {
            newErrors.validade = 'Data de validade é obrigatória';
        } else {
            const [month, year] = card.validade.split('/');
            // Basic validation for month and year parts
            const monthInt = parseInt(month, 10);
            const yearInt = parseInt(year, 10);
            if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12 || yearInt < 0 || yearInt > 99) {
                newErrors.validade = 'Data de validade inválida (MM/AA)';
            } else {
                const expiry = new Date(2000 + yearInt, monthInt - 1); // Month is 0-indexed in Date object
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth(); // 0-indexed

                // Adjust expiry date to the end of the month for comparison
                const expiryEndOfMonth = new Date(expiry.getFullYear(), expiry.getMonth() + 1, 0);

                // Compare with current date, considering the month
                if (expiryEndOfMonth < now) {
                    newErrors.validade = 'Cartão expirado';
                }
            }
        }
        
        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationErrors = validateCard();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        onSave({ ...card, tipo: 'cartao_credito' });
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                    <strong>Segurança:</strong> Não salvamos dados completos do cartão. Apenas os últimos 4 dígitos para sua identificação.
                </AlertDescription>
            </Alert>
            
            <div className="space-y-1">
                <Label>Bandeira do Cartão</Label>
                <Select value={card.bandeira} onValueChange={(value) => setCard({...card, bandeira: value})}>
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
            
            <div className="space-y-1">
                <Label>Últimos 4 dígitos do cartão</Label>
                <Input 
                    value={card.final_cartao} 
                    onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setCard({...card, final_cartao: value});
                        if (errors.final_cartao) setErrors({...errors, final_cartao: ''});
                    }} 
                    maxLength="4" 
                    placeholder="1234"
                    className={errors.final_cartao ? 'border-red-500' : ''}
                />
                {errors.final_cartao && <p className="text-sm text-red-500">{errors.final_cartao}</p>}
            </div>
            
            <div className="space-y-1">
                <Label>Nome no CartÃ£o</Label>
                <Input 
                    value={card.nome_titular} 
                    onChange={(e) => {
                        setCard({...card, nome_titular: e.target.value});
                        if (errors.nome_titular) setErrors({...errors, nome_titular: ''});
                    }}
                    placeholder="João Silva"
                    className={errors.nome_titular ? 'border-red-500' : ''}
                />
                {errors.nome_titular && <p className="text-sm text-red-500">{errors.nome_titular}</p>}
            </div>
            
            <div className="space-y-1">
                <Label>Data de Validade</Label>
                <Input 
                    value={card.validade} 
                    onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                            value = value.slice(0, 2) + '/' + value.slice(2, 4);
                        }
                        setCard({...card, validade: value});
                        if (errors.validade) setErrors({...errors, validade: ''});
                    }}
                    placeholder="MM/AA"
                    maxLength="5"
                    className={errors.validade ? 'border-red-500' : ''}
                />
                {errors.validade && <p className="text-sm text-red-500">{errors.validade}</p>}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">Salvar Cartão</Button>
            </div>
        </form>
    )
}

export default function PaymentMethods({ user, onUserUpdate }) {
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [success, setSuccess] = useState('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [cardToDelete, setCardToDelete] = useState(null);

    const saveMethods = async (newMethods) => {
        setIsSaving(true);
        try {
            const updatedUser = await User.updateMyUserData({ ...user, metodos_pagamento_salvos: newMethods, metodosPagamento: newMethods });
            onUserUpdate(updatedUser);
            setSuccess("Cartão salvo com sucesso!");
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error("Erro ao salvar métodos de pagamento:", error);
        } finally {
            setIsSaving(false);
            setIsDialogOpen(false);
        }
    };

    const handleSave = (methodData) => {
        const currentMethods = user.metodos_pagamento_salvos || user.metodos_pagamento || [];
        const newMethod = { ...methodData, id: `pay_${Date.now()}` };
        saveMethods([...currentMethods, newMethod]);
    };

    const handleDelete = (methodId) => {
        const method = (user.metodos_pagamento_salvos || user.metodos_pagamento || []).find(m => m.id === methodId);
        setCardToDelete(method);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (cardToDelete) {
            const updatedMethods = (user.metodos_pagamento_salvos || user.metodos_pagamento || []).filter(m => m.id !== cardToDelete.id);
            saveMethods(updatedMethods);
        }
        setIsDeleteDialogOpen(false);
        setCardToDelete(null);
    };

    const cancelDelete = () => {
        setIsDeleteDialogOpen(false);
        setCardToDelete(null);
    };

    // Função removida - agora usamos CardBrandIcon para exibir as bandeiras

    return (
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Métodos de Pagamento</CardTitle>
                    <CardDescription>Gerencie seus cartões salvos para pagamentos mais rápidos.</CardDescription>
                </div>
                 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-12 px-6 text-base font-medium touch-manipulation">
                            <Plus className="w-5 h-5 mr-2" />
                            Novo Cartão
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Novo Cartão</DialogTitle>
                        </DialogHeader>
                        <PaymentForm onSave={handleSave} onCancel={() => setIsDialogOpen(false)} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {success && (
                    <Alert className="border-green-200 bg-green-50 mb-4">
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                )}
                
                {isSaving && <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>}
                <div className="space-y-4">
                    {(user.metodos_pagamento_salvos || user.metodos_pagamento || []).length > 0 ? (
                        user.metodos_pagamento_salvos || user.metodos_pagamento.map(method => (
                            <div key={method.id} className="p-4 border rounded-lg flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex items-center gap-4">
                                    <CardBrandIcon brand={method.bandeira} className="w-12 h-8" />
                                    <div>
                                        <p className="font-semibold">{method.bandeira} •••• {method.final_cartao}</p>
                                        <p className="text-sm text-gray-600">{method.nome_titular}</p>
                                        <p className="text-xs text-gray-500">Válido até {method.validade}</p>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="lg" 
                                    className="h-12 w-12 text-red-500 hover:text-red-700 hover:bg-red-50 touch-manipulation"
                                    onClick={() => handleDelete(method.id)}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-500">Nenhum cartão salvo ainda.</p>
                            <p className="text-sm text-gray-400 mt-2">Adicione um cartão para pagamentos mais rápidos.</p>
                        </div>
                    )}
                </div>
            </CardContent>
            
            {/* Modal de Confirmação de Exclusão */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Confirmar Exclusão
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            {cardToDelete && (
                                <>
                                    <CardBrandIcon brand={cardToDelete.bandeira} className="w-10 h-6" />
                                    <div>
                                        <p className="font-medium">{cardToDelete.bandeira} •••• {cardToDelete.final_cartao}</p>
                                        <p className="text-sm text-gray-600">{cardToDelete.nome_titular}</p>
                                    </div>
                                </>
                            )}
                        </div>
                        <p className="text-gray-700">
                            Tem certeza que deseja remover este cartão? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button 
                                variant="outline" 
                                onClick={cancelDelete}
                                className="px-6"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={confirmDelete}
                                className="px-6"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir Cartão
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
