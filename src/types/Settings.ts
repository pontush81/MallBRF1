export interface NotificationSettings {
  newUserNotifications: boolean;
  notificationEmail: string;
  lastUpdated: string;
}

export interface Settings {
  notifications: NotificationSettings;
}

export const defaultNotificationSettings: NotificationSettings = {
  newUserNotifications: false,
  notificationEmail: '',
  lastUpdated: new Date().toISOString()
}; 