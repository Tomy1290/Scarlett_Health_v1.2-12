import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

/**
 * NEW NOTIFICATION SYSTEM v1.2.9
 * - No notification blocking/suppression
 * - Clean permission handling  
 * - Automatic cycle/ovulation notifications
 * - Manual reminders from settings
 * - Android TimePicker integration ready
 */

// Configure notification handler to allow all notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    console.log('🔔 Requesting notification permissions...');
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('📋 Current permission status:', existingStatus);
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      console.log('📋 Permission request result:', status);
      return status === 'granted';
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Setup Android notification channels
 */
export async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  
  try {
    console.log('📱 Setting up Android notification channels...');
    
    // Main reminders channel
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Erinnerungen',
      description: 'Tabletten, Sport, Gewicht und andere Erinnerungen',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      lightColor: '#FF2D87',
      showBadge: true,
    });
    
    // Cycle notifications channel  
    await Notifications.setNotificationChannelAsync('cycle', {
      name: 'Zyklus & Gesundheit',
      description: 'Automatische Zyklus-, Eisprung- und Gesundheitsbenachrichtigungen',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      enableVibrate: true,
      vibrationPattern: [0, 500, 250, 500],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      lightColor: '#FF69B4',
      showBadge: true,
    });
    
    console.log('✅ Android channels setup complete');
  } catch (error) {
    console.error('❌ Error setting up Android channels:', error);
  }
}

/**
 * Initialize notification system
 */
export async function initializeNotifications(): Promise<boolean> {
  try {
    console.log('🚀 Initializing notification system...');
    
    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) {
      console.warn('⚠️ No notification permissions granted');
      return false;
    }
    
    await setupAndroidChannels();
    console.log('✅ Notification system initialized');
    return true;
  } catch (error) {
    console.error('❌ Error initializing notifications:', error);
    return false;
  }
}

/**
 * Schedule a daily reminder
 */
export async function scheduleDailyReminder(
  id: string,
  title: string, 
  body: string,
  hour: number,
  minute: number,
  channel: 'reminders' | 'cycle' = 'reminders'
): Promise<string | null> {
  try {
    console.log(`📅 Scheduling daily reminder: ${id} at ${hour}:${minute}`);
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && { channelId: channel }),
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
    
    console.log(`✅ Scheduled notification: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('❌ Error scheduling daily reminder:', error);
    return null;
  }
}

/**
 * Schedule a one-time notification
 */
export async function scheduleOneTimeNotification(
  title: string,
  body: string, 
  date: Date,
  channel: 'reminders' | 'cycle' = 'cycle'
): Promise<string | null> {
  try {
    if (date <= new Date()) {
      console.warn('⚠️ Cannot schedule notification in the past');
      return null;
    }
    
    console.log(`📅 Scheduling one-time notification for: ${date.toISOString()}`);
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && { channelId: channel }),
      },
      trigger: {
        date,
      },
    });
    
    console.log(`✅ Scheduled one-time notification: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('❌ Error scheduling one-time notification:', error);
    return null;
  }
}

/**
 * Cancel notification by ID
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`🗑️ Cancelled notification: ${notificationId}`);
  } catch (error) {
    console.error('❌ Error cancelling notification:', error);
  }
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🗑️ Cancelled all notifications');
  } catch (error) {
    console.error('❌ Error cancelling all notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📋 Found ${notifications.length} scheduled notifications`);
    return notifications;
  } catch (error) {
    console.error('❌ Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Test notification system
 */
export async function testNotification(): Promise<void> {
  try {
    console.log('🧪 Testing notification system...');
    
    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) {
      Alert.alert('Fehler', 'Benachrichtigungen sind nicht erlaubt. Bitte in den Geräteeinstellungen aktivieren.');
      return;
    }
    
    await setupAndroidChannels();
    
    // Schedule test notification for 3 seconds from now
    const testDate = new Date();
    testDate.setSeconds(testDate.getSeconds() + 3);
    
    const notificationId = await scheduleOneTimeNotification(
      '✅ Test erfolgreich!',
      'Benachrichtigungen funktionieren. Du kannst jetzt Erinnerungen einrichten.',
      testDate,
      'reminders'
    );
    
    if (notificationId) {
      Alert.alert(
        '🧪 Test gestartet',
        'Eine Test-Benachrichtigung wird in 3 Sekunden angezeigt.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Fehler', 'Test-Benachrichtigung konnte nicht geplant werden');
    }
  } catch (error) {
    console.error('❌ Error testing notifications:', error);
    Alert.alert('Fehler', `Test fehlgeschlagen: ${error.message}`);
  }
}

// Legacy function aliases for compatibility
export const ensureNotificationPermissions = requestNotificationPermissions;
export const ensureAndroidChannel = setupAndroidChannels;