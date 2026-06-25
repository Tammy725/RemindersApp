import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Platform, ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import ModalDetalles from './ModalDetalles';

export default function ModalChecklist({ visible, onClose }) {
  const { state, dispatch } = useApp();
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [selectedDept, setSelectedDept] = useState('todos');
  const [newDate, setNewDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editText, setEditText] = useState('');
  const [detallesItem, setDetallesItem] = useState(null);

  const filteredItems = state.checklistTemplates.filter(
    t => t.department === selectedDept || selectedDept === 'todos',
  );

  const addItem = () => {
    if (!newTitle.trim()) return;
    dispatch({
      type: 'ADD_CHECKLIST_TEMPLATE',
      payload: { title: newTitle.trim(), department: selectedDept, details: newDetails, date: newDate },
    });
    setNewTitle('');
    setNewDetails('');
    setNewDate('');
  };

  const startEdit = (item) => {
    dispatch({ type: 'SET_EDITING_ITEM', payload: item.id });
    setEditText(item.title);
  };

  const saveEdit = (id) => {
    if (!editText.trim()) return;
    dispatch({ type: 'EDIT_CHECKLIST_TEMPLATE', payload: { id, title: editText.trim() } });
  };

  const cancelEdit = () => dispatch({ type: 'SET_EDITING_ITEM', payload: null });

  const openDetalles = (item) => setDetallesItem(item);
  const closeDetalles = () => setDetallesItem(null);
  const closeAndReset = () => { setNewDate(''); onClose(); };

  const saveDetalles = (detailsText) => {
    if (!detallesItem) return;
    if (detallesItem.id === null) {
      dispatch({
        type: 'ADD_CHECKLIST_TEMPLATE',
        payload: { title: detallesItem.title.trim(), department: selectedDept, details: detailsText, date: newDate },
      });
      setNewTitle('');
      setNewDetails('');
      setNewDate('');
    } else {
      dispatch({ type: 'SET_CHECKLIST_DETAILS', payload: { id: detallesItem.id, details: detailsText } });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeAndReset}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeAndReset} />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <MaterialIcons name="checklist" size={18} color="#16a34a" />
              </View>
              <Text style={styles.title}>Editar Checklist</Text>
            </View>
            <TouchableOpacity onPress={closeAndReset} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color={colors.outline} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Departamento</Text>
            <View style={styles.deptRow}>
              <TouchableOpacity
                style={[styles.deptChip, selectedDept === 'todos' && styles.deptChipActive]}
                onPress={() => setSelectedDept('todos')}
              >
                <Text style={[styles.deptChipText, selectedDept === 'todos' && styles.deptChipTextActive]}>Todos</Text>
              </TouchableOpacity>
              {state.equipos.map(eq => (
                <TouchableOpacity
                  key={eq.id}
                  style={[styles.deptChip, selectedDept === eq.name && styles.deptChipActive]}
                  onPress={() => setSelectedDept(eq.name)}
                >
                  <Text style={[styles.deptChipText, selectedDept === eq.name && styles.deptChipTextActive]}>{eq.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Fecha</Text>
            <View style={styles.deptRow}>
              <TouchableOpacity
                style={[styles.deptChip, newDate === '' && styles.deptChipActive]}
                onPress={() => { setNewDate(''); setShowDatePicker(false); }}
              >
                <Text style={[styles.deptChipText, newDate === '' && styles.deptChipTextActive]}>Todas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deptChip, newDate !== '' && styles.deptChipActive]}
                onPress={() => {
                  setShowDatePicker(true);
                  if (newDate === '') {
                    const today = new Date();
                    setNewDate(today.toISOString().slice(0, 10));
                  }
                }}
              >
                <Text style={[styles.deptChipText, newDate !== '' && styles.deptChipTextActive]}>
                  {newDate ? newDate.split('-').reverse().join('/') : 'Seleccionar fecha'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              placeholder="Nuevo ítem..."
              placeholderTextColor={colors.outline}
              value={newTitle}
              onChangeText={setNewTitle}
              onSubmitEditing={addItem}
            />
            <TouchableOpacity
              style={[styles.detailsNewBtn, !newTitle.trim() && styles.detailsNewBtnDisabled]}
              onPress={() => setDetallesItem({ id: null, title: newTitle, details: newDetails })}
              disabled={!newTitle.trim()}
            >
              <Feather name="external-link" size={16} color={!newTitle.trim() ? colors['outline-variant'] : colors.outline} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={addItem}>
              <MaterialIcons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.itemList}>
            {filteredItems.length === 0 ? (
              <Text style={styles.emptyText}>No hay ítems para este departamento</Text>
            ) : (
              filteredItems.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  {state._editingItemId === item.id ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={styles.editInput}
                        value={editText}
                        onChangeText={setEditText}
                        onSubmitEditing={() => saveEdit(item.id)}
                        autoFocus
                      />
                      <TouchableOpacity onPress={() => saveEdit(item.id)} style={styles.iconBtn}>
                        <MaterialIcons name="check" size={18} color={colors.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={cancelEdit} style={styles.iconBtn}>
                        <MaterialIcons name="close" size={18} color={colors.outline} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.itemText}>{item.title}</Text>
                      <TouchableOpacity onPress={() => openDetalles(item)} style={styles.smallBtn}>
                        <Feather name="external-link" size={14} color={colors.outline} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => startEdit(item)} style={styles.smallBtn}>
                        <MaterialIcons name="edit" size={16} color={colors.outline} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => dispatch({ type: 'DELETE_CHECKLIST_TEMPLATE', payload: item.id })}
                        style={styles.smallBtn}
                      >
                        <MaterialIcons name="delete" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(newDate || new Date().toISOString().slice(0, 10))}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            if (date) setNewDate(date.toISOString().slice(0, 10));
            setShowDatePicker(false);
          }}
        />
      )}

      {detallesItem && (
        <ModalDetalles
          visible={!!detallesItem}
          onClose={closeDetalles}
          title={detallesItem.title}
          details={detallesItem.details || ''}
          onSave={saveDetalles}
          editable={true}
          saveLabel={detallesItem.id === null ? 'Agregar' : undefined}
        />
      )}
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
    maxHeight: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors['on-surface'],
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.outline,
    fontWeight: '500',
    marginBottom: 4,
  },
  deptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deptChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    backgroundColor: colors.surface,
  },
  deptChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  deptChipText: {
    fontSize: 14,
    color: colors['on-surface-variant'],
  },
  deptChipTextActive: {
    color: colors['on-primary'],
    fontWeight: '600',
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors['on-surface'],
  },
  detailsNewBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  detailsNewBtnDisabled: {
    opacity: 0.4,
    borderColor: colors['outline-variant'],
  },
  addBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemList: {
    maxHeight: 256,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.outline,
    fontSize: 14,
    paddingVertical: 32,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors['surface-container-low'],
    borderRadius: 8,
    marginBottom: 6,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors['on-surface'],
  },
  editRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    backgroundColor: '#fff',
    fontSize: 14,
    color: colors['on-surface'],
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
