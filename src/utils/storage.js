import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE_KEY = 'syncmanager_state';

export function estadoBase() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
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
      { id: 0, title: '❓ antes de escuchar', department: 'todos', details: '' },
      { id: 1, title: '👥 antes de asignar', department: 'todos', details: '' },
      { id: 2, title: '🎯 antes de priorizar', department: 'todos', details: '' },
      { id: 3, title: '👏 antes de cerrar', department: 'todos', details: '' },
      { id: 4, title: '📢 antes de compartir', department: 'todos', details: '' },
      { id: 5, title: '⚠️ antes de seguridad', department: 'todos', details: '' },
    ],
    templateIdCounter: 6,
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
        const todayStr = new Date().toISOString().slice(0, 10);
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
      // Migrate old default templates (3 items) to new ones
      if (Array.isArray(parsed.checklistTemplates) && parsed.checklistTemplates.length <= 3) {
        const oldTitles = ['Feedback Semanal', 'Objetivos Q4', 'Bloqueos Críticos'];
        const isOldDefaults = parsed.checklistTemplates.every(
          (t, i) => i < 3 && t.title === oldTitles[i]
        );
        if (isOldDefaults || parsed.checklistTemplates.length === 0) {
          parsed.checklistTemplates = [
            { id: 0, title: '❓ antes de escuchar', department: 'todos', details: '' },
            { id: 1, title: '👥 antes de asignar', department: 'todos', details: '' },
            { id: 2, title: '🎯 antes de priorizar', department: 'todos', details: '' },
            { id: 3, title: '👏 antes de cerrar', department: 'todos', details: '' },
            { id: 4, title: '📢 antes de compartir', department: 'todos', details: '' },
            { id: 5, title: '⚠️ antes de seguridad', department: 'todos', details: '' },
          ];
          parsed.templateIdCounter = 6;
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
  const todayStr = new Date().toISOString().slice(0, 10);
  if (!state.dailyHistory[todayStr]) {
    state.dailyHistory[todayStr] = { checklist: {}, asistio: null };
  }
  state.dailyHistory[todayStr].checklist = { ...state.checklist };
  state.dailyHistory[todayStr].asistio = state.asistio;
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(state));
}
