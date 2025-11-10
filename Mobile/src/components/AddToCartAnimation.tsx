import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface AddToCartAnimationProps {
  visible: boolean;
  onComplete: () => void;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
}

export default function AddToCartAnimation({
  visible,
  onComplete,
  startPosition,
  endPosition,
}: AddToCartAnimationProps) {
  const translateX = useRef(new Animated.Value(startPosition.x)).current;
  const translateY = useRef(new Animated.Value(startPosition.y)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset position
      translateX.setValue(startPosition.x);
      translateY.setValue(startPosition.y);
      scale.setValue(0.5);
      opacity.setValue(0);
      rotation.setValue(0);

      // Create a curved path animation
      const createCurvedAnimation = () => {
        const controlX = (startPosition.x + endPosition.x) / 2;
        const controlY = Math.min(startPosition.y, endPosition.y) - 100; // Curve upward

        return Animated.parallel([
          // Position animation with easing
          Animated.timing(translateX, {
            toValue: endPosition.x,
            duration: 800,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: endPosition.y,
            duration: 800,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }),
          // Scale animation - starts small, grows, then shrinks
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.3,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.8,
              duration: 600,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          // Opacity animation
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 700,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          // Rotation animation
          Animated.timing(rotation, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]);
      };

      createCurvedAnimation().start(() => {
        onComplete();
      });
    }
  }, [visible, startPosition, endPosition]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        {
          transform: [
            { translateX },
            { translateY },
            { scale },
            { rotate: rotateInterpolate },
          ],
          opacity,
        }
      ]} 
      pointerEvents="none"
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name="shopping-cart" size={28} color={COLORS.primary} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
});
