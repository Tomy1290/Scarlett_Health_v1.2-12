import { AppState } from '../store/useStore';
import { scheduleOneTimeNotification, cancelNotification } from './notifications';
import { predictNextPeriod, calculateFertileWindow } from './cycle';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AUTOMATIC CYCLE NOTIFICATIONS
 * - Period predictions
 * - Ovulation/fertile window alerts
 * - Cycle health reminders
 */

interface CycleNotification {
  id: string;
  type: 'period' | 'ovulation' | 'fertile_start' | 'fertile_end' | 'health_check';
  notificationId: string | null;
  scheduledDate: Date;
}

const CYCLE_NOTIFICATION_STORAGE_KEY = 'cycleNotifications';

/**
 * Get stored cycle notifications
 */
function getStoredCycleNotifications(): CycleNotification[] {
  try {
    const stored = localStorage.getItem(CYCLE_NOTIFICATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Store cycle notifications
 */
function storeCycleNotifications(notifications: CycleNotification[]): void {
  try {
    localStorage.setItem(CYCLE_NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('❌ Error storing cycle notifications:', error);
  }
}

/**
 * Cancel all existing cycle notifications
 */
async function cancelExistingCycleNotifications(): Promise<void> {
  const existing = getStoredCycleNotifications();
  
  for (const notification of existing) {
    if (notification.notificationId) {
      await cancelNotification(notification.notificationId);
    }
  }
  
  // Clear storage
  storeCycleNotifications([]);
  console.log('🗑️ Cancelled all existing cycle notifications');
}

/**
 * Get notification texts based on language
 */
function getNotificationTexts(type: string, language: string) {
  const texts: Record<string, Record<string, { title: string; body: string }>> = {
    period_today: {
      de: {
        title: '🩸 Periode heute erwartet',
        body: 'Deine Periode sollte heute beginnen. Vergiss nicht, sie zu tracken!'
      },
      en: {
        title: '🩸 Period expected today',
        body: 'Your period should start today. Don\'t forget to track it!'
      },
      pl: {
        title: '🩸 Okres oczekiwany dzisiaj',
        body: 'Twój okres powinien się dzisiaj rozpocząć. Nie zapomnij go śledzić!'
      }
    },
    period_tomorrow: {
      de: {
        title: '🩸 Periode morgen erwartet',
        body: 'Deine Periode beginnt wahrscheinlich morgen. Bereite dich vor!'
      },
      en: {
        title: '🩸 Period expected tomorrow',
        body: 'Your period will likely start tomorrow. Get prepared!'
      },
      pl: {
        title: '🩸 Okres oczekiwany jutro',
        body: 'Twój okres prawdopodobnie zacznie się jutro. Przygotuj się!'
      }
    },
    fertile_start: {
      de: {
        title: '🌸 Fruchtbare Phase beginnt',
        body: 'Deine fruchtbare Phase beginnt heute. Zeit für besondere Aufmerksamkeit!'
      },
      en: {
        title: '🌸 Fertile window begins',
        body: 'Your fertile window starts today. Time for special attention!'
      },
      pl: {
        title: '🌸 Rozpoczyna się okno płodności',
        body: 'Twoje okno płodności zaczyna się dzisiaj. Czas na szczególną uwagę!'
      }
    },
    ovulation: {
      de: {
        title: '🥚 Eisprung heute',
        body: 'Heute ist dein voraussichtlicher Eisprung. Höchste Fruchtbarkeit!'
      },
      en: {
        title: '🥚 Ovulation today',
        body: 'Today is your expected ovulation day. Peak fertility!'
      },
      pl: {
        title: '🥚 Owulacja dzisiaj',
        body: 'Dzisiaj jest twój przewidywany dzień owulacji. Szczyt płodności!'
      }
    },
    fertile_end: {
      de: {
        title: '🌸 Fruchtbare Phase endet',
        body: 'Deine fruchtbare Phase endet heute. Die nächste Periode ist in etwa 2 Wochen zu erwarten.'
      },
      en: {
        title: '🌸 Fertile window ending',
        body: 'Your fertile window ends today. Next period expected in about 2 weeks.'
      },
      pl: {
        title: '🌸 Koniec okna płodności',
        body: 'Twoje okno płodności kończy się dzisiaj. Następny okres oczekiwany za około 2 tygodnie.'
      }
    },
    health_check: {
      de: {
        title: '💝 Zyklus-Gesundheitscheck',
        body: 'Zeit für deinen wöchentlichen Gesundheitscheck. Wie fühlst du dich heute?'
      },
      en: {
        title: '💝 Cycle health check',
        body: 'Time for your weekly health check. How are you feeling today?'
      },
      pl: {
        title: '💝 Kontrola zdrowia cyklu',
        body: 'Czas na cotygodniową kontrolę zdrowia. Jak się dzisiaj czujesz?'
      }
    }
  };

  const lang = language === 'pl' ? 'pl' : (language === 'en' ? 'en' : 'de');
  return texts[type]?.[lang] || texts[type]?.de || { title: 'Erinnerung', body: 'Gesundheits-Erinnerung' };
}

/**
 * Schedule cycle notifications based on current cycle data
 */
export async function scheduleCycleNotifications(state: AppState): Promise<void> {
  try {
    console.log('📅 Scheduling automatic cycle notifications...');
    
    // Cancel existing notifications first
    await cancelExistingCycleNotifications();
    
    if (!state.cycles || state.cycles.length === 0) {
      console.log('⚠️ No cycle data available, skipping cycle notifications');
      return;
    }
    
    const language = state.language || 'de';
    const newNotifications: CycleNotification[] = [];
    
    // Get the most recent cycle data
    const latestCycle = state.cycles[state.cycles.length - 1];
    const nextPeriod = predictNextPeriod(state.cycles);
    
    if (nextPeriod) {
      // Schedule period notifications
      const periodDate = new Date(nextPeriod.expectedDate);
      
      // Period today notification
      const periodTodayTexts = getNotificationTexts('period_today', language);
      const periodTodayId = await scheduleOneTimeNotification(
        periodTodayTexts.title,
        periodTodayTexts.body,
        periodDate,
        'cycle'
      );
      
      if (periodTodayId) {
        newNotifications.push({
          id: `period_today_${Date.now()}`,
          type: 'period',
          notificationId: periodTodayId,
          scheduledDate: periodDate
        });
      }
      
      // Period tomorrow notification (day before)
      const periodTomorrowDate = new Date(periodDate);
      periodTomorrowDate.setDate(periodTomorrowDate.getDate() - 1);
      periodTomorrowDate.setHours(20, 0, 0, 0); // 8 PM the day before
      
      if (periodTomorrowDate > new Date()) {
        const periodTomorrowTexts = getNotificationTexts('period_tomorrow', language);
        const periodTomorrowId = await scheduleOneTimeNotification(
          periodTomorrowTexts.title,
          periodTomorrowTexts.body,
          periodTomorrowDate,
          'cycle'
        );
        
        if (periodTomorrowId) {
          newNotifications.push({
            id: `period_tomorrow_${Date.now()}`,
            type: 'period',
            notificationId: periodTomorrowId,
            scheduledDate: periodTomorrowDate
          });
        }
      }
    }
    
    // Calculate fertile window and ovulation
    if (latestCycle && latestCycle.startDate) {
      const cycleStartDate = new Date(latestCycle.startDate);
      const fertileWindow = calculateFertileWindow(cycleStartDate, latestCycle.length || 28);
      
      if (fertileWindow) {
        // Fertile window start
        const fertileStartDate = new Date(fertileWindow.start);
        fertileStartDate.setHours(9, 0, 0, 0); // 9 AM
        
        if (fertileStartDate > new Date()) {
          const fertileStartTexts = getNotificationTexts('fertile_start', language);
          const fertileStartId = await scheduleOneTimeNotification(
            fertileStartTexts.title,
            fertileStartTexts.body,
            fertileStartDate,
            'cycle'
          );
          
          if (fertileStartId) {
            newNotifications.push({
              id: `fertile_start_${Date.now()}`,
              type: 'fertile_start',
              notificationId: fertileStartId,
              scheduledDate: fertileStartDate
            });
          }
        }
        
        // Ovulation day
        const ovulationDate = new Date(fertileWindow.ovulation);
        ovulationDate.setHours(10, 0, 0, 0); // 10 AM
        
        if (ovulationDate > new Date()) {
          const ovulationTexts = getNotificationTexts('ovulation', language);
          const ovulationId = await scheduleOneTimeNotification(
            ovulationTexts.title,
            ovulationTexts.body,
            ovulationDate,
            'cycle'
          );
          
          if (ovulationId) {
            newNotifications.push({
              id: `ovulation_${Date.now()}`,
              type: 'ovulation',
              notificationId: ovulationId,
              scheduledDate: ovulationDate
            });
          }
        }
        
        // Fertile window end
        const fertileEndDate = new Date(fertileWindow.end);
        fertileEndDate.setHours(18, 0, 0, 0); // 6 PM
        
        if (fertileEndDate > new Date()) {
          const fertileEndTexts = getNotificationTexts('fertile_end', language);
          const fertileEndId = await scheduleOneTimeNotification(
            fertileEndTexts.title,
            fertileEndTexts.body,
            fertileEndDate,
            'cycle'
          );
          
          if (fertileEndId) {
            newNotifications.push({
              id: `fertile_end_${Date.now()}`,
              type: 'fertile_end',
              notificationId: fertileEndId,
              scheduledDate: fertileEndDate
            });
          }
        }
      }
    }
    
    // Weekly health check reminder (every Sunday at 11 AM)
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
    nextSunday.setHours(11, 0, 0, 0);
    
    const healthCheckTexts = getNotificationTexts('health_check', language);
    const healthCheckId = await scheduleOneTimeNotification(
      healthCheckTexts.title,
      healthCheckTexts.body,
      nextSunday,
      'cycle'
    );
    
    if (healthCheckId) {
      newNotifications.push({
        id: `health_check_${Date.now()}`,
        type: 'health_check',
        notificationId: healthCheckId,
        scheduledDate: nextSunday
      });
    }
    
    // Store the new notifications
    storeCycleNotifications(newNotifications);
    
    console.log(`✅ Scheduled ${newNotifications.length} cycle notifications`);
  } catch (error) {
    console.error('❌ Error scheduling cycle notifications:', error);
  }
}

/**
 * Update cycle notifications when cycle data changes
 */
export async function updateCycleNotifications(state: AppState): Promise<void> {
  // Reschedule all cycle notifications
  await scheduleCycleNotifications(state);
}