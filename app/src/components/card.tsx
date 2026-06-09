import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';

import { commonStyles } from '@/src/theme';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return <View style={[commonStyles.card, style]}>{children}</View>;
}
