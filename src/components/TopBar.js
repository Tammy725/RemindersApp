import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../theme/colors';

const beeIcon = require('../../assets/bee.png');

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
    width: 37,
    height: 37,
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
