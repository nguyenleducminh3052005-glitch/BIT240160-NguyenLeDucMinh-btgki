import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { common } from '../theme';

export default function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[common.chip, active && common.chipActive]} onPress={onPress}>
      <Text style={[common.chipText, active && common.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
