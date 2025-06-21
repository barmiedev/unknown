import { StyleProp, ViewStyle } from 'react-native';

export interface BaseComponentProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface PressableProps extends BaseComponentProps {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
} 