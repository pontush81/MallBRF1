/**
 * Audit Logging Service
 * ====================
 * 
 * Comprehensive audit logging for all authentication and sensitive operations.
 * Based on Perplexity recommendation: "Use Supabase's logging features or set up 
 * triggers/functions to record significant auth events"
 * 
 * GDPR Compliance: All logs include legal basis for data processing
 */

import supabase from './supabaseClient';

// Audit Event Types
export type AuditEventType = 
  | 'auth_login_success'
  | 'auth_login_failure'
  | 'auth_logout'
  | 'auth_session_refresh'
  | 'auth_password_reset'
  | 'auth_email_change'
  | 'user_profile_access'
  | 'user_profile_update'
  | 'admin_action'
  | 'data_export'
  | 'data_deletion'
  | 'gdpr_request'
  | 'security_incident'
  | 'privilege_escalation_attempt'
  | 'unauthorized_access_attempt'
  | 'system_error';

// Risk Levels
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Legal Basis for GDPR Compliance
export type LegalBasis = 
  | 'consent'
  | 'contract'
  | 'legal_obligation'
  | 'vital_interests'
  | 'public_task'
  | 'legitimate_interests';

export interface AuditLogEntry {
  event_type: AuditEventType;
  action?: string;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  resource_type?: string;
  resource_id?: string;
  action_details: Record<string, any>;
  risk_level: RiskLevel;
  legal_basis: LegalBasis;
  success: boolean;
  error_message?: string;
  session_id?: string;
  timestamp?: string; // ISO string
}

/**
 * Main Audit Logger Class
 */
export class AuditLogger {
  private static instance: AuditLogger;
  private isEnabled: boolean = true;

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log Authentication Events
   */
  async logAuthEvent(
    eventType: AuditEventType,
    userId?: string,
    userEmail?: string,
    success: boolean = true,
    additionalData?: Record<string, any>
  ): Promise<void> {
    if (!this.isEnabled) return;

    const entry: AuditLogEntry = {
      event_type: eventType,
      action: this.getActionFromEventType(eventType, success),
      user_id: userId,
      user_email: userEmail,
      ip_address: await this.getClientIP(),
      user_agent: this.getUserAgent(),
      action_details: {
        ...additionalData,
        timestamp: new Date().toISOString(),
        auth_provider: 'supabase'
      },
      risk_level: this.calculateRiskLevel(eventType, success),
      legal_basis: 'legitimate_interests', // Security monitoring
      success,
      session_id: await this.getSessionId()
    };

    await this.writeAuditLog(entry);
  }

  /**
   * Log Admin Actions
   */
  async logAdminAction(
    userId: string,
    userEmail: string,
    action: string,
    resourceType?: string,
    resourceId?: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    if (!this.isEnabled) return;

    const entry: AuditLogEntry = {
      event_type: 'admin_action',
      user_id: userId,
      user_email: userEmail,
      ip_address: await this.getClientIP(),
      user_agent: this.getUserAgent(),
      resource_type: resourceType,
      resource_id: resourceId,
      action_details: {
        action,
        ...additionalData,
        admin_session: true
      },
      risk_level: 'high', // Admin actions are high risk
      legal_basis: 'legitimate_interests',
      success: true
    };

    await this.writeAuditLog(entry);
  }

  /**
   * Log GDPR Data Subject Requests
   */
  async logGDPRRequest(
    userEmail: string,
    requestType: 'access' | 'rectification' | 'erasure' | 'portability',
    additionalData?: Record<string, any>
  ): Promise<void> {
    if (!this.isEnabled) return;

    const entry: AuditLogEntry = {
      event_type: 'gdpr_request',
      user_email: userEmail,
      ip_address: await this.getClientIP(),
      user_agent: this.getUserAgent(),
      action_details: {
        request_type: requestType,
        ...additionalData
      },
      risk_level: 'medium',
      legal_basis: 'legal_obligation', // GDPR compliance
      success: true
    };

    await this.writeAuditLog(entry);
  }

