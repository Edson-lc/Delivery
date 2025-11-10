import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';
import { Restaurant } from '../types';
import { getCategoryIcon, getCategoryColor } from '../utils/categoryIcons';
import { useColors } from '../hooks/useColors';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: () => void;
  isPromotional?: boolean;
}

function RestaurantCardComponent({ restaurant, onPress, isPromotional = false }: RestaurantCardProps) {
  const colors = useColors();
  const defaultImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&crop=center";
  const categoryIconData = getCategoryIcon(restaurant.categoria);
  const categoryColor = getCategoryColor(restaurant.categoria);

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { backgroundColor: colors.surface, borderColor: colors.border }
      ]} 
      onPress={onPress} 
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: restaurant.imagemUrl || restaurant.imagem_url || defaultImage }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Informações sobrepostas na imagem */}
        <View style={styles.imageInfo}>
          <View style={styles.imageInfoRow}>
            {/* Categoria - Alinhada à esquerda */}
            <View style={styles.categoryBadge}>
              <MaterialIcons name={categoryIconData.name} size={16} color={categoryColor} />
              <Text style={styles.categoryText}>
                {restaurant.categoria}
              </Text>
            </View>
            
            {/* Outros badges - Alinhados à direita */}
            <View style={styles.badgesContainer}>
              {/* Tempo de Preparo */}
              <View style={styles.infoBadge}>
                <MaterialIcons name="access-time" size={16} color="#60a5fa" />
                <Text style={styles.infoBadgeText}>
                  {restaurant.tempoPreparo || restaurant.tempo_preparo || 30}min
                </Text>
              </View>
              
              {/* Taxa de Entrega */}
              <View style={styles.infoBadge}>
                <MaterialIcons name="delivery-dining" size={16} color="#4ade80" />
                <Text style={styles.infoBadgeText}>
                  {`€${(restaurant.taxaEntrega || restaurant.taxa_entrega || 0).toFixed(2)}`}
                </Text>
              </View>
              
              {/* Avaliação */}
              <View style={styles.infoBadge}>
                <MaterialIcons name="star" size={16} color="#fbbf24" />
                <Text style={styles.infoBadgeText}>
                  {restaurant.rating?.toFixed(1) || 'Novo'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{restaurant.nome}</Text>
      </View>
    </TouchableOpacity>
  );
}

export const RestaurantCard = React.memo(RestaurantCardComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  imageContainer: {
    position: 'relative',
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageInfo: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
  },
  imageInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  categoryText: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  infoBadgeText: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});