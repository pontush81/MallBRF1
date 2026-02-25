import { toast } from 'react-hot-toast';
import { SUPABASE_ANON_KEY } from '../config';

export interface AdminUtilsProps {
  isMobile?: boolean;
}

export const adminUtils = {

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
        link.download = `backup-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'tsv' : format}`;
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
  }
};