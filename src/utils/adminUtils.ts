import { toast } from 'react-hot-toast';
import { SUPABASE_ANON_KEY } from '../config';
import { User } from '../types/User';

export interface AdminUtilsProps {
  isMobile?: boolean;
}

export const adminUtils = {
  
  /**
   * Skapa och skicka säkerhetskopia
   */
  async createBackup(options: AdminUtilsProps = {}): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await fetch(`https://qhdgqevdmvkrwnzpwikz.supabase.co/functions/v1/send-backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          tables: ['bookings'],
          includeFiles: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backup response error:', errorText);
        throw new Error('Kunde inte skicka backup');
      }

      const data = await response.json();
      
      // Visa framgångsmeddelande
      toast.success(`Backup skickad! ${data.bookingCount} bokningar exporterades.`, {
        duration: 4000,
        position: options.isMobile ? 'bottom-center' : 'top-right',
      });

      return {
        success: true,
        message: `Backup skickad! ${data.bookingCount} bokningar exporterades.`,
        data
      };

    } catch (error) {
      console.error('Fel vid backup:', error);
      
      const errorMessage = 'Kunde inte skicka backup';
      toast.error(errorMessage, {
        duration: 4000, 
        position: options.isMobile ? 'bottom-center' : 'top-right',
      });

      return {
        success: false,
        message: errorMessage
      };
    }
  },

  /**
   * Skapa och skicka HSB-rapport
   */
  async createHsbReport(month?: number, year?: number, currentUser?: User | null, options: AdminUtilsProps = {}): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('Startar HSB-rapport med SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'finns' : 'saknas');
      
      const monthParam = month ? `&month=${month}` : '';
      const yearParam = year ? `&year=${year}` : '';
      const userParam = currentUser ? `&reporterName=${encodeURIComponent(currentUser.name || currentUser.email)}` : '';
      const response = await fetch(`https://qhdgqevdmvkrwnzpwikz.supabase.co/functions/v1/hsb-form-v2?format=excel&sendEmail=true${monthParam}${yearParam}${userParam}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });

      console.log('HSB response status:', response.status);
      console.log('HSB response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HSB response error:', errorText);
        
        let errorMessage = 'Kunde inte skapa HSB-rapport';
        if (response.status === 401) {
          errorMessage = 'Auktoriseringsfel - kontakta administratör';
        } else if (response.status === 500) {
          errorMessage = 'Serverfel vid HSB-rapport';
        }
        
        toast.error(errorMessage, {
          duration: 4000,
          position: options.isMobile ? 'bottom-center' : 'top-right',
        });
        
        return {
          success: false,
          message: errorMessage
        };
      }

      const successMessage = 'HSB-rapport skapad och skickad via e-post!';
      toast.success(successMessage, {
        duration: 4000,
        position: options.isMobile ? 'bottom-center' : 'top-right',
      });

      return {
        success: true,
        message: successMessage
      };

    } catch (error) {
      console.error('Fel vid HSB-rapport:', error);
      
      let errorMessage = 'Kunde inte skapa HSB-rapport';
      if (error instanceof TypeError) {
        errorMessage = 'Nätverksfel - kontrollera internetanslutning';
      }
      
      toast.error(errorMessage, {
        duration: 4000,
        position: options.isMobile ? 'bottom-center' : 'top-right',
      });

      return {
        success: false,
        message: errorMessage
      };
    }
  },

  /**
   * Skapa backup med specifikt format och nedladdning
   */
  async createBackupWithFormat(
    format: 'json' | 'excel' | 'pdf', 
    sendEmail: boolean = false,
    options: AdminUtilsProps = {}
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const url = `https://qhdgqevdmvkrwnzpwikz.supabase.co/functions/v1/send-backup?format=${format}${sendEmail ? '&sendEmail=true' : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backup response error:', errorText);
        throw new Error('Kunde inte skapa backup');
      }

      let successMessage = `Backup (${format.toUpperCase()}) skapad`;
      if (sendEmail) {
        successMessage += ' och skickad via e-post';
      } else {
        successMessage += ' och nedladdad';
      }
      successMessage += '!';

      toast.success(successMessage, {
        duration: 4000,
        position: options.isMobile ? 'bottom-center' : 'top-right',
      });

      // För nedladdning (om inte skickas via e-post)
      if (!sendEmail) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `backup-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }

      return {
        success: true,
        message: successMessage
      };

    } catch (error) {
      console.error('Fel vid backup:', error);
      
      const errorMessage = 'Kunde inte skapa backup';
      toast.error(errorMessage, {
        duration: 4000,
        position: options.isMobile ? 'bottom-center' : 'top-right',
      });

      return {
        success: false,
        message: errorMessage
      };
    }
  },

  /**
   * Skapa HSB-rapport med specifikt format (för admin-sidan)
   */
  async createHsbReportWithFormat(
    format: 'excel' | 'pdf', 
    sendEmail: boolean = false,
    month?: number,
    year?: number,
    currentUser?: User | null,
    options: AdminUtilsProps = {}
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const monthParam = month ? `&month=${month}` : '';
      const yearParam = year ? `&year=${year}` : '';
      const userParam = currentUser ? `&reporterName=${encodeURIComponent(currentUser.name || currentUser.email)}` : '';
      const url = `https://qhdgqevdmvkrwnzpwikz.supabase.co/functions/v1/hsb-form-v2?format=${format}${sendEmail ? '&sendEmail=true' : ''}${monthParam}${yearParam}${userParam}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HSB response error:', errorText);
        throw new Error('Kunde inte skapa HSB-rapport');
      }

      let successMessage = `HSB-rapport (${format.toUpperCase()}) skapad`;
      if (sendEmail) {
        successMessage += ' och skickad via e-post';
      }
      successMessage += '!';

      toast.success(successMessage, {
        duration: 4000,
        position: options.isMobile ? 'bottom-center' : 'top-right',
      });

      // För nedladdning (om inte skickas via e-post)
      if (!sendEmail) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `HSB-rapport-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }

      return {
        success: true,
        message: successMessage
      };

    } catch (error) {
      console.error('Fel vid HSB-rapport:', error);
      
      const errorMessage = 'Kunde inte skapa HSB-rapport';
      toast.error(errorMessage, {
        duration: 4000,
        position: options.isMobile ? 'bottom-center' : 'top-right',
      });

      return {
        success: false,
        message: errorMessage
      };
    }
  }
}; 