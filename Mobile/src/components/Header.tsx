import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../constants';

interface HeaderProps {
  title: string;
  onBackPress: () => void;
  rightIcon?: string;
  onRightIconPress?: () => void;
  rightIconColor?: string;
  backgroundColor?: string;
  showShadow?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBackPress,
  rightIcon,
  onRightIconPress,
  rightIconColor = COLORS.primary,
  backgroundColor = '#ffffff',
  showShadow = true,
}) => (
  <View style={[
    styles.container, 
    { backgroundColor },
    showShadow && styles.shadow
  ]}>
    {/* Botão Voltar */}
    <TouchableOpacity 
      style={styles.backButton} 
      onPress={onBackPress}
      activeOpacity={0.7}
    >
      <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
    </TouchableOpacity>

    {/* Título */}
    <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
      {title}
    </Text>

    {/* Ícone Direito */}
    <TouchableOpacity 
      style={[styles.rightIcon, { backgroundColor: rightIconColor }]} 
      onPress={onRightIconPress}
      activeOpacity={0.7}
    >
      <MaterialIcons 
        name={rightIcon as any || "person"} 
        size={24} 
        color="white" 
      />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 40, // Safe area
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  rightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
