import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';

export interface Address {
  id: string;
  nome: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  cep?: string;
  referencia?: string;
}

interface AddressSelectorProps {
  selectedAddress: Address | null;
  onAddressSelect: (address: Address) => void;
  userAddresses?: Address[];
}

export default function AddressSelector({
  selectedAddress,
  onAddressSelect,
  userAddresses = [],
}: AddressSelectorProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    nome: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: 'Lisboa',
    cep: '',
    referencia: '',
  });

  const getAddressIcon = (addressName: string) => {
    const name = addressName?.toLowerCase() || '';
    if (name.includes('casa') || name.includes('home')) {
      return <MaterialIcons name="home" size={20} color={COLORS.primary} />;
    }
    if (name.includes('trabalho') || name.includes('work') || name.includes('escritório')) {
      return <MaterialIcons name="work" size={20} color={COLORS.primary} />;
    }
    return <MaterialIcons name="place" size={20} color={COLORS.primary} />;
  };

  const handleSaveNewAddress = () => {
    if (!newAddress.nome || !newAddress.rua || !newAddress.numero || !newAddress.bairro) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const address: Address = {
      id: `addr_${Date.now()}`,
      nome: newAddress.nome!,
      rua: newAddress.rua!,
      numero: newAddress.numero!,
      complemento: newAddress.complemento || '',
      bairro: newAddress.bairro!,
      cidade: newAddress.cidade || 'Lisboa',
      cep: newAddress.cep || '',
      referencia: newAddress.referencia || '',
    };

    onAddressSelect(address);
    setIsAddingNew(false);
    setNewAddress({
      nome: '',
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: 'Lisboa',
      cep: '',
      referencia: '',
    });
  };

  const renderAddressItem = (address: Address) => (
    <TouchableOpacity
      key={address.id}
      style={[
        styles.addressItem,
        selectedAddress?.id === address.id && styles.selectedAddressItem,
      ]}
      onPress={() => onAddressSelect(address)}
    >
      <View style={styles.addressIcon}>
        {getAddressIcon(address.nome)}
      </View>
      <View style={styles.addressDetails}>
        <Text style={styles.addressName}>{address.nome}</Text>
        <Text style={styles.addressStreet}>
          {address.rua}, {address.numero}
          {address.complemento && ` - ${address.complemento}`}
        </Text>
        <Text style={styles.addressCity}>
          {address.bairro}, {address.cidade}
        </Text>
      </View>
      <View style={styles.radioButton}>
        <MaterialIcons
          name={selectedAddress?.id === address.id ? 'radio-button-checked' : 'radio-button-unchecked'}
          size={24}
          color={selectedAddress?.id === address.id ? COLORS.primary : COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  const renderAddAddressModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAddingNew}
      onRequestClose={() => setIsAddingNew(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Adicionar Novo Endereço</Text>
            <TouchableOpacity onPress={() => setIsAddingNew(false)}>
              <MaterialIcons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome do Endereço *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Casa, Trabalho"
                value={newAddress.nome}
                onChangeText={(text) => setNewAddress(prev => ({ ...prev, nome: text }))}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroupFlex}>
                <Text style={styles.inputLabel}>Rua *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Nome da rua"
                  value={newAddress.rua}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, rua: text }))}
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              <View style={styles.inputGroupSmall}>
                <Text style={styles.inputLabel}>Número *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="123"
                  value={newAddress.numero}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, numero: text }))}
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroupFlex}>
                <Text style={styles.inputLabel}>Complemento</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Apt, Bloco, etc."
                  value={newAddress.complemento}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, complemento: text }))}
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              <View style={styles.inputGroupFlex}>
                <Text style={styles.inputLabel}>Freguesia *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Freguesia"
                  value={newAddress.bairro}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, bairro: text }))}
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroupFlex}>
                <Text style={styles.inputLabel}>Cidade</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Lisboa"
                  value={newAddress.cidade}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, cidade: text }))}
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              <View style={styles.inputGroupFlex}>
                <Text style={styles.inputLabel}>Código Postal</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="1000-001"
                  value={newAddress.cep}
                  onChangeText={(text) => setNewAddress(prev => ({ ...prev, cep: text }))}
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Referência</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ponto de referência"
                value={newAddress.referencia}
                onChangeText={(text) => setNewAddress(prev => ({ ...prev, referencia: text }))}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsAddingNew(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!newAddress.nome || !newAddress.rua || !newAddress.numero || !newAddress.bairro) && styles.disabledButton,
              ]}
              onPress={handleSaveNewAddress}
              disabled={!newAddress.nome || !newAddress.rua || !newAddress.numero || !newAddress.bairro}
            >
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="place" size={20} color={COLORS.primary} />
        <Text style={styles.title}>Endereço de Entrega</Text>
      </View>

      {userAddresses.length > 0 ? (
        <View style={styles.addressesList}>
          {userAddresses.map(renderAddressItem)}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="place" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyStateTitle}>Nenhum endereço salvo</Text>
          <Text style={styles.emptyStateText}>
            Adicione um endereço para facilitar seus pedidos
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsAddingNew(true)}
      >
        <MaterialIcons name="add" size={20} color={COLORS.primary} />
        <Text style={styles.addButtonText}>Adicionar Nova Morada</Text>
      </TouchableOpacity>

      {renderAddAddressModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  addressesList: {
    marginBottom: SPACING.md,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    backgroundColor: '#ffffff',
  },
  selectedAddressItem: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addressDetails: {
    flex: 1,
  },
  addressName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  addressStreet: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  addressCity: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  radioButton: {
    marginLeft: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.md,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#ffffff',
  },
  addButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalContent: {
    padding: SPACING.md,
    maxHeight: '70%',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputGroupFlex: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  inputGroupSmall: {
    width: 80,
    marginBottom: SPACING.md,
    marginLeft: SPACING.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    backgroundColor: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    marginLeft: SPACING.sm,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.textSecondary,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
