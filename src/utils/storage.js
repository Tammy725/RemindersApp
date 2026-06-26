import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDateString } from './dates';

const STORE_KEY = 'syncmanager_state';

export function estadoBase() {
  const today = new Date();
  const todayStr = localDateString(today);
  return {
    checklist: { '0': false, '1': false, '2': false },
    todos: [],
    todoIdCounter: 0,
    dailyHistory: {},
    hoyDate: todayStr,
    asistio: null,
    grabando: false,
    hora: 9,
    minuto: 30,
    periodo: 'AM',
    ubicacion: '',
    mesCal: today.getMonth(),
    anioCal: today.getFullYear(),
    diaSel: today.getDate(),
    equipos: [],
    equipoIdCounter: 0,
    currentUserRole: 'Admin',
    currentUserDepartment: 'todos',
    checklistTemplates: [
      { id: 0, title: 'Feedback Semanal', department: 'todos', details: '', date: '' },
      { id: 1, title: 'Objetivos Q4', department: 'todos', details: '', date: '' },
      { id: 2, title: 'Bloqueos Críticos', department: 'todos', details: '', date: '' },
    ],
    templateIdCounter: 3,
    _editingItemId: null,
  };
}

export async function cargarEstado() {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const base = estadoBase();
      for (let k in base) {
        if (parsed[k] === undefined) parsed[k] = base[k];
      }
      // Migrate old todos format (boolean array) to new format
      if (
        Array.isArray(parsed.todos) &&
        parsed.todos.length > 0 &&
        typeof parsed.todos[0] === 'boolean'
      ) {
        const oldTexts = [
          'Preparar reporte de incidencias',
          'Enviar invitación Sync trimestral',
          'Actualizar documentación de procesos',
        ];
        const todayStr = localDateString();
        parsed.todos = parsed.todos.map((done, i) => ({
          id: i,
          text: oldTexts[i] || 'Tarea ' + (i + 1),
          date: todayStr,
          department: 'todos',
          completed: done,
        }));
        parsed.todoIdCounter = parsed.todos.length;
      }
      if (Array.isArray(parsed.todos)) {
        parsed.todos = parsed.todos.map(todo => ({
          department: 'todos',
          ...todo,
        }));
      }
      // Migrate old checklist array (boolean[]) to object {id: bool}
      if (Array.isArray(parsed.checklist)) {
        const obj = {};
        parsed.checklist.forEach((val, idx) => { obj[idx] = val; });
        parsed.checklist = obj;
      }
      if (parsed.dailyHistory) {
        for (const dateStr of Object.keys(parsed.dailyHistory)) {
          const entry = parsed.dailyHistory[dateStr];
          if (entry.checklist && Array.isArray(entry.checklist)) {
            const obj = {};
            entry.checklist.forEach((val, idx) => { obj[idx] = val; });
            entry.checklist = obj;
          }
        }
      }
      return parsed;
    }
  } catch (e) {
    // ignore
  }
  return estadoBase();
}

export async function guardarEstado(state) {
  const todayStr = localDateString();
  if (!state.dailyHistory[todayStr]) {
    state.dailyHistory[todayStr] = { checklist: {}, asistio: null };
  }
  state.dailyHistory[todayStr].checklist = { ...state.checklist };
  state.dailyHistory[todayStr].asistio = state.asistio;
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(state));
}
