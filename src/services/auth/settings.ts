import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { NotificationSettings, defaultNotificationSettings } from '../../types/Settings';

// Get notification settings from Firestore
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'notifications'));
    
    if (settingsDoc.exists()) {
      return settingsDoc.data() as NotificationSettings;
    } else {
      // If the settings don't exist, return default values
      return defaultNotificationSettings;
    }
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    // On error, return default values
    return defaultNotificationSettings;
  }
}

// Update notification settings in Firestore
export async function updateNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    // Ensure lastUpdated is set
    const updatedSettings = {
      ...settings,
      lastUpdated: new Date().toISOString()
    };
    
    // Write to Firestore
    await setDoc(doc(db, 'settings', 'notifications'), updatedSettings);
    console.log('Notification settings updated successfully');
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
}

// Send email notification for new user registration
export async function sendNewUserNotification(user: any): Promise<boolean> {
  try {
    const settings = await getNotificationSettings();
    
    // If notifications are disabled or no email is set, skip sending
    if (!settings.newUserNotifications || !settings.notificationEmail) {
      console.log('New user notifications are disabled or no notification email is set');
      return false;
    }
    
    // Since we're in a client environment, we need to use a server endpoint to send emails
    const response = await fetch('/api/notifications/new-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'true'
      },
      body: JSON.stringify({
        email: settings.notificationEmail,
        user: {
          name: user.name || 'Ny användare',
          email: user.email,
          createdAt: user.createdAt
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }
    
    console.log('New user notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending new user notification:', error);
    return false;
  }
} 