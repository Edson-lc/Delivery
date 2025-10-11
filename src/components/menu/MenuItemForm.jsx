
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, X } from 'lucide-react';

const categories = ["entrada", "prato_principal", "sobremesa", "bebida", "lanche", "acompanhamento"];

const PersonalizationGroupsFieldArray = ({ title, fields, setFields }) => {
  const addGroup = () => {
    const newGroup = { 
      nome_grupo: '', 
      obrigatorio: true, 
      minimo_opcoes: 0,
      maximo_opcoes: 0,
      opcoes: [] 
    };
    setFields([...fields, newGroup]);
  };

  const removeGroup = (groupIndex) => {
    setFields(fields.filter((_, i) => i !== groupIndex));
  };

  const updateGroup = (groupIndex, field, value) => {
    const newGroups = [...fields];
    newGroups[groupIndex][field] = value;
    setFields(newGroups);
  };

  const addOption = (groupIndex) => {
    const newGroups = [...fields];
    if (!newGroups[groupIndex].opcoes) {
      newGroups[groupIndex].opcoes = [];
    }
    newGroups[groupIndex].opcoes.push({ nome: '', preco_adicional: 0 });
    setFields(newGroups);
  };

  const removeOption = (groupIndex, optionIndex) => {
    const newGroups = [...fields];
    newGroups[groupIndex].opcoes.splice(optionIndex, 1);
    setFields(newGroups);
  };

  const updateOption = (groupIndex, optionIndex, field, value) => {
    const newGroups = [...fields];
    newGroups[groupIndex].opcoes[optionIndex][field] = value;
    setFields(newGroups);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h4 className="font-medium">{title}</h4>
      {fields.map((group, groupIndex) => (
        <div key={groupIndex} className="p-3 border rounded-md space-y-3">
          <div className="flex justify-between items-center">
            <h5 className="font-semibold">Grupo {groupIndex + 1}</h5>
            <Button variant="ghost" size="icon" onClick={() => removeGroup(groupIndex)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
          
          {/* Nome do Grupo e Seleção Obrigatória */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome do Grupo (ex: Escolha a Carne)</Label>
              <Input 
                value={group.nome_grupo || ''} 
                onChange={(e) => updateGroup(groupIndex, 'nome_grupo', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2 p-2 border rounded-md h-10">
                <Checkbox 
                  id={`obrigatorio-${groupIndex}`}
                  checked={group.obrigatorio}
                  onCheckedChange={(checked) => updateGroup(groupIndex, 'obrigatorio', checked)}
                />
                <Label htmlFor={`obrigatorio-${groupIndex}`}>Seleção Obrigatória</Label>
              </div>
            </div>
          </div>

          {/* Mínimo e Máximo de Opções */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mínimo de opções a escolher</Label>
              <Input 
                type="number"
                min="0"
                max={group.opcoes ? group.opcoes.length : 0}
                value={group.minimo_opcoes || 0} 
                onChange={(e) => updateGroup(groupIndex, 'minimo_opcoes', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Número mínimo de opções que o cliente deve escolher (0 = opcional)
              </p>
            </div>
            <div>
              <Label>Máximo de opções a escolher</Label>
              <Input 
                type="number"
                min="0"
                max={group.opcoes ? group.opcoes.length : 0}
                value={group.maximo_opcoes || 0} 
                onChange={(e) => updateGroup(groupIndex, 'maximo_opcoes', parseInt(e.target.value) || 0)}
                placeholder="0 = sem limite"
              />
              <p className="text-xs text-gray-500 mt-1">
                Número máximo de opções (0 = sem limite)
              </p>
            </div>
          </div>

          {/* Opções do Grupo */}
          <div>
            <Label>Opções do Grupo</Label>
            {(group.opcoes || []).map((opcao, opcaoIndex) => (
              <div key={opcaoIndex} className="flex items-end gap-2 mt-2">
                <div className="flex-1">
                  <Label className="text-xs">Nome da Opção</Label>
                  <Input 
                    value={opcao.nome || ''}
                    onChange={(e) => updateOption(groupIndex, opcaoIndex, 'nome', e.target.value)}
                  />
                </div>
                <div className="w-32">
                  <Label className="text-xs">Preço Adicional (€)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={opcao.preco_adicional || 0}
                    onChange={(e) => updateOption(groupIndex, opcaoIndex, 'preco_adicional', parseFloat(e.target.value))}
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeOption(groupIndex, opcaoIndex)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => addOption(groupIndex)}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar Opção
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addGroup}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar Grupo de Opções
      </Button>
    </div>
  );
};

const DynamicFieldArray = ({ title, fields, setFields, fieldConfig }) => {
  const addField = () => {
    const newField = fieldConfig.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.default }), {});
    setFields([...fields, newField]);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index, fieldName, value) => {
    const newFields = [...fields];
    if (!newFields[index]) {
      newFields[index] = {};
    }
    newFields[index][fieldName] = value;
    setFields(newFields);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h4 className="font-medium">{title}</h4>
      {fields.map((field, index) => (
        <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
          {fieldConfig.map(config => (
            <div key={config.name} className="flex-1">
              <Label className="text-xs">{config.label}</Label>
              {config.type === 'text' && (
                <Input
                  value={field?.[config.name] || ''}
                  onChange={(e) => handleFieldChange(index, config.name, e.target.value)}
                  placeholder={config.label}
                />
              )}
              {config.type === 'number' && (
                <Input
                  type="number"
                  step="0.01"
                  value={field?.[config.name] || 0}
                  onChange={(e) => handleFieldChange(index, config.name, parseFloat(e.target.value))}
                  placeholder={config.label}
                />
              )}
              {config.type === 'checkbox' && (
                <div className="flex items-center h-10">
                    <Checkbox
                        checked={field?.[config.name] || false}
                        onCheckedChange={(checked) => handleFieldChange(index, config.name, checked)}
                    />
                </div>
              )}
            </div>
          ))}
          <Button variant="ghost" size="icon" onClick={() => removeField(index)} className="mt-4">
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addField}>
        <Plus className="w-4 h-4 mr-2" /> Adicionar
      </Button>
    </div>
  );
};


export default function MenuItemForm({ item, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setFormData(item || {
      nome: "",
      descricao: "",
      preco: 0,
      categoria: "prato_principal",
      imagem_url: "",
      disponivel: true,
      ingredientes: [],
      adicionais: [],
      alergenos: [],
      opcoes_personalizacao: [], // Added for new feature
    });
  }, [item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Debug: verificar dados antes do envio
    console.log('FormData antes do processamento:', formData);
    
    // Garantir que adicionais estejam corretos
    const adicionaisCorretos = (formData.adicionais || []).map(ad => ({
      nome: ad?.nome || '',
      preco: ad?.preco || 0
    })).filter(ad => ad.nome.trim() !== '');
    
    // Garantir que alérgenos estejam corretos
    const alergenosCorretos = (formData.alergenos || []).map(a => 
      typeof a === 'string' ? a : a?.nome || ''
    ).filter(nome => nome.trim() !== '');
    
    // Garantir que opções de personalização estejam corretas
    const personalizacoesCorretas = (formData.opcoes_personalizacao || []).filter(group => 
      group && group.nome_grupo && group.nome_grupo.trim() !== ''
    );
    
    const finalData = {
      ...formData,
      adicionais: adicionaisCorretos,
      alergenos: alergenosCorretos,
      opcoes_personalizacao: personalizacoesCorretas
    };
    
    console.log('Dados finais enviados:', finalData);
    onSubmit(finalData);
  };

  if (formData?.nome === undefined) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Item *</Label>
          <Input id="nome" value={formData.nome || ''} onChange={(e) => setFormData({...formData, nome: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preco">Preço (€) *</Label>
          <Input id="preco" type="number" step="0.01" value={formData.preco || 0} onChange={(e) => setFormData({...formData, preco: parseFloat(e.target.value)})} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" value={formData.descricao || ''} onChange={(e) => setFormData({...formData, descricao: e.target.value})} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria *</Label>
          <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{cat.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="imagem_url">URL da Imagem</Label>
          <Input id="imagem_url" value={formData.imagem_url || ''} onChange={(e) => setFormData({...formData, imagem_url: e.target.value})} />
        </div>
      </div>

      <div className="flex items-center justify-between p-3 border rounded-lg">
        <Label htmlFor="disponivel">Disponível para venda</Label>
        <Switch id="disponivel" checked={formData.disponivel} onCheckedChange={(checked) => setFormData({...formData, disponivel: checked})} />
      </div>
      
      {/* Ingredientes */}
      <DynamicFieldArray
        title="Ingredientes"
        fields={formData.ingredientes || []}
        setFields={(newFields) => setFormData({...formData, ingredientes: newFields})}
        fieldConfig={[
          { name: 'nome', label: 'Nome', type: 'text', default: '' },
          { name: 'removivel', label: 'Removível', type: 'checkbox', default: true },
        ]}
      />

      {/* Adicionais */}
      <DynamicFieldArray
        title="Adicionais Pagos"
        fields={formData.adicionais || []}
        setFields={(newFields) => setFormData({...formData, adicionais: newFields})}
        fieldConfig={[
          { name: 'nome', label: 'Nome', type: 'text', default: '' },
          { name: 'preco', label: 'Preço (€)', type: 'number', default: 0 },
        ]}
      />

      {/* Grupos de Personalização */}
      <PersonalizationGroupsFieldArray
        title="Grupos de Opções de Personalização"
        fields={formData.opcoes_personalizacao || []}
        setFields={(newFields) => setFormData({...formData, opcoes_personalizacao: newFields})}
      />

      {/* Alergenos */}
      <DynamicFieldArray
        title="Alérgenos"
        fields={(formData.alergenos || []).map(a => ({ nome: a || '' }))}
        setFields={(newFields) => setFormData({...formData, alergenos: newFields.map(f => f.nome)})}
        fieldConfig={[
          { name: 'nome', label: 'Nome do Alérgeno', type: 'text', default: '' },
        ]}
      />

      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="ghost" onClick={onCancel}><X className="w-4 h-4 mr-2" /> Cancelar</Button>
        <Button type="submit" className="bg-gradient-to-r from-orange-500 to-red-500">Salvar Item</Button>
      </div>
    </form>
  );
}
