import React from 'react';
import { BaseHeader } from './BaseHeader';

interface RestaurantHeaderProps {
  title: string;
  onBackPress: () => void;
  onProfilePress?: () => void;
  showProfile?: boolean;
}

export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({
  title,
  onBackPress,
  onProfilePress,
  showProfile = true,
}) => (
  <BaseHeader
    title={title}
    onBackPress={onBackPress}
    rightIcon={showProfile ? "person" : undefined}
    onRightIconPress={showProfile ? onProfilePress : undefined}
  />
);
