// src/components/CategoryFilter.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';
import { getCategoryIcon, getCategoryColor } from '../utils/categoryIcons';

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export default function CategoryFilter({ 
  activeCategory, 
  onCategoryChange, 
  categories 
}: CategoryFilterProps) {
  const allCategories = ['todas', ...categories];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={120}
        snapToAlignment="start"
      >
        {allCategories.map((category) => {
          const isActive = activeCategory === category;
          const categoryIcon = getCategoryIcon(category);
          const categoryColor = getCategoryColor(category);

          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                isActive && styles.activeCategoryButton,
                isActive && { backgroundColor: categoryColor }
              ]}
              onPress={() => onCategoryChange(category)}
              activeOpacity={0.7}
            >
              <categoryIcon.Icon 
                name={categoryIcon.name} 
                size={FONT_SIZES.sm} 
                color={isActive ? '#ffffff' : categoryColor} 
              />
              <Text style={[
                styles.categoryText,
                isActive && styles.activeCategoryText
              ]}>
                {category === 'todas' ? 'Todas' : category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  activeCategoryButton: {
    borderColor: 'transparent',
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  activeCategoryText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
