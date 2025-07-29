import supabaseClient from './supabaseClient';

interface AuditLogEntry {
  user_id?: string;
  user_email?: string;
  table_name: string;
  access_type: 'read' | 'write' | 'delete' | 'export';
  record_id?: string;
  data_categories: string[];
  purpose: string;
  legal_basis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interest' | 'public_task' | 'legitimate_interest';
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
}

class AuditLogService {
  private static instance: AuditLogService;
  private isEnabled: boolean = true;

  private constructor() {}

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  /**
   * Log a data access operation
   */
  public async logAccess(entry: AuditLogEntry): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      // Ensure required fields have defaults
      const enhancedEntry = {
        ...entry,
        data_categories: entry.data_categories || ['personal_data'],
        purpose: entry.purpose || 'system_operation',
        legal_basis: entry.legal_basis || 'legitimate_interest',
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        session_id: entry.session_id || this.generateUUID(),
        created_at: new Date().toISOString()
      };

      // Use service role client for logging (bypasses RLS)
      const { error } = await supabaseClient
        .from('data_access_log')
        .insert(enhancedEntry);

      if (error) {
        console.error('Failed to log audit entry:', error);
        console.error('Attempted to log:', enhancedEntry);
        // Don't throw error - audit failures shouldn't break normal operations
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      // Silently fail - audit is important but shouldn't break user experience
    }
  }

  /**
   * Log data access with current user context
   */
  public async logUserAccess(
    tableName: string,
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    recordId?: string,
    purpose?: string
  ): Promise<void> {
    try {
      // Get current user from local storage
      const currentUserData = localStorage.getItem('currentUser');
      let user_id: string | undefined;
      let user_email: string | undefined;

      if (currentUserData) {
        const user = JSON.parse(currentUserData);
        // Only set user_id if it's a valid UUID format, otherwise leave undefined
        if (user.id && typeof user.id === 'string' && user.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          user_id = user.id;
        }
        user_email = user.email;
      }

      // Map old operations to new access types
      const accessTypeMap = {
        'SELECT': 'read' as const,
        'INSERT': 'write' as const,
        'UPDATE': 'write' as const,
        'DELETE': 'delete' as const
      };

      // Determine data categories based on table
      const getDataCategories = (table: string): string[] => {
        if (table === 'users') return ['personal_data', 'contact_info'];
        if (table === 'bookings') return ['personal_data', 'financial_data'];
        if (table === 'pages') return ['content_data'];
        return ['system_data'];
      };

      await this.logAccess({
        user_id,
        user_email,
        table_name: tableName,
        access_type: accessTypeMap[operation],
        record_id: recordId,
        data_categories: getDataCategories(tableName),
        purpose: purpose || `${operation.toLowerCase()}_operation`,
        legal_basis: 'legitimate_interest'
      });
    } catch (error) {
      console.error('Error logging user access:', error);
    }
  }

  /**
   * Log anonymous access (for public operations)
   */
  public async logAnonymousAccess(
    tableName: string,
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    recordId?: string,
    purpose?: string
  ): Promise<void> {
    // Map operations and determine categories (same logic as above)
    const accessTypeMap = {
      'SELECT': 'read' as const,
      'INSERT': 'write' as const,
      'UPDATE': 'write' as const,
      'DELETE': 'delete' as const
    };

    const getDataCategories = (table: string): string[] => {
      if (table === 'users') return ['personal_data', 'contact_info'];
      if (table === 'bookings') return ['personal_data', 'financial_data'];
      if (table === 'pages') return ['content_data'];
      return ['system_data'];
    };

    await this.logAccess({
      table_name: tableName,
      access_type: accessTypeMap[operation],
      record_id: recordId,
      data_categories: getDataCategories(tableName),
      purpose: purpose || 'public_access',
      legal_basis: 'legitimate_interest'
    });
  }

  /**
   * Log GDPR-related data access
   */
  public async logGDPRAccess(
    email: string,
    operation: string,
    recordId?: string
  ): Promise<void> {
    await this.logAccess({
      user_email: email,
      table_name: 'gdpr_requests_log',
      access_type: 'read',
      record_id: recordId,
      data_categories: ['personal_data', 'sensitive_data'],
      purpose: `gdpr_${operation}`,
      legal_basis: 'legal_obligation'
    });
  }

  /**
   * Get client IP address (best effort)
   */
  private async getClientIP(): Promise<string | undefined> {
    try {
      // In a real production environment, you might want to use a service
      // For now, we'll return undefined as IP detection in browser is limited
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Generate UUID with fallback for older browsers
   */
  private generateUUID(): string {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
    } catch (error) {
      // Fallback for older browsers
    }
    
    // Simple UUID v4 fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Enable or disable audit logging
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`Audit logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if audit logging is enabled
   */
  public isAuditEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Batch log multiple operations (for efficiency)
   */
  public async logBatch(entries: AuditLogEntry[]): Promise<void> {
    if (!this.isEnabled || entries.length === 0) {
      return;
    }

    try {
      const enhancedEntries = entries.map(entry => ({
        ...entry,
        data_categories: entry.data_categories || ['system_data'],
        purpose: entry.purpose || 'batch_operation',
        legal_basis: entry.legal_basis || 'legitimate_interest',
        user_agent: navigator.userAgent,
        session_id: entry.session_id || this.generateUUID(),
        created_at: new Date().toISOString()
      }));

      const { error } = await supabaseClient
        .from('data_access_log')
        .insert(enhancedEntries);

      if (error) {
        console.error('Failed to log batch audit entries:', error);
      }
    } catch (error) {
      console.error('Batch audit logging error:', error);
    }
  }

  /**
   * Create audit log entry for data export/download
   */
  public async logDataExport(
    tableName: string,
    recordCount: number,
    exportFormat: string,
    userEmail?: string
  ): Promise<void> {
    // Determine data categories based on table
    const getDataCategories = (table: string): string[] => {
      if (table === 'users') return ['personal_data', 'contact_info'];
      if (table === 'bookings') return ['personal_data', 'financial_data'];
      if (table === 'pages') return ['content_data'];
      return ['system_data'];
    };

    await this.logAccess({
      user_email: userEmail,
      table_name: tableName,
      access_type: 'export',
      data_categories: getDataCategories(tableName),
      purpose: `data_export_${exportFormat}_${recordCount}_records`,
      legal_basis: 'legitimate_interest'
    });
  }
}

// Export singleton instance
export const auditLogService = AuditLogService.getInstance();

// Convenience functions for common operations
export const logUserAccess = (
  tableName: string,
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  recordId?: string,
  purpose?: string
) => auditLogService.logUserAccess(tableName, operation, recordId, purpose);

export const logAnonymousAccess = (
  tableName: string,
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  recordId?: string,
  purpose?: string
) => auditLogService.logAnonymousAccess(tableName, operation, recordId, purpose);

export const logGDPRAccess = (
  email: string,
  operation: string,
  recordId?: string
) => auditLogService.logGDPRAccess(email, operation, recordId);

export default auditLogService; 