  /**
   * Log Security Incidents
   */
  async logSecurityIncident(
    incidentType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    userId?: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    if (!this.isEnabled) return;

    const entry: AuditLogEntry = {
      event_type: 'security_incident',
      user_id: userId,
      ip_address: await this.getClientIP(),
      user_agent: this.getUserAgent(),
      action_details: {
        incident_type: incidentType,
        severity,
        description,
        ...additionalData,
        requires_notification: severity === 'critical' || severity === 'high'
      },
      risk_level: severity as RiskLevel,
      legal_basis: 'legitimate_interests',
      success: true
    };

    await this.writeAuditLog(entry);

    // Auto-trigger security incident in database if critical
    if (severity === 'critical') {
      await this.createSecurityIncidentRecord(incidentType, severity, description, additionalData);
    }
  }

  /**
   * Log Unauthorized Access Attempts
   */
  async logUnauthorizedAccess(
    resourceType: string,
    resourceId: string,
    userId?: string,
    userEmail?: string,
    attemptDetails?: Record<string, any>
  ): Promise<void> {
    if (!this.isEnabled) return;

    const entry: AuditLogEntry = {
      event_type: 'unauthorized_access_attempt',
      user_id: userId,
      user_email: userEmail,
      ip_address: await this.getClientIP(),
      user_agent: this.getUserAgent(),
      resource_type: resourceType,
      resource_id: resourceId,
      action_details: {
        ...attemptDetails,
        blocked_by: 'RLS_policy',
        threat_level: 'potential'
      },
      risk_level: 'high',
      legal_basis: 'legitimate_interests',
      success: false // Unauthorized access should always be false
    };

    await this.writeAuditLog(entry);

    // Check for repeated attempts from same IP/user
    await this.checkForSuspiciousActivity(userId, userEmail);
  }

  /**
   * Log Data Access (for GDPR Article 30 compliance)
   */
  async logDataAccess(
    userId: string,
    userEmail: string,
    tableName: string,
    accessType: 'read' | 'write' | 'delete',
    recordCount?: number,
    legalBasis: LegalBasis = 'legitimate_interests'
  ): Promise<void> {
    if (!this.isEnabled) return;

    // Use the existing data_access_log table structure
    const { error } = await supabase
      .from('data_access_log')
      .insert({
        user_id: userId,
        user_email: userEmail,
        table_name: tableName,
        access_type: accessType,
        record_count: recordCount || 1,
        ip_address: await this.getClientIP(),
        user_agent: this.getUserAgent(),
        legal_basis: legalBasis
      });

    if (error) {
      console.error('Failed to log data access:', error);
    }
  }

