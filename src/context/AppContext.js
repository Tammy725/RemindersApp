import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Linking } from 'react-native';
import { cargarEstado, guardarEstado } from '../utils/storage';
import { requestPermissions, scheduleDailyReminder } from '../utils/notifications';

const AppContext = createContext();

const initialState = {
  checklist: {},
  todos: [],
  todoIdCounter: 0,
  dailyHistory: {},
  hoyDate: new Date().toISOString().slice(0, 10),
  asistio: null,
  grabando: false,
  hora: 9,
  minuto: 30,
  periodo: 'AM',
  ubicacion: '',
  mesCal: new Date().getMonth(),
  anioCal: new Date().getFullYear(),
  diaSel: new Date().getDate(),
  equipos: [],
  equipoIdCounter: 0,
  currentUserRole: 'Admin',
  currentUserDepartment: 'todos',
  checklistTemplates: [],
  templateIdCounter: 3,
  _editingItemId: null,
  _invitarEquipoId: null,
  loaded: false,
  todayDate: new Date().toISOString().slice(0, 10),
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STATE': {
      const todayStr = new Date().toISOString().slice(0, 10);
      return { ...state, ...action.payload, hoyDate: todayStr, diaSel: new Date().getDate(), loaded: true };
    }
    case 'SET_HOY_DATE':
      return { ...state, hoyDate: action.payload };
    case 'SET_CURRENT_USER':
      return {
        ...state,
        currentUserRole: action.payload.role || state.currentUserRole,
        currentUserDepartment: action.payload.department || state.currentUserDepartment,
      };
    case 'SET_CHECKLIST':
      return { ...state, checklist: action.payload };
    case 'TOGGLE_CHECKLIST_ITEM': {
      const { id, value } = action.payload;
      return { ...state, checklist: { ...state.checklist, [id]: value } };
    }
    case 'TOGGLE_DAILY_CHECKLIST_ITEM': {
      const { date, id, value } = action.payload;
      const day = state.dailyHistory[date] || { checklist: {}, asistio: null };
      return {
        ...state,
        dailyHistory: {
          ...state.dailyHistory,
          [date]: { ...day, checklist: { ...day.checklist, [id]: value } },
        },
      };
    }
    case 'ADD_TODO': {
      const newTodo = {
        id: state.todoIdCounter,
        text: action.payload.text,
        date: action.payload.date || state.todayDate,
        department: action.payload.department || state.currentUserDepartment || 'todos',
        completed: false,
      };
      return {
        ...state,
        todos: [...state.todos, newTodo],
        todoIdCounter: state.todoIdCounter + 1,
      };
    }
    case 'TOGGLE_TODO': {
      const todos = state.todos.map(t =>
        t.id === action.payload ? { ...t, completed: !t.completed } : t
      );
      return { ...state, todos };
    }
    case 'DELETE_TODO': {
      const todos = state.todos.filter(t => t.id !== action.payload);
      return { ...state, todos };
    }
    case 'SET_ASISTIO':
      return { ...state, asistio: action.payload };
    case 'SET_DAILY_ASISTIO': {
      const { date, value } = action.payload;
      return {
        ...state,
        dailyHistory: {
          ...state.dailyHistory,
          [date]: {
            ...(state.dailyHistory[date] || { checklist: {} }),
            asistio: value,
          },
        },
      };
    }
    case 'TOGGLE_GRABANDO':
      return { ...state, grabando: !state.grabando };
    case 'SET_HORA':
      return { ...state, hora: action.payload };
    case 'SET_MINUTO':
      return { ...state, minuto: action.payload };
    case 'SET_PERIODO':
      return { ...state, periodo: action.payload };
    case 'SET_UBICACION':
      return { ...state, ubicacion: action.payload };
    case 'SET_MES_CAL':
      return { ...state, mesCal: action.payload };
    case 'SET_ANIO_CAL':
      return { ...state, anioCal: action.payload };
    case 'SET_DIA_SEL':
      return { ...state, diaSel: action.payload };
    case 'SHIFT_MONTH': {
      let m = state.mesCal + action.payload;
      let y = state.anioCal;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { ...state, mesCal: m, anioCal: y };
    }
    case 'ADD_EQUIPO': {
      const equipo = {
        id: state.equipoIdCounter,
        name: action.payload,
        miembros: [],
      };
      return {
        ...state,
        equipos: [...state.equipos, equipo],
        equipoIdCounter: state.equipoIdCounter + 1,
      };
    }
    case 'DELETE_EQUIPO':
      return { ...state, equipos: state.equipos.filter(e => e.id !== action.payload) };
    case 'ADD_MIEMBRO': {
      const { equipoId, telefono, email, rol } = action.payload;
      const equipos = state.equipos.map(e => {
        if (e.id === equipoId) {
          return {
            ...e,
            miembros: [
              ...e.miembros,
              { telefono: telefono || email, rol, fecha: new Date().toISOString().slice(0, 10) },
            ],
          };
        }
        return e;
      });
      return { ...state, equipos };
    }
    case 'DELETE_MIEMBRO': {
      const { equipoId, idx } = action.payload;
      const equipos = state.equipos.map(e => {
        if (e.id === equipoId) {
          const miembros = [...e.miembros];
          miembros.splice(idx, 1);
          return { ...e, miembros };
        }
        return e;
      });
      return { ...state, equipos };
    }
    case 'ADD_CHECKLIST_TEMPLATE': {
      const newItem = {
        id: state.templateIdCounter,
        title: action.payload.title,
        department: action.payload.department,
        details: action.payload.details || '',
      };
      return {
        ...state,
        checklistTemplates: [...state.checklistTemplates, newItem],
        templateIdCounter: state.templateIdCounter + 1,
      };
    }
    case 'EDIT_CHECKLIST_TEMPLATE': {
      const { id, title, details } = action.payload;
      return {
        ...state,
        checklistTemplates: state.checklistTemplates.map(t =>
          t.id === id ? { ...t, title: title !== undefined ? title : t.title, details: details !== undefined ? details : t.details } : t
        ),
        _editingItemId: null,
      };
    }
    case 'SET_CHECKLIST_DETAILS': {
      const { id, details } = action.payload;
      return {
        ...state,
        checklistTemplates: state.checklistTemplates.map(t =>
          t.id === id ? { ...t, details } : t
        ),
      };
    }
    case 'DELETE_CHECKLIST_TEMPLATE':
      return {
        ...state,
        checklistTemplates: state.checklistTemplates.filter(t => t.id !== action.payload),
        _editingItemId: null,
      };
    case 'SET_EDITING_ITEM':
      return { ...state, _editingItemId: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleInviteUrl = useCallback((url) => {
    if (!url) return;
    try {
      const [, queryString = ''] = url.split('?');
      const params = new URLSearchParams(queryString);
      const role = params.get('role');
      const department = params.get('department');
      if (role && department) {
        dispatch({
          type: 'SET_CURRENT_USER',
          payload: {
            role,
            department,
          },
        });
      }
    } catch (e) {
      // ignore invalid invite links
    }
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await cargarEstado();
      dispatch({ type: 'SET_STATE', payload: saved });
    })();
  }, []);

  useEffect(() => {
    if (!state.loaded) return undefined;

    Linking.getInitialURL().then(handleInviteUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleInviteUrl(url);
    });

    return () => subscription.remove();
  }, [handleInviteUrl, state.loaded]);

  // Persist on every state change after initial load
  useEffect(() => {
    if (state.loaded) {
      guardarEstado(state);
    }
  }, [state, state.loaded]);

  // Schedule daily notification when meeting time changes
  useEffect(() => {
    if (!state.loaded) return;
    (async () => {
      const granted = await requestPermissions();
      if (granted) {
        await scheduleDailyReminder(state.hora, state.minuto, state.periodo);
      }
    })();
  }, [state.hora, state.minuto, state.periodo, state.loaded]);

  const saveTodayHistory = useCallback(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (!state.dailyHistory[todayStr]) {
      state.dailyHistory[todayStr] = { checklist: {}, asistio: null };
    }
    state.dailyHistory[todayStr].checklist = { ...state.checklist };
    state.dailyHistory[todayStr].asistio = state.asistio;
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch, saveTodayHistory }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

export default AppContext;
