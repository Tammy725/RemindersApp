import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import ModalHorario from '../components/ModalHorario';
import TopBar from '../components/TopBar';

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export default function HoyScreen() {
  const { state, dispatch } = useApp();
  const [showHorarioModal, setShowHorarioModal] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const toDisplay = (ymd) => {
    if (!ymd) return '';
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  };
  const toYmd = (display) => {
    const parts = display.split('/');
    if (parts.length !== 3) return display;
    const [d, m, y] = parts;
    if (d.length === 4) return display; // already YYYY-MM-DD
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };
  const [newTodoDate, setNewTodoDate] = useState(toDisplay(state.hoyDate));

  const d = new Date(state.hoyDate + 'T12:00:00');
  const dayName = DAYS[d.getDay()];
  const fullDate = `${d.getDate()} de ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
  const attTime = `${state.hora.toString().padStart(2, '0')}:${state.minuto.toString().padStart(2, '0')} ${state.periodo}`;

  const todayStr = new Date().toISOString().slice(0, 10);
  const cl = state.hoyDate === todayStr
    ? state.checklist
    : (state.dailyHistory[state.hoyDate]?.checklist || {});
  const visibleTemplates = state.checklistTemplates;
  const pendingChecklist = visibleTemplates.filter(t => !cl[t.id]).length;

  const dayTodos = state.todos.filter(t => t.date === state.hoyDate);
  const pendingTodos = dayTodos.filter(t => !t.completed).length;
  const todosDone = dayTodos.filter(t => t.completed).length;

  const asistioVal = state.hoyDate === todayStr
    ? state.asistio
    : (state.dailyHistory[state.hoyDate]?.asistio ?? null);

  const handleDateChange = () => {
    // In a real app, use DateTimePicker. For simplicity we'll shift day by ±1
  };

  const setAttendance = (val) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (state.hoyDate === todayStr) {
      dispatch({ type: 'SET_ASISTIO', payload: state.asistio === val ? null : val });
    } else {
      dispatch({
        type: 'SET_DAILY_ASISTIO',
        payload: {
          date: state.hoyDate,
          value: asistioVal === val ? null : val,
        },
      });
    }
  };

  const addTodo = () => {
    if (!newTodoText.trim()) return;
    dispatch({
      type: 'ADD_TODO',
      payload: { text: newTodoText.trim(), date: toYmd(newTodoDate) || state.hoyDate },
    });
    setNewTodoText('');
  };

  return (
    <View style={styles.container}>
      <TopBar
        title="Tareas del Día"
        onDateChange={handleDateChange}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'position' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 150 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
        {/* Date Header + Counters */}
        <View style={styles.dateSection}>
          <View>
            <Text style={styles.dayName}>{dayName}</Text>
            <Text style={styles.fullDate}>{fullDate}</Text>
          </View>
          <View style={styles.counters}>
            <View style={styles.counterCard}>
              <Text style={styles.counterNumBlue}>{todosDone}/{dayTodos.length}</Text>
              <Text style={styles.counterLabelBlue}>Tareas</Text>
            </View>
            <View style={styles.counterCard}>
              <Text style={styles.counterNumPurple}>
                {visibleTemplates.filter(t => cl[t.id]).length}/{visibleTemplates.length}
              </Text>
              <Text style={styles.counterLabelPurple}>Check</Text>
            </View>
          </View>
        </View>

        {/* Schedule Button */}
        <TouchableOpacity style={styles.scheduleBtn} onPress={() => setShowHorarioModal(true)}>
          <MaterialIcons name="add" size={18} color={colors['on-surface']} />
          <Text style={styles.scheduleBtnText}>Configurar horario (reuniones diarias)</Text>
        </TouchableOpacity>

        {/* Attendance */}
        <View style={styles.attCard}>
          <View>
            <Text style={styles.attTitle}>Reunión - {attTime}</Text>
            <Text style={styles.attQuestion}>¿La reunión se llevó a cabo?</Text>
          </View>
          <View style={styles.attBtns}>
            <TouchableOpacity
              style={[styles.attBtn, asistioVal === true && styles.attBtnYesActive]}
              onPress={() => setAttendance(true)}
            >
              <Text style={[styles.attBtnText, asistioVal === true && styles.attBtnTextYesActive]}>Sí</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.attBtn, asistioVal === false && styles.attBtnNoActive]}
              onPress={() => setAttendance(false)}
            >
              <Text style={[styles.attBtnText, asistioVal === false && styles.attBtnTextNoActive]}>No</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Checklist */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Checklist de Temas</Text>
        </View>
        <View style={styles.checklistContainer}>
          {visibleTemplates.map(t => {
            const checked = cl[t.id] || false;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.checkItem, checked && styles.checkItemDone]}
                activeOpacity={1}
                onPress={() => {
                  if (state.hoyDate === todayStr) {
                    dispatch({ type: 'TOGGLE_CHECKLIST_ITEM', payload: { id: t.id, value: !checked } });
                  } else {
                    dispatch({ type: 'TOGGLE_DAILY_CHECKLIST_ITEM', payload: { date: state.hoyDate, id: t.id, value: !checked } });
                  }
                }}
              >
                <MaterialIcons
                  name={checked ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color={checked ? colors.primary : colors['outline-variant']}
                />
                <Text style={[styles.checkText, checked && styles.checkTextDone]}>{t.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Todo */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tareas del Día</Text>
        </View>

        <View style={styles.todoInputRow}>
          <TextInput
            style={styles.todoInput}
            placeholder="Escribe una tarea..."
            placeholderTextColor={colors.outline}
            value={newTodoText}
            onChangeText={setNewTodoText}
            onSubmitEditing={addTodo}
          />
          <View style={styles.dateInputWrapper}>
            <TextInput
              style={styles.todoDateInput}
              value={newTodoDate}
              onChangeText={setNewTodoDate}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={colors.outline}
            />
            <MaterialIcons name="calendar-today" size={14} color={colors.black} style={styles.calIcon} />
          </View>
          <TouchableOpacity style={styles.todoAddBtn} onPress={addTodo}>
            <Text style={styles.todoAddBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.todoList}>
          {dayTodos.length === 0 ? (
            <Text style={styles.emptyText}>No hay tareas para esta fecha</Text>
          ) : (
            dayTodos.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[styles.todoItem, t.completed && styles.todoItemDone]}
                onPress={() => dispatch({ type: 'TOGGLE_TODO', payload: t.id })}
                activeOpacity={0.7}
              >
                  <MaterialIcons
                    name={t.completed ? 'check-circle' : 'radio-button-unchecked'}
                    size={20}
                    color={t.completed ? colors.secondary : colors.outline}
                  />
                  <Text style={[styles.todoText, t.completed && styles.todoTextDone]}>{t.text}</Text>
                <TouchableOpacity onPress={() => dispatch({ type: 'DELETE_TODO', payload: t.id })}>
                  <MaterialIcons name="close" size={20} color={colors.outline} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <ModalHorario visible={showHorarioModal} onClose={() => setShowHorarioModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
    marginTop: 150,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
    marginTop: 4,
  },
  fullDate: {
    fontSize: 24,
    fontWeight: '700',
    color: colors['on-surface'],
  },
  counters: {
    flexDirection: 'row',
    gap: 8,
  },
  counterCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  counterNum: {
    fontSize: 18,
    fontWeight: '700',
    color: colors['on-surface'],
  },
  counterLabel: {
    fontSize: 11,
    color: colors.outline,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  counterNumBlue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0d47a1',
  },
  counterLabelBlue: {
    fontSize: 11,
    color: '#0d47a1',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  counterNumPurple: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.secondary,
  },
  counterLabelPurple: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
    marginTop: -4,
    marginLeft: -12,
  },
  scheduleBtnText: {
    fontSize: 16,
    color: colors['on-surface'],
  },
  attCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    borderRadius: 12,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  attTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors['on-surface'],
  },
  attQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: colors['on-surface'],
    marginTop: 8,
  },
  attBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  attBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    backgroundColor: colors['surface-container-lowest'],
  },
  attBtnYesActive: {
    borderColor: colors.greenDark,
    backgroundColor: colors.greenDark,
  },
  attBtnNoActive: {
    borderColor: colors.error,
    backgroundColor: colors.error,
  },
  attBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors['on-surface'],
  },
  attBtnTextYesActive: {
    color: colors['on-primary'],
  },
  attBtnTextNoActive: {
    color: colors['on-primary'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors['on-surface'],
  },
  sectionCounter: {
    fontSize: 12,
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCounterBlue: {
    fontSize: 12,
    color: colors.blue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checklistContainer: {
    marginBottom: 24,
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    backgroundColor: colors['surface-container-lowest'],
    gap: 12,
  },
  checkItemDone: {
    backgroundColor: '#e8f5e9',
    borderColor: '#a5d6a7',
  },
  checkText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors['on-surface'],
  },
  checkTextDone: {
    opacity: 0.4,
    textDecorationLine: 'line-through',
  },
  todoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  todoInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    fontSize: 14,
    color: colors['on-surface'],
    backgroundColor: colors.white,
  },
  todoDateInput: {
    height: 40,
    paddingHorizontal: 12,
    paddingRight: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    fontSize: 14,
    color: colors['on-surface'],
    backgroundColor: colors.white,
    width: 140,
  },
  dateInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  calIcon: {
    position: 'absolute',
    right: 20,
  },
  todoAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.greenDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todoAddBtnText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors['on-primary'],
    lineHeight: 26,
    textAlign: 'center',
  },
  todoList: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors['outline-variant'],
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors['outline-variant'],
  },
  todoItemDone: {
    backgroundColor: '#e8f5e9',
  },
  todoText: {
    flex: 1,
    fontSize: 16,
    color: colors['on-surface'],
  },
  todoTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.outline,
    fontSize: 14,
    padding: 16,
  },
});
