import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Section } from './Section';
import { FormField } from './FormField';
import { CustomerData } from '../../hooks/useCheckout';

interface CustomerDataSectionProps {
  customerData: CustomerData;
  updateCustomerData: (field: keyof CustomerData, value: string) => void;
}

export const CustomerDataSection: React.FC<CustomerDataSectionProps> = ({
  customerData,
  updateCustomerData,
}) => (
  <Section title="Seus Dados" icon="👤">
    <FormField
      label="Nome Completo"
      value={customerData.nome}
      onChangeText={(text) => updateCustomerData('nome', text)}
      placeholder="Seu nome completo"
      required
    />
    
    <View style={styles.row}>
      <View style={styles.halfWidth}>
        <FormField
          label="Telefone"
          value={customerData.telefone}
          onChangeText={(text) => updateCustomerData('telefone', text)}
          placeholder="(91) 99999-9999"
          keyboardType="phone-pad"
          required
        />
      </View>
      <View style={styles.halfWidth}>
        <FormField
          label="Email"
          value={customerData.email}
          onChangeText={(text) => updateCustomerData('email', text)}
          placeholder="seu@email.com"
          keyboardType="email-address"
        />
      </View>
    </View>
  </Section>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
});
