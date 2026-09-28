import { Platform } from 'react-native';

// NOTIFICATIONS TEMPORARILY DISABLED FOR MVP TESTING
const ENABLE_NOTIFICATIONS = false;

const DAILY_CHECKIN_IDENTIFIER = 'aroha-daily-checkin-reminder';

/**
 * Configure foreground notification behavior.
 * Safe no-op when notifications are disabled for MVP testing.
 */
export function configureNotificationHandler() {
  if (!ENABLE_NOTIFICATIONS) return;
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch (err) {
    console.warn('[NotificationService] Failed to set notification handler:', err?.message);
  }
}

/**
 * Request notification permissions gracefully.
 * Safe no-op returning false when notifications are disabled for MVP testing.
 * 
 * @returns {Promise<boolean>}
 */
export async function requestNotificationPermissions() {
  if (!ENABLE_NOTIFICATIONS || Platform.OS === 'web') return false;

  try {
    const Notifications = require('expo-notifications');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Daily Wellbeing Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2D5E4E',
      });
    }

    return true;
  } catch (err) {
    console.warn('[NotificationService] Error requesting notification permissions:', err?.message);
    return false;
  }
}

/**
 * Check existing permission status without prompting.
 */
export async function hasNotificationPermissions() {
  if (!ENABLE_NOTIFICATIONS || Platform.OS === 'web') return false;
  try {
    const Notifications = require('expo-notifications');
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    return false;
  }
}

/**
 * Schedule a single daily check-in reminder.
 */
export async function scheduleDailyCheckInReminder(hour = 9, minute = 0) {
  if (!ENABLE_NOTIFICATIONS || Platform.OS === 'web') return false;
  return false;
}

/**
 * Schedule an optional missed check-in reminder.
 */
export async function scheduleMissedCheckInReminder() {
  if (!ENABLE_NOTIFICATIONS || Platform.OS === 'web') return false;
  return false;
}

/**
 * Schedule a routine reminder.
 */
export async function scheduleRoutineReminder(title = 'Daily Routine', hour = 10, minute = 0) {
  if (!ENABLE_NOTIFICATIONS || Platform.OS === 'web') return false;
  return false;
}

/**
 * Schedule an upcoming appointment reminder.
 */
export async function scheduleAppointmentReminder(date) {
  if (!ENABLE_NOTIFICATIONS || Platform.OS === 'web') return false;
  return false;
}

/**
 * Cancel ALL scheduled notifications when logging out.
 */
export async function cancelAllUserNotifications() {
  if (!ENABLE_NOTIFICATIONS || Platform.OS === 'web') return;
  try {
    const Notifications = require('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    // Silently ignore if disabled or unsupported
  }
}

/**
 * Setup notification response listener to handle user tap actions.
 */
export function setupNotificationResponseListener(onNavigate) {
  if (!ENABLE_NOTIFICATIONS || Platform.OS === 'web') return () => {};
  return () => {};
}