  /**
   * Write audit log entry to database
   */
  private async writeAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      // Use the existing audit_logs table or create new audit_logs_v2 table
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          event_type: entry.event_type,
          user_id: entry.user_id,
          user_email: entry.user_email,
          ip_address: entry.ip_address,
          user_agent: entry.user_agent,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          action_details: entry.action_details,
          risk_level: entry.risk_level,
          legal_basis: entry.legal_basis,
          success: entry.success,
          error_message: entry.error_message,
          session_id: entry.session_id
        });

      if (error) {
        console.error('Audit logging failed:', error);
        // Don't throw error - we don't want audit failures to break app functionality
      }
    } catch (error) {
      console.error('Critical audit logging error:', error);
    }
  }

  /**
   * Calculate risk level based on event type and success
   */
  private calculateRiskLevel(eventType: AuditEventType, success: boolean): RiskLevel {
    // Failed auth events are higher risk
    if (!success && eventType.includes('auth')) {
      return 'high';
    }

    switch (eventType) {
      case 'auth_login_failure':
      case 'unauthorized_access_attempt':
      case 'privilege_escalation_attempt':
        return 'high';
      
      case 'security_incident':
        return 'critical';
      
      case 'admin_action':
      case 'data_deletion':
      case 'gdpr_request':
        return 'medium';
      
      default:
        return 'low';
    }
  }

  /**
   * Get action description from event type
   */
  private getActionFromEventType(eventType: AuditEventType, success: boolean): string {
    const prefix = success ? 'successful' : 'failed';
    
    switch (eventType) {
      case 'auth_login_success':
      case 'auth_login_failure':
        return success ? 'successful_login' : 'failed_login';
      case 'auth_logout':
        return 'logout';
      case 'unauthorized_access_attempt':
        return 'unauthorized_access_attempt';
      case 'admin_action':
        return 'admin_action';
      case 'data_access':
        return 'data_access';
      case 'gdpr_request':
        return 'gdpr_request';
      case 'security_incident':
        return 'security_incident';
      default:
        return `${prefix}_${eventType}`;
    }
  }

  /**
   * Get client IP address
   */
  private async getClientIP(): Promise<string | null> {
    try {
      // In production, this would get real client IP from headers
      // For now, return null since we don't have real IP detection
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get user agent string
   */
  private getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  }

  /**
   * Get current session ID
   */
  private async getSessionId(): Promise<string | undefined> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token?.slice(-8); // Last 8 chars as session identifier
    } catch {
      return undefined;
    }
  }

  /**
   * Create security incident record for critical events
   */
  private async createSecurityIncidentRecord(
    type: string,
    severity: string,
    description: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_incidents')
        .insert({
          type,
          severity,
          description,
          discovery_time: new Date().toISOString(),
          status: 'open',
          additional_data: additionalData
        });

      if (error) {
        console.error('Failed to create security incident record:', error);
      }
    } catch (error) {
      console.error('Error creating security incident:', error);
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  private async checkForSuspiciousActivity(userId?: string, userEmail?: string): Promise<void> {
    try {
      // Check for repeated failed attempts in last 15 minutes
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      const { data: recentAttempts, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('event_type', 'unauthorized_access_attempt')
        .gte('created_at', fifteenMinutesAgo.toISOString())
        .or(userId ? `user_id.eq.${userId}` : `user_email.eq.${userEmail}`);

      if (error) {
        console.error('Error checking suspicious activity:', error);
        return;
      }

      if (recentAttempts && recentAttempts.length >= 5) {
        // 5+ unauthorized attempts in 15 minutes = suspicious
        await this.logSecurityIncident(
          'repeated_unauthorized_access',
          'high',
          `User ${userEmail || userId} made ${recentAttempts.length} unauthorized access attempts in 15 minutes`,
          userId, // Pass userId as string, not object
          {
            user_email: userEmail,
            attempt_count: recentAttempts.length,
            time_window: '15_minutes',
            recommendation: 'Consider temporary account lock'
          }
        );
      }
    } catch (error) {
      console.error('Error in suspicious activity check:', error);
    }
  }

  /**
   * Disable audit logging (for testing or maintenance)
   */
  disable(): void {
    this.isEnabled = false;
    console.warn('🚨 Audit logging has been DISABLED');
  }

  /**
   * Enable audit logging
   */
  enable(): void {
    this.isEnabled = true;
    console.log('✅ Audit logging enabled');
  }

  /**
   * Get audit statistics for admin dashboard
   */
  async getAuditStats(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    total_events: number;
    auth_events: number;
    admin_actions: number;
    security_incidents: number;
    failed_events: number;
    high_risk_events: number;
  }> {
    try {
      const timeframeDays = { hour: 1/24, day: 1, week: 7, month: 30 };
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - timeframeDays[timeframe]);

      const { data: stats, error } = await supabase
        .from('audit_logs')
        .select('event_type, success, risk_level')
        .gte('created_at', startTime.toISOString());

      if (error || !stats) {
        throw new Error('Failed to fetch audit stats');
      }

      return {
        total_events: stats.length,
        auth_events: stats.filter(s => s.event_type.includes('auth')).length,
        admin_actions: stats.filter(s => s.event_type === 'admin_action').length,
        security_incidents: stats.filter(s => s.event_type === 'security_incident').length,
        failed_events: stats.filter(s => !s.success).length,
        high_risk_events: stats.filter(s => ['high', 'critical'].includes(s.risk_level)).length
      };
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      return {
        total_events: 0,
        auth_events: 0,
        admin_actions: 0,
        security_incidents: 0,
        failed_events: 0,
        high_risk_events: 0
      };
    }
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

// Convenience functions for common logging scenarios
export const logLogin = async (userId: string, userEmail: string, success: boolean = true) => {
  await auditLogger.logAuthEvent('auth_login_success', userId, userEmail, success);
};

export const logLogout = async (userId: string, userEmail: string) => {
  await auditLogger.logAuthEvent('auth_logout', userId, userEmail, true);
};

export const logAdminAccess = async (userId: string, userEmail: string, resource: string) => {
  await auditLogger.logAdminAction(userId, userEmail, 'access', resource);
};