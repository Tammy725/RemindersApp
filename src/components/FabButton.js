import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../theme/colors';

export default function FabButton({ icon, onPress, backgroundColor }) {
  return (
    <TouchableOpacity
      style={[
        styles.fab,
        backgroundColor ? { backgroundColor } : null,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialIcons
        name={icon || 'mic'}
        size={28}
        color={colors.white}
        style={{ fontVariationSettings: "'FILL' 1" }}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 122,
    right: 20,
    zIndex: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.greenDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
