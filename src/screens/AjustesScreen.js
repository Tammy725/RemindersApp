
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, ScrollView, StyleSheet, Platform, Linking, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';
import ModalChecklist from '../components/ModalChecklist';

const APP_INVITE_LINK = 'syncmanager://invite';
const APP_DOWNLOAD_LINK = 'https://expo.dev/client';

export default function AjustesScreen() {
  const { state, dispatch } = useApp();
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showEquipoModal, setShowEquipoModal] = useState(false);
  const [showInvitarModal, setShowInvitarModal] = useState(false);
  const [newEquipoName, setNewEquipoName] = useState('');
  const [invitarTelefono, setInvitarTelefono] = useState('');
  const [invitarRol, setInvitarRol] = useState('Miembro');
  const [invitarEquipoId, setInvitarEquipoId] = useState(null);

  const isAdmin = state.currentUserRole === 'Admin';
  const visibleEquipos = state.currentUserDepartment === 'todos'
    ? state.equipos
    : state.equipos.filter(eq => eq.name === state.currentUserDepartment);

  const addEquipo = () => {
    if (!newEquipoName.trim()) return;
    dispatch({ type: 'ADD_EQUIPO', payload: newEquipoName.trim() });
    setNewEquipoName('');
    setShowEquipoModal(false);
  };

  const enviarInvitacion = async () => {
    const telefono = invitarTelefono.trim();
    if (!telefono || invitarEquipoId === null) return;

    const equipo = state.equipos.find(eq => eq.id === invitarEquipoId);
    const department = equipo?.name || 'todos';
    const inviteLink = `${APP_INVITE_LINK}?role=${encodeURIComponent(invitarRol)}&department=${encodeURIComponent(department)}`;
    const mensaje = `Te invitaron a SyncManager como ${invitarRol} de ${department}. Abre la app aquí: ${inviteLink}. Si no la tienes instalada, descárgala aquí: ${APP_DOWNLOAD_LINK}`;
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const smsUrl = `sms:${telefono}${separator}body=${encodeURIComponent(mensaje)}`;

    dispatch({
      type: 'ADD_MIEMBRO',
      payload: { equipoId: invitarEquipoId, telefono, rol: invitarRol },
    });
    setInvitarTelefono('');
    setShowInvitarModal(false);

    const canOpenSms = await Linking.canOpenURL(smsUrl);
    if (canOpenSms) {
      await Linking.openURL(smsUrl);
    } else {
      Alert.alert('No se pudo abrir Mensajes', 'Revisa que este dispositivo pueda enviar SMS.');
    }
  };

  return (
    <View style={styles.container}>
      <TopBar title="Ajustes" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>T</Text>
            </View>
            <View>
              <Text style={styles.profileName}>Tammyshabetay</Text>
              <Text style={styles.profileEmail}>tammy@shabetay.com</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{state.currentUserRole}</Text>
              </View>
            </View>
          </View>
          {isAdmin && (
            <TouchableOpacity style={styles.editChecklistBtn} onPress={() => setShowChecklistModal(true)}>
              <MaterialIcons name="edit" size={18} color={colors.outline} />
              <Text style={styles.editChecklistLabel}>Editar{"\n"}Checklist</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Equipos */}
        <View style={styles.equiposSection}>
          <View style={styles.equiposHeader}>
            <Text style={styles.equiposTitle}>Equipos / Departamentos</Text>
            {isAdmin && (
              <TouchableOpacity style={styles.addEquipoBtn} onPress={() => setShowEquipoModal(true)}>
                <Text style={styles.addEquipoBtnText}>Agregar equipo</Text>
                <MaterialIcons name="add" size={16} color={colors.outline} />
              </TouchableOpacity>
            )}
          </View>

          {state.equipos.length === 0 ? (
            <Text style={styles.emptyEquipos}>No hay equipos aún. Crea tu primer equipo.</Text>
          ) : (
            visibleEquipos.map(eq => (
              <View key={eq.id} style={styles.equipoCard}>
                <View style={styles.equipoHeader}>
                  <Text style={styles.equipoName}>{eq.name}</Text>
                  {isAdmin && (
                    <View style={styles.equipoActions}>
                      <TouchableOpacity
                        style={styles.equipoActionBtn}
                        onPress={() => {
                          setInvitarEquipoId(eq.id);
                          setInvitarTelefono('');
                          setShowInvitarModal(true);
                        }}
                      >
                        <MaterialIcons name="person-add" size={16} color={colors.outline} />
                        <Text style={styles.invitarBtnText}>Invitar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => dispatch({ type: 'DELETE_EQUIPO', payload: eq.id })}
                      >
                        <MaterialIcons name="delete" size={18} color={colors.outline} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                {eq.miembros.length === 0 ? (
                  <Text style={styles.emptyMiembros}>Sin miembros aún. Invita personas por número de teléfono.</Text>
                ) : (
                  eq.miembros.map((m, idx) => {
                    const contacto = m.telefono || m.email || '';
                    return (
                      <View key={idx} style={styles.miembroRow}>
                        <View style={styles.miembroLeft}>
                          <View style={styles.miembroAvatar}>
                            <Text style={styles.miembroAvatarText}>{contacto[0]?.toUpperCase()}</Text>
                          </View>
                          <View>
                            <Text style={styles.miembroEmail}>{contacto}</Text>
                            <Text style={styles.miembroMeta}>{m.rol} • {m.fecha}</Text>
                          </View>
                        </View>
                        {isAdmin && (
                          <TouchableOpacity
                            onPress={() => dispatch({ type: 'DELETE_MIEMBRO', payload: { equipoId: eq.id, idx } })}
                          >
                            <MaterialIcons name="close" size={16} color={colors.outline} />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <ModalChecklist visible={showChecklistModal} onClose={() => setShowChecklistModal(false)} />

      {/* Modal Equipo */}
      <Modal visible={showEquipoModal} transparent animationType="fade" onRequestClose={() => setShowEquipoModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={(e) => e.target === e.currentTarget && setShowEquipoModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo equipo</Text>
              <TouchableOpacity onPress={() => setShowEquipoModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.outline} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Nombre del departamento o equipo</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Recursos Humanos, Ventas, Logística..."
              placeholderTextColor={colors.outline}
              value={newEquipoName}
              onChangeText={setNewEquipoName}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={addEquipo}>
              <Text style={styles.saveBtnText}>Guardar</Text>
              <MaterialIcons name="done-all" size={20} color={colors['on-secondary']} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Invitar */}
      <Modal visible={showInvitarModal} transparent animationType="fade" onRequestClose={() => setShowInvitarModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={(e) => e.target === e.currentTarget && setShowInvitarModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invitar miembro</Text>
              <TouchableOpacity onPress={() => setShowInvitarModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.outline} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Número de teléfono"
              placeholderTextColor={colors.outline}
              value={invitarTelefono}
              onChangeText={setInvitarTelefono}
              keyboardType="phone-pad"
            />
            <Text style={styles.inputLabel}>Rol</Text>
            <View style={styles.rolRow}>
              <TouchableOpacity
                style={[styles.rolChip, invitarRol === 'Miembro' && styles.rolChipActive]}
                onPress={() => setInvitarRol('Miembro')}
              >
                <Text style={[styles.rolChipText, invitarRol === 'Miembro' && styles.rolChipTextActive]}>Miembro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rolChip, invitarRol === 'Admin' && styles.rolChipActive]}
                onPress={() => setInvitarRol('Admin')}
              >
                <Text style={[styles.rolChipText, invitarRol === 'Admin' && styles.rolChipTextActive]}>Admin</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={enviarInvitacion}>
              <Text style={styles.saveBtnText}>Enviar invitación</Text>
              <MaterialIcons name="send" size={20} color={colors['on-secondary']} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1, marginTop: 150 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  profileCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    borderRadius: 12,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors['surface-container-highest'],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors['outline-variant'],
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: colors.outline },
  profileName: { fontSize: 24, fontWeight: '600', color: colors['on-surface'] },
  profileEmail: { fontSize: 16, color: colors.outline },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 50,
    backgroundColor: 'rgba(0,108,73,0.1)',
  },
  roleBadgeText: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  editChecklistBtn: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 12,
  },
  editChecklistLabel: {
    fontSize: 10,
    lineHeight: 13,
    color: colors['on-surface'],
    textAlign: 'center',
    marginTop: 2,
  },
  equiposSection: { gap: 16 },
  equiposHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  equiposTitle: { fontSize: 24, fontWeight: '600', color: colors['on-surface'] },
  addEquipoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addEquipoBtnText: { fontSize: 11, fontWeight: '500', color: colors.outline },
  emptyEquipos: { fontSize: 16, color: colors.outline, textAlign: 'center', paddingVertical: 32 },
  equipoCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    borderRadius: 12,
    padding: 24,
  },
  equipoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  equipoName: { fontSize: 24, fontWeight: '600', color: colors['on-surface'] },
  equipoActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  equipoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
  },
  invitarBtnText: { fontSize: 12, color: colors.outline },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emptyMiembros: { fontSize: 16, color: colors.outline },
  miembroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors['surface-container-low'],
    borderRadius: 8,
    marginBottom: 8,
  },
  miembroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miembroAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors['surface-container-highest'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  miembroAvatarText: { fontSize: 14, fontWeight: '600', color: colors.outline },
  miembroEmail: { fontSize: 16, color: colors['on-surface'] },
  miembroMeta: { fontSize: 12, color: colors.outline },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxWidth: 600,
    width: '100%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 24, fontWeight: '600', color: colors['on-surface'] },
  inputLabel: {
    fontSize: 12,
    color: colors.outline,
    fontWeight: '500',
    marginBottom: 4,
  },
  modalInput: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors['on-surface'],
    marginBottom: 16,
  },
  rolRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  rolChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
  },
  rolChipActive: { backgroundColor: colors['surface-container-highest'], borderColor: colors['outline-variant'] },
  rolChipText: { fontSize: 14, color: colors['on-surface-variant'] },
  rolChipTextActive: { color: colors.black, fontWeight: '600' },
  saveBtn: {
    height: 44,
    backgroundColor: colors.black,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
});
