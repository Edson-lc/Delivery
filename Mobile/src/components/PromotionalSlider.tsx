import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';
import { Restaurant } from '../types';
import { useColors } from '../hooks/useColors';

interface PromotionalSliderProps {
  restaurants: Restaurant[];
  onRestaurantPress: (restaurant: Restaurant) => void;
}

const { width } = Dimensions.get('window');
const SLIDE_PADDING = SPACING.md;
const SLIDE_WIDTH = width - (SLIDE_PADDING * 2);

export default function PromotionalSlider({ restaurants, onRestaurantPress }: PromotionalSliderProps) {
  const colors = useColors();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-play functionality
  useEffect(() => {
    if (restaurants.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % restaurants.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [restaurants.length]);

  // Update scroll position when currentSlide changes
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: currentSlide * SLIDE_WIDTH,
        animated: true,
      });
    }
  }, [currentSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (restaurants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma promoção disponível no momento.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.titleContainer}>
        <MaterialIcons name="star" size={FONT_SIZES.xl} color="#fbbf24" />
        <Text style={[styles.title, { color: colors.text }]}>Promoções Especiais</Text>
      </View>

      <View style={styles.sliderContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SLIDE_WIDTH);
            setCurrentSlide(slideIndex);
          }}
        >
          {restaurants.map((restaurant, index) => (
            <View key={restaurant.id} style={[styles.slide, { width: SLIDE_WIDTH }]}>
              <TouchableOpacity 
                style={styles.slideContent}
                activeOpacity={0.9}
                onPress={() => onRestaurantPress(restaurant)}
              >
                {/* Background Image */}
                <Image
                  source={{ 
                    uri: restaurant.imagemUrl || restaurant.imagem_url || 
                    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop" 
                  }}
                  style={styles.slideImage}
                  resizeMode="cover"
                />
                
                {/* Gradient Overlay */}
                <View style={styles.gradientOverlay} />
                
                {/* Content */}
                <View style={styles.slideInfo}>
                  {/* Promoção Badge - Top Right */}
                  <View style={styles.promoBadgeContainer}>
                    <View style={styles.promoBadge}>
                      <MaterialIcons name="local-offer" size={14} color="white" />
                      <Text style={styles.promoBadgeText}>PROMOÇÃO</Text>
                    </View>
                  </View>
                  
                  <View style={[styles.slideTextContainer, { maxWidth: SLIDE_WIDTH * 0.8 }]}>
                    {/* Restaurant Name */}
                    <Text style={styles.restaurantName}>
                      {restaurant.nome}
                    </Text>
                    
                    {/* Description */}
                    <Text style={styles.description} numberOfLines={1}>
                      {restaurant.descricao || "Descontos especiais e ofertas imperdíveis! Peça já e aproveite."}
                    </Text>
                    
                    {/* Action Button */}
                    <View style={styles.actionButton}>
                      <Text style={styles.actionButtonText}>Ver Cardápio →</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Slide Indicators */}
        <View style={styles.indicators}>
          {restaurants.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.indicator,
                index === currentSlide && styles.activeIndicator
              ]}
              onPress={() => goToSlide(index)}
            />
          ))}
        </View>

        {/* Slide Counter */}
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {currentSlide + 1} / {restaurants.length}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
    backgroundColor: '#F9FAFB',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sliderContainer: {
    position: 'relative',
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginHorizontal: SPACING.md,
  },
  slide: {
    height: '100%',
  },
  slideContent: {
    flex: 1,
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  slideInfo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  slideTextContainer: {
    // maxWidth será definido dinamicamente no JSX
  },
  promoBadgeContainer: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    zIndex: 10,
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    gap: SPACING.xs,
  },
  promoBadgeText: {
    color: 'white',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  restaurantName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: SPACING.xs,
    lineHeight: FONT_SIZES.xxl * 1.2,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: '#e5e7eb',
    marginBottom: SPACING.md,
    lineHeight: FONT_SIZES.sm * 1.4,
  },
  actionButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: SPACING.sm,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
  },
  indicators: {
    position: 'absolute',
    bottom: SPACING.md,
    left: '50%',
    flexDirection: 'row',
    gap: SPACING.sm,
    transform: [{ translateX: -50 }],
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeIndicator: {
    width: 32,
    backgroundColor: 'white',
  },
  counter: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  counterText: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
});