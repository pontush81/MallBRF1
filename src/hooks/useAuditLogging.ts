/**
 * React Hook for Audit Logging
 * ============================
 * 
 * Easy-to-use React hooks for component-level audit logging
 */

import { useCallback } from 'react';
import { auditLogger, AuditEventType } from '../services/auditLogger';
import { useAuth } from '../context/AuthContextNew';

export const useAuditLogging = () => {
  const { currentUser } = useAuth();

  const logEvent = useCallback(async (
    eventType: AuditEventType,
    success: boolean = true,
    additionalData?: Record<string, any>
  ) => {
    if (!currentUser) return;
    
    await auditLogger.logAuthEvent(
      eventType,
      currentUser.id,
      currentUser.email,
      success,
      additionalData
    );
  }, [currentUser]);

  const logAdminAction = useCallback(async (
    action: string,
    resourceType?: string,
    resourceId?: string,
    additionalData?: Record<string, any>
  ) => {
    if (!currentUser) return;
    
    await auditLogger.logAdminAction(
      currentUser.id,
      currentUser.email,
      action,
      resourceType,
      resourceId,
      additionalData
    );
  }, [currentUser]);

  const logDataAccess = useCallback(async (
    tableName: string,
    accessType: 'read' | 'write' | 'delete',
    recordCount?: number
  ) => {
    if (!currentUser) return;
    
    await auditLogger.logDataAccess(
      currentUser.id,
      currentUser.email,
      tableName,
      accessType,
      recordCount
    );
  }, [currentUser]);

  const logUnauthorizedAccess = useCallback(async (
    resourceType: string,
    resourceId: string,
    attemptDetails?: Record<string, any>
  ) => {
    await auditLogger.logUnauthorizedAccess(
      resourceType,
      resourceId,
      currentUser?.id,
      currentUser?.email,
      attemptDetails
    );
  }, [currentUser]);

  return {
    logEvent,
    logAdminAction,
    logDataAccess,
    logUnauthorizedAccess,
    isLoggingEnabled: !!currentUser
  };
};