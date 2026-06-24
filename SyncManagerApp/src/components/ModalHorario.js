import React from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function ModalHorario({ visible, onClose }) {
  const { state, dispatch } = useApp();

  const adjHour = (d) => {
    let h = state.hora + d;
    if (h > 12) h = 1;
    if (h < 1) h = 12;
    dispatch({ type: 'SET_HORA', payload: h });
  };

  const adjMin = (d) => {
    let m = state.minuto + d * 5;
    if (m >= 60) { m = 0; adjHour(1); }
    if (m < 0) { m = 55; adjHour(-1); }
    dispatch({ type: 'SET_MINUTO', payload: m });
  };

  const setAmPm = (p) => dispatch({ type: 'SET_PERIODO', payload: p });

  const presetTime = (h, m, p) => {
    dispatch({ type: 'SET_HORA', payload: h });
    dispatch({ type: 'SET_MINUTO', payload: m });
    dispatch({ type: 'SET_PERIODO', payload: p });
  };

  const cambiarUbicacion = (val) => dispatch({ type: 'SET_UBICACION', payload: val });

  const h24 = (state.hora % 12) + (state.periodo === 'PM' ? 12 : 0);
  let totalMin = h24 * 60 + state.minuto;
  totalMin = (totalMin - 5 + 1440) % 1440;
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  const previewH = (hh === 0 ? 12 : hh > 12 ? hh - 12 : hh).toString().padStart(2, '0');
  const previewP = hh < 12 ? 'AM' : 'PM';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={(e) => e.target === e.currentTarget && onClose()}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Configura tu reunión</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.outline} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Elige tu hora diaria para recibir el recordatorio</Text>

          <View style={styles.pickerCard}>
            <View style={styles.timePicker}>
              <View style={styles.col}>
                <TouchableOpacity onPress={() => adjHour(1)} style={styles.arrowBtn}>
                  <MaterialIcons name="expand-less" size={24} color={colors.outline} />
                </TouchableOpacity>
                <Text style={styles.timeVal}>{state.hora.toString().padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => adjHour(-1)} style={styles.arrowBtn}>
                  <MaterialIcons name="expand-more" size={24} color={colors.outline} />
                </TouchableOpacity>
              </View>
              <Text style={styles.colon}>:</Text>
              <View style={styles.col}>
                <TouchableOpacity onPress={() => adjMin(1)} style={styles.arrowBtn}>
                  <MaterialIcons name="expand-less" size={24} color={colors.outline} />
                </TouchableOpacity>
                <Text style={styles.timeVal}>{state.minuto.toString().padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => adjMin(-1)} style={styles.arrowBtn}>
                  <MaterialIcons name="expand-more" size={24} color={colors.outline} />
                </TouchableOpacity>
              </View>
              <View style={styles.ampmCol}>
                <TouchableOpacity
                  style={[styles.ampmBtn, state.periodo === 'AM' && styles.ampmActive]}
                  onPress={() => setAmPm('AM')}
                >
                  <Text style={[styles.ampmText, state.periodo === 'AM' && styles.ampmTextActive]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ampmBtn, state.periodo === 'PM' && styles.ampmActive]}
                  onPress={() => setAmPm('PM')}
                >
                  <Text style={[styles.ampmText, state.periodo === 'PM' && styles.ampmTextActive]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.preview}>
              Recordatorio configurado: {previewH}:{mm.toString().padStart(2, '0')} {previewP}
            </Text>
          </View>

          <View style={styles.presets}>
            <TouchableOpacity style={styles.preset} onPress={() => presetTime(8, 0, 'AM')}>
              <Text style={styles.presetLabel}>Temprano</Text>
              <Text style={styles.presetTime}>08:00 AM</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.preset} onPress={() => presetTime(10, 30, 'AM')}>
              <Text style={styles.presetLabel}>Media Mañana</Text>
              <Text style={styles.presetTime}>10:30 AM</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={onClose}>
            <Text style={styles.saveBtnText}>Guardar</Text>
            <MaterialIcons name="done-all" size={20} color={colors['on-secondary']} />
          </TouchableOpacity>
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
    maxHeight: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    color: colors.black,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors['on-surface-variant'],
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  pickerCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  col: {
    alignItems: 'center',
  },
  colon: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.black,
  },
  timeVal: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.black,
    width: 80,
    textAlign: 'center',
    letterSpacing: -0.02,
  },
  arrowBtn: {
    padding: 4,
    borderRadius: 8,
  },
  ampmCol: {
    gap: 2,
    marginLeft: 8,
  },
  ampmBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
  },
  ampmActive: {
    backgroundColor: colors['surface-container-high'],
  },
  ampmText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors['on-surface-variant'],
  },
  ampmTextActive: {
    color: colors['on-surface'],
  },
  preview: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.black,
    textAlign: 'center',
    marginTop: 16,
    width: '100%',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  presets: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  preset: {
    flex: 1,
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    alignItems: 'center',
  },
  presetLabel: {
    fontSize: 12,
    color: colors.outline,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  presetTime: {
    fontSize: 12,
    color: colors.black,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
  saveBtn: {
    marginTop: 24,
    height: 48,
    backgroundColor: colors.black,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors['on-secondary'],
    fontFamily: Platform.OS === 'ios' ? 'Inter' : undefined,
  },
});
