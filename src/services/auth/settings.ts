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
    console.log('Försöker skicka notifikation om ny användare:', user.email);
    const settings = await getNotificationSettings();
    
    console.log('Notifikationsinställningar:', {
      enabled: settings.newUserNotifications,
      email: settings.notificationEmail
    });
    
    // Även om notifikationer är avstängda i admin-inställningarna, skicka ändå ett mail
    // med null som e-postadress, vilket får servern att använda BACKUP_EMAIL
    const targetEmail = settings.newUserNotifications ? settings.notificationEmail : null;
    
    // Since we're in a client environment, we need to use a server endpoint to send emails
    console.log('Skickar notifikation till server...');
    const response = await fetch('/api/notifications/new-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'true'
      },
      body: JSON.stringify({
        email: targetEmail,
        user: {
          name: user.name || 'Ny användare',
          email: user.email,
          createdAt: user.createdAt
        }
      })
    });
    
    const responseData = await response.json();
    console.log('Server response:', responseData);
    
    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }
    
    console.log('Notifikation skickad framgångsrikt');
    return true;
  } catch (error) {
    console.error('Error sending new user notification:', error);
    return false;
  }
}

// Send email notification to user when their account has been approved
export async function sendUserApprovalNotification(user: any): Promise<boolean> {
  try {
    console.log('Försöker skicka godkännandenotifikation till användare:', user.email);
    
    // Since we're in a client environment, we need to use a server endpoint to send emails
    console.log('Skickar godkännandenotifikation till server...');
    const response = await fetch('/api/notifications/user-approved', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': 'true'
      },
      body: JSON.stringify({
        user: {
          name: user.name || '',
          email: user.email
        }
      })
    });
    
    const responseData = await response.json();
    console.log('Server response:', responseData);
    
    if (!response.ok) {
      throw new Error(`Failed to send approval notification: ${response.statusText}`);
    }
    
    console.log('Godkännandenotifikation skickad framgångsrikt');
    return true;
  } catch (error) {
    console.error('Error sending user approval notification:', error);
    return false;
  }
} 