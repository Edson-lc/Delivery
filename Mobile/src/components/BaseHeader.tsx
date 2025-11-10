import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useColors } from '../hooks/useColors';

interface BaseHeaderProps {
  title: string;
  onBackPress: () => void;
  rightIcon?: string;
  onRightIconPress?: () => void;
  rightIconColor?: string;
}

export const BaseHeader: React.FC<BaseHeaderProps> = ({
  title,
  onBackPress,
  rightIcon,
  onRightIconPress,
  rightIconColor = COLORS.primary,
}) => {
  const { user, isAuthenticated } = useAuth();
  const colors = useColors();

  return (
    <View style={[
      styles.container, 
      { backgroundColor: colors.surface, borderBottomColor: colors.border }
    ]}>
      {/* Botão Voltar */}
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: colors.background, borderWidth: 0 }]} 
        onPress={onBackPress}
        activeOpacity={0.7}
      >
        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      {/* Título */}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
        {title}
      </Text>

      {/* Ícone Direito */}
      <TouchableOpacity 
        style={[styles.rightIcon, { backgroundColor: rightIconColor }]} 
        onPress={onRightIconPress}
        activeOpacity={0.7}
      >
        {rightIcon === "person" && isAuthenticated && user?.fotoUrl ? (
          <Image
            source={{ uri: user.fotoUrl }}
            style={styles.userAvatar}
            resizeMode="cover"
          />
        ) : (
          <MaterialIcons 
            name={rightIcon as any || "person"} 
            size={24} 
            color="white" 
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
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
    overflow: 'hidden',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
