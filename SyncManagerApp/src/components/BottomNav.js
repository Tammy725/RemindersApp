import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../theme/colors';

const tabs = [
  { key: 'Hoy', icon: 'home', label: 'Hoy' },
  { key: 'Calendario', icon: 'calendar-today', label: 'Calendario' },
  { key: 'Metricas', icon: 'insights', label: 'Métricas' },
  { key: 'Ajustes', icon: 'settings', label: 'Ajustes' },
];

export default function BottomNav({ activeTab, onTabPress }) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
          >
            <MaterialIcons
              name={tab.icon}
              size={24}
              color={isActive ? colors.primary : colors.outline}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.primary : colors.outline },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors['outline-variant'],
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
});