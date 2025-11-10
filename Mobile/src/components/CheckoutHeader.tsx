import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../constants';
import { BaseHeader } from './BaseHeader';

interface CheckoutHeaderProps {
  title: string;
  onBackPress: () => void;
  itemCount?: number;
  onCartPress?: () => void;
}

export const CheckoutHeader: React.FC<CheckoutHeaderProps> = ({
  title,
  onBackPress,
  itemCount = 0,
  onCartPress,
}) => {
  const renderCartButton = () => (
    <TouchableOpacity 
      style={styles.cartButton} 
      onPress={onCartPress}
      activeOpacity={0.7}
    >
      <MaterialIcons name="shopping-cart" size={24} color="white" />
      {itemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <BaseHeader
        title={title}
        onBackPress={onBackPress}
        rightIcon={undefined}
        onRightIconPress={undefined}
      />
      <View style={styles.rightIconContainer}>
        {renderCartButton()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rightIconContainer: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.sm,
    bottom: SPACING.sm,
    justifyContent: 'center',
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: 'white',
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
  },
});
