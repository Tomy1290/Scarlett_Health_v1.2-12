import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

// Configure notification handler to allow all notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let listenersBound = false;

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true, allowAnnouncements: true },
        android: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      return status === 'granted';
    }
    return true;
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return false;
  }
}

export async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Erinnerungen', description: 'Tabletten, Sport, Gewicht und andere Erinnerungen',
      importance: Notifications.AndroidImportance.HIGH, sound: 'default', enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250], lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      lightColor: '#FF2D87', showBadge: true,
    });
    await Notifications.setNotificationChannelAsync('cycle', {
      name: 'Zyklus & Gesundheit', description: 'Automatische Zyklus-, Eisprung- und Gesundheitsbenachrichtigungen',
      importance: Notifications.AndroidImportance.HIGH, sound: 'default', enableVibrate: true,
      vibrationPattern: [0, 500, 250, 500], lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      lightColor: '#FF69B4', showBadge: true,
    });
  } catch (error) { console.error('❌ Error setting up Android channels:', error); }
}

export async function initializeNotifications(): Promise<boolean> {
  try {
    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) return false;
    await setupAndroidChannels();
    return true;
  } catch (error) { console.error('❌ Error initializing notifications:', error); return false; }
}

// Compute the next occurrence in the future for hour:minute (today or tomorrow)
export function computeNextOccurrence(hour: number, minute: number): Date {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (+next <= +now) { next.setDate(next.getDate() + 1); }
  return next;
}

// Schedule a ONE-TIME reminder at the next occurrence – prevents immediate firing on some devices
export async function scheduleDailyNext(
  id: string,
  title: string,
  body: string,
  hour: number,
  minute: number,
  channel: 'reminders' | 'cycle' = 'reminders'
): Promise<string | null> {
  try {
    const when = computeNextOccurrence(hour, minute);
    const nid = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default', priority: Notifications.AndroidNotificationPriority.HIGH, ...(Platform.OS === 'android' && { channelId: channel }), data: { reminderId: id, hour, minute } },
      trigger: { date: when },
    });
    return nid;
  } catch (e) { console.error('❌ scheduleDailyNext error:', e); return null; }
}

export async function scheduleOneTimeNotification(title: string, body: string, date: Date, channel: 'reminders' | 'cycle' = 'cycle'): Promise<string | null> {
  try {
    if (date <= new Date()) return null;
    const nid = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default', priority: Notifications.AndroidNotificationPriority.HIGH, ...(Platform.OS === 'android' && { channelId: channel }) },
      trigger: { date },
    });
    return nid;
  } catch (e) { console.error('❌ scheduleOneTimeNotification error:', e); return null; }
}

// Auto-reschedule daily reminders after they fire (on receive or when user interacts)
export function setupDailyAutoReschedule() {
  if (listenersBound) return; // prevent multiple
  try {
    Notifications.addNotificationReceivedListener(async (n) => {
      try {
        const d: any = n.request.content.data || {};
        if (d && d.reminderId && typeof d.hour === 'number' && typeof d.minute === 'number') {
          const when = computeNextOccurrence(d.hour, d.minute);
          await Notifications.scheduleNotificationAsync({
            content: { ...n.request.content, data: d },
            trigger: { date: when },
          });
        }
      } catch (e) { console.warn('reschedule(received) failed', e); }
    });
    Notifications.addNotificationResponseReceivedListener(async (resp) => {
      try {
        const d: any = resp.notification.request.content.data || {};
        if (d && d.reminderId && typeof d.hour === 'number' && typeof d.minute === 'number') {
          const when = computeNextOccurrence(d.hour, d.minute);
          await Notifications.scheduleNotificationAsync({
            content: { ...resp.notification.request.content, data: d },
            trigger: { date: when },
          });
        }
      } catch (e) { console.warn('reschedule(response) failed', e); }
    });
    listenersBound = true;
  } catch {}
}

export async function cancelNotification(notificationId: string): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(notificationId); } catch (e) { console.error('❌ cancelNotification error:', e); }
}

export async function cancelAllNotifications(): Promise<void> { try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch (e) { console.error('❌ cancelAllNotifications error:', e);} }

export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> { try { return await Notifications.getAllScheduledNotificationsAsync(); } catch { return []; } }

export async function testNotification(): Promise<void> {
  try {
    const has = await requestNotificationPermissions(); if (!has) { Alert.alert('Fehler', 'Benachrichtigungen sind nicht erlaubt.'); return; }
    await setupAndroidChannels();
    const testDate = new Date(); testDate.setSeconds(testDate.getSeconds() + 3);
    const nid = await scheduleOneTimeNotification('✅ Test erfolgreich!', 'Benachrichtigungen funktionieren.', testDate, 'reminders');
    if (nid) Alert.alert('🧪 Test gestartet', 'Eine Test-Benachrichtigung wird in 3 Sekunden angezeigt.');
  } catch (e: any) { Alert.alert('Fehler', `Test fehlgeschlagen: ${e?.message || e}`); }
}

export const ensureNotificationPermissions = requestNotificationPermissions;
export const ensureAndroidChannel = setupAndroidChannels;