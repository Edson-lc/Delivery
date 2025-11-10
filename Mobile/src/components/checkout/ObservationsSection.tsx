import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Section } from './Section';
import { FormField } from './FormField';
import { CustomerData } from '../../hooks/useCheckout';

interface ObservationsSectionProps {
  customerData: CustomerData;
  updateCustomerData: (field: keyof CustomerData, value: string) => void;
}

export const ObservationsSection: React.FC<ObservationsSectionProps> = ({
  customerData,
  updateCustomerData,
}) => (
  <Section title="Observações" icon="📝">
    <FormField
      label="Observações Especiais"
      value={customerData.observacoes}
      onChangeText={(text) => updateCustomerData('observacoes', text)}
      placeholder="Alguma observação especial? (Portão azul, interfone quebrado, etc.)"
      multiline
      numberOfLines={3}
    />
  </Section>
);
