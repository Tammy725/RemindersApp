import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../theme/colors';

export default function ModalDetalles({ visible, onClose, title, details, onSave, editable }) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) {
      setText(details || '');
    }
  }, [visible, details]);

  const handleSave = () => {
    if (onSave) onSave(text);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={(e) => e.target === e.currentTarget && onClose()}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.headerRight}>
              {editable && (
                <TouchableOpacity style={styles.headerBtn} onPress={handleSave}>
                  <MaterialIcons name="check" size={24} color={colors.secondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
                <MaterialIcons name="close" size={24} color={colors.outline} />
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Escribe los detalles..."
            placeholderTextColor={colors['outline-variant']}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            editable={editable}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxWidth: 600,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors['on-surface'],
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
    flex: 1,
    marginRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 4,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    minHeight: 200,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    color: colors['on-surface'],
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
});
