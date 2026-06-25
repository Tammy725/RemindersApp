import React, { useState, useRef, useEffect, useCallback } from 'react';
import ConfettiCannon from 'react-native-confetti-cannon';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Keyboard, Modal, Platform, Alert,
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

import colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import ModalHorario from '../components/ModalHorario';
import ModalDetalles from '../components/ModalDetalles';

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const VOICE_BACKEND_URL = process.env.EXPO_PUBLIC_VOICE_BACKEND_URL || 'http://localhost:8787';
const VOICE_DEMO_MODE = process.env.EXPO_PUBLIC_VOICE_DEMO_MODE !== 'false';

export default function HoyScreen() {
  const { state, dispatch } = useApp();
  const scrollRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const recordingRef = useRef(null);
  const [showHorarioModal, setShowHorarioModal] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceTasks, setVoiceTasks] = useState([]);
  const [voiceError, setVoiceError] = useState('');
  const [voiceDatePickerIndex, setVoiceDatePickerIndex] = useState(null);
  const [editingVoiceTaskId, setEditingVoiceTaskId] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [detallesItem, setDetallesItem] = useState(null);
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const selectedTodoDate = () => {
    const parts = newTodoDate.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
  };
  const openDatePicker = () => {
    Keyboard.dismiss();
    setShowDatePicker(true);
  };
  const handleTodoDateChange = (event, date) => {
    if (date) setNewTodoDate(formatDate(date));
    setShowDatePicker(false);
  };
  const selectedVoiceDate = () => {
    const task = voiceTasks[voiceDatePickerIndex] || {};
    const ymd = task.date || state.hoyDate;
    return new Date(`${ymd}T12:00:00`);
  };
  const updateVoiceTask = (index, patch) => {
    setVoiceTasks(tasks => tasks.map((task, i) => (
      i === index ? { ...task, ...patch } : task
    )));
  };
  const deleteVoiceTask = (index) => {
    setVoiceTasks(tasks => tasks.filter((_, i) => i !== index));
  };
  const scrollToTaskInput = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };
  const formatDate = (date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  useEffect(() => {
    const handleKeyboardShow = (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      scrollToTaskInput();
    };
    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
    };
    const willShow = Keyboard.addListener('keyboardWillShow', (e) => {
      handleKeyboardShow(e);
    });
    const didShow = Keyboard.addListener('keyboardDidShow', (e) => {
      handleKeyboardShow(e);
    });
    const willHide = Keyboard.addListener('keyboardWillHide', () => {
      handleKeyboardHide();
    });
    const didHide = Keyboard.addListener('keyboardDidHide', () => {
      handleKeyboardHide();
    });
    return () => {
      willShow.remove(); didShow.remove();
      willHide.remove(); didHide.remove();
    };
  }, []);

  const transcribeVoiceNote = async (uri) => {
    if (VOICE_DEMO_MODE) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await new Promise(resolve => setTimeout(resolve, 900));
      return [
        {
          title: 'Enviar email de seguimiento al cliente',
          date: state.hoyDate,
        },
        {
          title: 'Llamar al proveedor para confirmar la entrega',
          date: tomorrow.toISOString().slice(0, 10),
        },
        {
          title: 'Revisar y actualizar la lista de pendientes del equipo',
          date: state.hoyDate,
        },
      ];
    }

    const audioBase64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const response = await fetch(`${VOICE_BACKEND_URL}/transcribe-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64,
        mimeType: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4',
        today: new Date().toISOString().slice(0, 10),
        department: state.currentUserDepartment,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || 'No se pudo transcribir la nota de voz.');
    }
    return Array.isArray(payload.tasks) ? payload.tasks : [];
  };

  const startVoiceRecording = async () => {
    try {
      setVoiceError('');
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        dispatch({ type: 'TOGGLE_GRABANDO' });
        Alert.alert('Permiso requerido', 'Activa el permiso del micrófono para grabar tareas.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
    } catch (e) {
      recordingRef.current = null;
      if (state.grabando) dispatch({ type: 'TOGGLE_GRABANDO' });
      Alert.alert('No se pudo grabar', e.message || 'Intenta otra vez.');
    }
  };

  const stopVoiceRecording = async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    recordingRef.current = null;
    setShowVoiceModal(true);
    setVoiceLoading(true);
    setVoiceTasks([]);
    setVoiceError('');

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      const tasks = await transcribeVoiceNote(uri);
      setVoiceTasks(tasks.map((task, index) => ({
        id: `${Date.now()}-${index}`,
        title: task.title || '',
        date: task.date || state.hoyDate,
      })).filter(task => task.title.trim()));
      setEditingVoiceTaskId(null);
      if (tasks.length === 0) {
        setVoiceError('No encontré tareas claras en la nota de voz.');
      }
    } catch (e) {
      setVoiceError(e.message || 'No se pudo procesar la nota de voz.');
    } finally {
      setVoiceLoading(false);
    }
  };

  useEffect(() => {
    if (state.grabando) {
      startVoiceRecording();
    } else {
      stopVoiceRecording();
    }
  }, [state.grabando]);

  const d = new Date(state.hoyDate + 'T12:00:00');
  const dayName = DAYS[d.getDay()];
  const fullDate = `${d.getDate()} de ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
  const attTime = `${state.hora.toString().padStart(2, '0')}:${state.minuto.toString().padStart(2, '0')} ${state.periodo}`;

  const todayStr = new Date().toISOString().slice(0, 10);
  const cl = state.hoyDate === todayStr
    ? state.checklist
    : (state.dailyHistory[state.hoyDate]?.checklist || {});
  const canViewDepartment = (department) => (
    state.currentUserDepartment === 'todos' ||
    !department ||
    department === 'todos' ||
    department === state.currentUserDepartment
  );
  const visibleTemplates = state.checklistTemplates.filter(t => canViewDepartment(t.department));
  const pendingChecklist = visibleTemplates.filter(t => !cl[t.id]).length;

  const dayTodos = state.todos.filter(t => t.date === state.hoyDate && canViewDepartment(t.department));
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
    if (val === true && asistioVal !== true) {
      setShowConfetti(true);
    }
  };

  const handleConfettiEnd = useCallback(() => {
    setShowConfetti(false);
  }, []);

  const addTodo = () => {
    if (!newTodoText.trim()) return;
    dispatch({
      type: 'ADD_TODO',
      payload: {
        text: newTodoText.trim(),
        date: toYmd(newTodoDate) || state.hoyDate,
        department: state.currentUserDepartment,
      },
    });
    setNewTodoText('');
  };

  const addVoiceTasks = () => {
    const validTasks = voiceTasks.filter(task => task.title.trim());
    validTasks.forEach(task => {
      dispatch({
        type: 'ADD_TODO',
        payload: {
          text: task.title.trim(),
          date: task.date || state.hoyDate,
          department: state.currentUserDepartment,
        },
      });
    });
    setShowVoiceModal(false);
    setVoiceTasks([]);
    setVoiceError('');
    setEditingVoiceTaskId(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 96 : 140 },
          ]}
          keyboardShouldPersistTaps="always"
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={16}
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

        {/* Meeting Title */}
        <View style={styles.meetingHeader}>
          <Text style={styles.meetingTitle}>Colmenando 🐝</Text>
          <Text style={styles.meetingSubtitle}>Una dirección, un equipo, una colmena 🍯</Text>
        </View>

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
                activeOpacity={0.7}
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
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checkText, checked && styles.checkTextDone]}>{t.title}</Text>
                  {t.details ? (
                    <Text style={styles.checkDetails} numberOfLines={1} ellipsizeMode="tail">{t.details}</Text>
                  ) : null}
                </View>
                {t.details ? (
                  <TouchableOpacity onPress={() => setDetallesItem(t)} style={styles.detailsIconBtn}>
                    <Feather name="external-link" size={14} color={colors.outline} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Todo */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tareas del Día</Text>
        </View>

        <View style={styles.todoList}>
          {dayTodos.length === 0 ? (
            <Text style={styles.emptyText}>No hay tareas para esta fecha</Text>
          ) : (
            dayTodos.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[styles.todoItem, t.completed && styles.todoItemDone]}
                onPress={() => {
                  dispatch({ type: 'TOGGLE_TODO', payload: t.id });
                  if (!t.completed && pendingTodos === 1) setShowConfetti(true);
                }}
                activeOpacity={0.7}
              >
                  <MaterialIcons
                    name={t.completed ? 'check-circle' : 'radio-button-unchecked'}
                    size={20}
                    color={t.completed ? colors.secondary : colors.outline}
                  />
                  <Text style={[styles.todoText, t.completed && styles.todoTextDone]}>{t.text}</Text>
                  <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => dispatch({ type: 'DELETE_TODO', payload: t.id })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="close" size={20} color={colors.outline} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Input bar fijo - estilo WhatsApp */}
      <View style={[styles.inputBar, { bottom: keyboardHeight > 0 ? keyboardHeight : 56 }]}>
        <TextInput
          style={styles.todoInput}
          placeholder="Escribe una tarea..."
          placeholderTextColor={colors.outline}
          value={newTodoText}
          onChangeText={setNewTodoText}
          onFocus={scrollToTaskInput}
          onSubmitEditing={addTodo}
        />
        <TouchableOpacity
          style={styles.dateInputWrapper}
          onPress={openDatePicker}
          activeOpacity={0.7}
        >
          <Text style={styles.todoDateInputText}>{newTodoDate}</Text>
          <MaterialIcons name="calendar-today" size={14} color={colors.black} style={styles.calIcon} />
        </TouchableOpacity>
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={selectedTodoDate()}
            mode="date"
            display="default"
            onChange={handleTodoDateChange}
          />
        )}
        <TouchableOpacity style={styles.todoAddBtn} onPress={addTodo}>
          <Text style={styles.todoAddBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showDatePicker && Platform.OS !== 'android'}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.datePickerOverlay}
          activeOpacity={1}
          onPress={(e) => e.target === e.currentTarget && setShowDatePicker(false)}
        >
          <View style={styles.datePickerModal}>
            <DateTimePicker
              value={selectedTodoDate()}
              mode="date"
              display="inline"
              onChange={handleTodoDateChange}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showVoiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => !voiceLoading && setShowVoiceModal(false)}
      >
        <View style={styles.voiceOverlay}>
          <View style={styles.voiceModal}>
            <View style={styles.voiceHeader}>
              <Text style={styles.voiceTitle}>Lista de tareas por agregar</Text>
              {!voiceLoading && (
                <TouchableOpacity onPress={() => setShowVoiceModal(false)}>
                  <MaterialIcons name="close" size={24} color={colors.outline} />
                </TouchableOpacity>
              )}
            </View>

            {voiceLoading ? (
              <View style={styles.voiceLoadingBox}>
                <MaterialIcons name="graphic-eq" size={28} color={colors.primary} />
                <Text style={styles.voiceLoadingText}>Transcribiendo y ordenando tareas...</Text>
              </View>
            ) : (
              <>
                {voiceError ? <Text style={styles.voiceError}>{voiceError}</Text> : null}
                <ScrollView style={styles.voiceTaskList} keyboardShouldPersistTaps="handled">
                  {voiceTasks.map((task, index) => {
                    const isEditing = editingVoiceTaskId === task.id;
                    return (
                    <View key={task.id} style={styles.voiceTaskItem}>
                      <TextInput
                        style={[styles.voiceTaskInput, !isEditing && styles.voiceTaskInputReadOnly]}
                        multiline
                        editable={isEditing}
                        value={task.title}
                        onChangeText={(text) => updateVoiceTask(index, { title: text })}
                      />
                      <View style={styles.voiceTaskActions}>
                        <TouchableOpacity
                          style={styles.voiceDateBtn}
                          onPress={() => setVoiceDatePickerIndex(index)}
                        >
                          <MaterialIcons name="calendar-today" size={16} color={colors['on-surface']} />
                          <Text style={styles.voiceDateText}>{toDisplay(task.date)}</Text>
                        </TouchableOpacity>
                        <View style={styles.voiceIconActions}>
                          <TouchableOpacity
                            style={styles.voiceIconBtn}
                            onPress={() => {
                              if (isEditing) {
                                Keyboard.dismiss();
                                setEditingVoiceTaskId(null);
                              } else {
                                setEditingVoiceTaskId(task.id);
                              }
                            }}
                          >
                            <MaterialIcons
                              name={isEditing ? 'check' : 'edit'}
                              size={18}
                              color={isEditing ? colors.secondary : colors.outline}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.voiceIconBtn}
                            onPress={() => {
                              if (editingVoiceTaskId === task.id) {
                                Keyboard.dismiss();
                                setEditingVoiceTaskId(null);
                              }
                              deleteVoiceTask(index);
                            }}
                          >
                            <MaterialIcons name="delete" size={18} color={colors.outline} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                  })}
                </ScrollView>
                <TouchableOpacity
                  style={[styles.voiceSaveBtn, voiceTasks.length === 0 && styles.voiceSaveBtnDisabled]}
                  onPress={addVoiceTasks}
                  disabled={voiceTasks.length === 0}
                >
                  <Text style={styles.voiceSaveText}>Agregar tareas</Text>
                  <MaterialIcons name="done-all" size={20} color={colors['on-secondary']} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={voiceDatePickerIndex !== null && Platform.OS !== 'android'}
        transparent
        animationType="fade"
        onRequestClose={() => setVoiceDatePickerIndex(null)}
      >
        <TouchableOpacity
          style={styles.datePickerOverlay}
          activeOpacity={1}
          onPress={(e) => e.target === e.currentTarget && setVoiceDatePickerIndex(null)}
        >
          <View style={styles.datePickerModal}>
            <DateTimePicker
              value={selectedVoiceDate()}
              mode="date"
              display="inline"
              onChange={(event, date) => {
                if (date && voiceDatePickerIndex !== null) {
                  updateVoiceTask(voiceDatePickerIndex, { date: toYmd(formatDate(date)) });
                }
                setVoiceDatePickerIndex(null);
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {voiceDatePickerIndex !== null && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedVoiceDate()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            if (date) {
              updateVoiceTask(voiceDatePickerIndex, { date: toYmd(formatDate(date)) });
            }
            setVoiceDatePickerIndex(null);
          }}
        />
      )}

      <ModalHorario visible={showHorarioModal} onClose={() => setShowHorarioModal(false)} />

      {detallesItem && (
        <ModalDetalles
          visible={!!detallesItem}
          onClose={() => setDetallesItem(null)}
          title={detallesItem.title}
          details={detallesItem.details || ''}
          editable={false}
        />
      )}

      {showConfetti && (
        <ConfettiCannon
          count={80}
          origin={{ x: -30, y: 100 }}
          explosionSpeed={1000}
          fallSpeed={2000}
          fadeOut
          autoStart
          onAnimationEnd={handleConfettiEnd}
        />
      )}
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
    paddingBottom: 140,
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
  meetingHeader: {
    marginBottom: 12,
  },
  meetingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors['on-surface'],
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  meetingSubtitle: {
    fontSize: 13,
    color: colors['on-surface-variant'],
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
    marginTop: 2,
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
  checkDetails: {
    fontSize: 11,
    color: colors.outline,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
    marginTop: 2,
  },
  detailsIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors['outline-variant'],
    zIndex: 10,
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
  todoDateInputText: {
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
    lineHeight: 40,
  },
  dateInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  calIcon: {
    position: 'absolute',
    right: 20,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerModal: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 12,
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
  voiceOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  voiceModal: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '82%',
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 18,
  },
  voiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  voiceTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors['on-surface'],
  },
  voiceLoadingBox: {
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  voiceLoadingText: {
    fontSize: 15,
    color: colors.outline,
    textAlign: 'center',
  },
  voiceError: {
    fontSize: 14,
    color: colors.error,
    marginBottom: 10,
  },
  voiceTaskList: {
    maxHeight: 420,
  },
  voiceTaskItem: {
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: colors['surface-container-lowest'],
  },
  voiceTaskInput: {
    minHeight: 44,
    fontSize: 16,
    color: colors['on-surface'],
    padding: 0,
    textAlignVertical: 'top',
  },
  voiceTaskInputReadOnly: {
    color: colors['on-surface'],
  },
  voiceTaskActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  voiceDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  voiceDateText: {
    fontSize: 14,
    color: colors['on-surface'],
  },
  voiceIconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voiceIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceSaveBtn: {
    marginTop: 8,
    height: 46,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  voiceSaveBtnDisabled: {
    opacity: 0.45,
  },
  voiceSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors['on-secondary'],
  },
});
