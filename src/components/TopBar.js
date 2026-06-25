import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../theme/colors';

const beeIcon = { uri: 'data:image/png;base64,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' };

export default function TopBar({ title, onDateChange }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.inner}>
        <View style={styles.left}>
          <Image source={beeIcon} style={styles.beeIcon} fadeDuration={0} />
          {title === 'Seleccionar fecha' ? (
            <TouchableOpacity style={styles.titleBtn} onPress={onDateChange}>
              <Text style={styles.titleText}>{title}</Text>
              <MaterialIcons name="expand-more" size={16} color={colors['on-surface']} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.titleText}>{title}</Text>
          )}
        </View>
        <View style={styles.right}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={24} color={colors.outline} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'rgba(247, 249, 251, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: colors['outline-variant'],
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  beeIcon: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  titleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titleText: {
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
    fontSize: 24,
    fontWeight: '700',
    color: colors['on-surface'],
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors['surface-container-highest'],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors['outline-variant'],
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
});
