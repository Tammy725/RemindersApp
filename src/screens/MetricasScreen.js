import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import colors from '../theme/colors';
import { useApp } from '../context/AppContext';
import TopBar from '../components/TopBar';

export default function MetricasScreen() {
  const { state } = useApp();
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();

  const { pctAsistencia, meetingAttended, meetingDays, pctTareas, todoCompleted, todoTotal, pctChecklist, checkDone, checkTotal, streak } = useMemo(() => {
    const canViewDepartment = (department) => (
      state.currentUserDepartment === 'todos' ||
      !department ||
      department === 'todos' ||
      department === state.currentUserDepartment
    );

    // Asistencia
    let mDays = 0;
    let mAttended = 0;
    for (const [dateStr, entry] of Object.entries(state.dailyHistory)) {
      const d = new Date(dateStr);
      if (d.getMonth() === month && d.getFullYear() === year && entry.asistio !== null && entry.asistio !== undefined) {
        mDays++;
        if (entry.asistio) mAttended++;
      }
    }
    const pctA = mDays > 0 ? Math.round((mAttended / mDays) * 100) : 0;

    // Tareas
    const monthStr = year + '-' + (month + 1).toString().padStart(2, '0');
    const mTodos = state.todos.filter(
      t => t.date && t.date.startsWith(monthStr) && canViewDepartment(t.department),
    );
    const tComp = mTodos.filter(t => t.completed).length;
    const tTotal = mTodos.length;
    const pctT = tTotal > 0 ? Math.round((tComp / tTotal) * 100) : 0;

    // Checklist
    let cDone = 0;
    let cTotal = 0;
    const templateIds = state.checklistTemplates
      .filter(t => canViewDepartment(t.department))
      .map(t => t.id);
    for (const [dateStr, entry] of Object.entries(state.dailyHistory)) {
      const d = new Date(dateStr);
      if (d.getMonth() === month && d.getFullYear() === year && entry.checklist) {
        cTotal += templateIds.length;
        templateIds.forEach(tid => {
          if (entry.checklist[tid]) cDone++;
        });
      }
    }
    const currentDay = today.getDate();
    if (cTotal === 0) {
      cTotal = templateIds.length * currentDay;
      cDone = 0;
    }
    const pctC = cTotal > 0 ? Math.round((cDone / cTotal) * 100) : 0;

    // Racha
    let s = 0;
    let cursor = new Date(today);
    while (true) {
      const key = cursor.toISOString().slice(0, 10);
      const entry = state.dailyHistory[key];
      if (entry && entry.asistio === true) {
        s++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      pctAsistencia: pctA,
      meetingAttended: mAttended,
      meetingDays: mDays,
      pctTareas: pctT,
      todoCompleted: tComp,
      todoTotal: tTotal,
      pctChecklist: pctC,
      checkDone: cDone,
      checkTotal: cTotal,
      streak: s,
    };
  }, [state]);

  return (
    <View style={styles.container}>
      <TopBar title="Metricas" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Charts */}
        <View style={styles.chartGrid}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Asistencia a Reuniones</Text>
            <View style={styles.ringContainer}>
              <Svg width={160} height={160} viewBox="0 0 42 42">
                <Circle cx="21" cy="21" r="15.9155" fill="none" stroke="#d4d4d4" strokeWidth="3.5" />
                <Circle
                  cx="21"
                  cy="21"
                  r="15.9155"
                  fill="none"
                  stroke={colors.navy}
                  strokeWidth="3.5"
                  strokeDasharray={`${pctAsistencia} ${100 - pctAsistencia}`}
                  strokeLinecap="round"
                  transform="rotate(-90, 21, 21)"
                />
              </Svg>
              <Text style={styles.ringText}>{pctAsistencia}%</Text>
            </View>
            <Text style={styles.ringDetail}>{meetingAttended} / {meetingDays} reuniones realizadas</Text>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Tareas y Checklist</Text>
            <View style={styles.barSection}>
              <View style={styles.barHeader}>
                <Text style={styles.barLabel}>Tareas</Text>
                <Text style={styles.barPct}>{pctTareas}%</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pctTareas}%` }]} />
              </View>
              <Text style={styles.barDetail}>{todoCompleted} / {todoTotal} completadas</Text>
            </View>
            <View style={styles.barSection}>
              <View style={styles.barHeader}>
                <Text style={styles.barLabel}>Checklist</Text>
                <Text style={styles.barPct}>{pctChecklist}%</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pctChecklist}%` }]} />
              </View>
              <Text style={styles.barDetail}>{checkDone} / {checkTotal} completadas</Text>
            </View>
          </View>
        </View>

        {/* Download Report */}
        <TouchableOpacity style={styles.reportBtn} onPress={() => alert('Generando reporte PDF...')}>
          <Text style={styles.reportBtnText}>DESCARGAR REPORTE PDF</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { flex: 1, marginTop: 150 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  kpiCard: {
    width: '47%',
    backgroundColor: colors['surface-container-lowest'],
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors['on-surface-variant'],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 30,
    fontWeight: '600',
    color: colors.navy,
  },
  kpiBadge: {
    backgroundColor: colors['surface-container'],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 50,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  kpiBadgeText: {
    fontSize: 11,
    color: colors['on-surface-variant'],
  },
  chartGrid: {
    gap: 24,
    marginBottom: 24,
  },
  chartCard: {
    backgroundColor: colors['surface-container-lowest'],
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 24,
  },
  barSection: {
    marginBottom: 32,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 12,
    color: colors['on-surface-variant'],
  },
  barPct: {
    fontSize: 12,
    fontWeight: '600',
    color: colors['on-surface-variant'],
  },
  barTrack: {
    height: 12,
    backgroundColor: colors['surface-container'],
    borderRadius: 50,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.navy,
    borderRadius: 50,
  },
  barDetail: {
    fontSize: 11,
    color: colors.outline,
    marginTop: 4,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  ringText: {
    position: 'absolute',
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
  },
  ringDetail: {
    textAlign: 'center',
    fontSize: 11,
    color: colors['on-surface-variant'],
  },
  reportBtn: {
    backgroundColor: colors.black,
    paddingVertical: 12,
    borderRadius: 13,
    alignItems: 'center',
    marginBottom: 8,
  },
  reportBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
  },
});
