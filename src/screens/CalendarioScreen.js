import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const dayNames = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'];

export default function CalendarioScreen() {
  const { state, dispatch } = useApp();

  const firstDay = new Date(state.anioCal, state.mesCal, 1).getDay();
  const daysInMonth = new Date(state.anioCal, state.mesCal + 1, 0).getDate();
  const today = new Date();

  const dateStr =
    state.anioCal +
    '-' +
    (state.mesCal + 1).toString().padStart(2, '0') +
    '-' +
    state.diaSel.toString().padStart(2, '0');

  const canViewDepartment = (department) => (
    state.currentUserDepartment === 'todos' ||
    !department ||
    department === 'todos' ||
    department === state.currentUserDepartment
  );
  const visibleTemplates = state.checklistTemplates.filter(t => canViewDepartment(t.department));
  const dayHistory = state.dailyHistory[dateStr];
  const dayTodos = state.todos.filter(t => t.date === dateStr && canViewDepartment(t.department));

  const todayStr = new Date().toISOString().slice(0, 10);
  const calChecklist = dateStr === todayStr
    ? state.checklist
    : (dayHistory?.checklist || {});

  const selectDay = (d) => {
    dispatch({ type: 'SET_DIA_SEL', payload: d });
  };

  return (
    <View style={styles.container}>
      <TopBar title="Calendario" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {/* Calendar */}
          <View style={styles.calCard}>
            <View style={styles.calHeader}>
              <Text style={styles.calMonthYear}>
                {monthNames[state.mesCal]} {state.anioCal}
              </Text>
              <View style={styles.calNav}>
                <TouchableOpacity
                  style={styles.calNavBtn}
                  onPress={() => dispatch({ type: 'SHIFT_MONTH', payload: -1 })}
                >
                  <MaterialIcons name="chevron-left" size={24} color={colors['on-surface']} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.calNavBtn}
                  onPress={() => dispatch({ type: 'SHIFT_MONTH', payload: 1 })}
                >
                  <MaterialIcons name="chevron-right" size={24} color={colors['on-surface']} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.calGrid}>
              {dayNames.map(d => (
                <Text key={d} style={styles.dayName}>{d}</Text>
              ))}
              {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map((_, i) => (
                <View key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                const isToday =
                  d === today.getDate() &&
                  state.mesCal === today.getMonth() &&
                  state.anioCal === today.getFullYear();
                const isSel = d === state.diaSel;
                const dateKey =
                  state.anioCal +
                  '-' +
                  (state.mesCal + 1).toString().padStart(2, '0') +
                  '-' +
                  d.toString().padStart(2, '0');
                const hasReunion = state.dailyHistory[dateKey]?.asistio === true;
                const noReunion = state.dailyHistory[dateKey]?.asistio === false;
                const hasPendingTodos = state.todos.some(
                  t => t.date === dateKey && !t.completed && canViewDepartment(t.department),
                );

                return (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.dayCell,
                      isSel && styles.dayCellSelected,
                    ]}
                    onPress={() => selectDay(d)}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        isSel && styles.dayCellTextSelected,
                        hasPendingTodos && styles.dayCellPending,
                        isToday && !isSel && styles.dayCellToday,
                      ]}
                    >
                      {d}
                    </Text>
                    {hasReunion && (
                      <View style={[styles.dotBlack, isSel && styles.dotWhite]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Day Details */}
          <View style={styles.details}>
            <Text style={styles.detailsTitle}>Checklist de Temas</Text>
            <View style={styles.cardChecklist}>
              {visibleTemplates.length === 0 ? (
                <Text style={styles.emptyText}>No hay checklist</Text>
              ) : (
                visibleTemplates.map(item => {
                  const checked = calChecklist[item.id] || false;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.cardCheckItem, checked && styles.cardCheckItemDone]}
                      activeOpacity={1}
                      onPress={() => {
                        if (dateStr === todayStr) {
                          dispatch({ type: 'TOGGLE_CHECKLIST_ITEM', payload: { id: item.id, value: !checked } });
                        } else {
                          dispatch({ type: 'TOGGLE_DAILY_CHECKLIST_ITEM', payload: { date: dateStr, id: item.id, value: !checked } });
                        }
                      }}
                    >
                      <MaterialIcons
                        name={checked ? 'check-box' : 'check-box-outline-blank'}
                        size={20}
                        color={checked ? colors.primary : colors['outline-variant']}
                      />
                      <Text style={[styles.cardItemText, checked && styles.cardItemTextDone]}>
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            <Text style={styles.detailsTitle}>Tareas del Día</Text>
            <View style={styles.cardList}>
              {dayTodos.length === 0 ? (
                <Text style={styles.emptyText}>No hay tareas para esta fecha</Text>
              ) : (
                dayTodos.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.cardItem, t.completed && styles.cardItemDone]}
                    activeOpacity={1}
                    onPress={() => dispatch({ type: 'TOGGLE_TODO', payload: t.id })}
                  >
                    <MaterialIcons
                      name={t.completed ? 'check-circle' : 'radio-button-unchecked'}
                      size={20}
                      color={t.completed ? colors.secondary : colors.outline}
                    />
                    <Text style={[styles.cardItemText, t.completed && styles.cardItemTextDone]}>
                      {t.text}
                    </Text>
                    <TouchableOpacity onPress={() => dispatch({ type: 'DELETE_TODO', payload: t.id })}>
                      <MaterialIcons name="close" size={20} color={colors.outline} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1, marginTop: 150 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  grid: { gap: 24 },
  calCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  calMonthYear: { fontSize: 24, fontWeight: '600', color: colors.black },
  calNav: { flexDirection: 'row', gap: 4 },
  calNavBtn: { padding: 8, borderRadius: 50 },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
  dayName: {
    width: '14.28%',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 12,
    color: colors['on-surface-variant'],
    paddingVertical: 8,
  },
  dayCell: {
    width: '14.28%',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  dayCellSelected: { backgroundColor: colors['surface-container-highest'], borderRadius: 8 },
  dayCellText: { fontSize: 16, color: colors['on-surface'] },
  dayCellTextSelected: { color: colors.black, fontWeight: '700' },
  dayCellPending: { color: colors.error, fontWeight: '700' },
  dayCellToday: { fontWeight: '700' },
  dotBlack: {
    position: 'absolute',
    bottom: 2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.black,
  },
  dotWhite: {
    backgroundColor: colors.black,
  },
  details: { gap: 16 },
  detailsTitle: { fontSize: 24, fontWeight: '600', color: colors['on-surface'] },
  cardChecklist: {
    gap: 8,
  },
  cardList: {
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors['outline-variant'],
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors['outline-variant'],
  },
  cardCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    backgroundColor: colors['surface-container-lowest'],
    gap: 12,
  },
  cardItemDone: {
    backgroundColor: '#e8f5e9',
  },
  cardCheckItemDone: {
    backgroundColor: '#e8f5e9',
    borderColor: '#a5d6a7',
  },
  cardItemText: { flex: 1, fontSize: 16, color: colors['on-surface'] },
  cardItemTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  emptyText: { textAlign: 'center', color: colors.outline, fontSize: 14, padding: 16 },
});
