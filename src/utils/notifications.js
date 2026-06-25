import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function convertTo24h(hora, minuto, periodo) {
  let h = hora;
  if (periodo === 'PM' && h !== 12) h += 12;
  if (periodo === 'AM' && h === 12) h = 0;
  return { hour24: h, minute: minuto };
}

export function calcReminderTime(hora, minuto, periodo) {
  const { hour24, minute } = convertTo24h(hora, minuto, periodo);
  let totalMin = hour24 * 60 + minute;
  totalMin = (totalMin - 5 + 1440) % 1440;
  return {
    hour: Math.floor(totalMin / 60),
    minute: totalMin % 60,
  };
}

export function formatTime(hora, minuto, periodo) {
  const { hour24, minute } = convertTo24h(hora, minuto, periodo);
  const h12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const p = hour24 < 12 ? 'AM' : 'PM';
  return `${h12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${p}`;
}

export async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return false;
  }
  return true;
}

export async function scheduleDailyReminder(hora, minuto, periodo) {
  await cancelAllReminders();

  const { hour, minute } = calcReminderTime(hora, minuto, periodo);
  const meetingTime = formatTime(hora, minuto, periodo);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Recordatorio de reunión',
      body: `Tu reunión comienza en 5 minutos (${meetingTime})`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}

export async function cancelAllReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .filter(n => n.content.title === 'Recordatorio de reunión')
    .map(n => n.identifier);
  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}
