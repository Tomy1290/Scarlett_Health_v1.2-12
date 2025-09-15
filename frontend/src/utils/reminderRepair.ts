import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { useAppStore } from '../store/useStore';
import { initializeNotifications, getScheduledNotifications, scheduleDailyNext } from './notifications';
import { parseHHMM } from './time';

const TASK_NAME = 'REMINDER_REPAIR_TASK';

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    // Do not prompt in background; only proceed if permissions already granted
    const perm = await Notifications.getPermissionsAsync();
    if (perm.status !== 'granted') {
      return BackgroundFetch.Result.NoData;
    }
    await initializeNotifications();

    const state = useAppStore.getState();
    const enabledReminders = (state.reminders || []).filter((r) => r.enabled);

    const scheduled = await getScheduledNotifications();
    const scheduledIds = new Set(scheduled.map((n: any) => n.identifier));

    let repaired = 0;
    for (const r of enabledReminders) {
      const meta = state.notificationMeta[r.id];
      const time = r.time;
      const t = parseHHMM(time);
      if (!t) continue;
      const hasValid = meta?.id ? scheduledIds.has(meta.id) : false;
      if (!hasValid) {
        const title = r.label || (state.language==='en' ? 'Reminder' : (state.language==='pl' ? 'Przypomnienie' : 'Erinnerung'));
        const nid = await scheduleDailyNext(r.id, title, '', t.hour, t.minute, 'reminders');
        if (nid) { state.setNotificationMeta(r.id, { id: nid, time }); repaired++; }
      }
    }

    if (repaired > 0) {
      console.log(`🛠️ Reminder repair scheduled ${repaired} missing notifications`);
      return BackgroundFetch.Result.NewData;
    }
    return BackgroundFetch.Result.NoData;
  } catch (e) {
    console.error('❌ Reminder repair task error', e);
    return BackgroundFetch.Result.Failed;
  }
});

export async function registerReminderRepairBackgroundTask(minimumIntervalSeconds: number = 1800) {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.Status.Restricted || status === BackgroundFetch.Status.Denied) {
      console.log('⚠️ BackgroundFetch not available');
      return;
    }
    const tasks = await TaskManager.getRegisteredTasksAsync();
    const exists = tasks.find((t) => t.taskName === TASK_NAME);
    if (!exists) {
      await BackgroundFetch.registerTaskAsync(TASK_NAME, { minimumInterval: minimumIntervalSeconds, stopOnTerminate: false, startOnBoot: true });
      console.log('✅ Registered Reminder repair background task');
    } else {
      console.log('ℹ️ Reminder repair background task already registered');
    }
  } catch (e) { console.error('❌ Error registering background task', e); }
}