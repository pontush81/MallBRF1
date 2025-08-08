/**
 * Quick Test Script for Audit Logging
 * ===================================
 * 
 * Run this in browser console to test audit logging functionality
 */

import { auditLogger } from './services/auditLogger';

// Test the audit logging system
export const testAuditLogging = async () => {
  console.log('🧪 Testing Audit Logging System...');
  
  try {
    // Test 1: Log a security incident
    await auditLogger.logSecurityIncident(
      'test_incident',
      'medium',
      'This is a test security incident for audit logging verification'
    );
    console.log('✅ Test 1 passed: Security incident logged');
    
    // Test 2: Log an unauthorized access attempt
    await auditLogger.logUnauthorizedAccess(
      'users',
      'test-resource-id',
      undefined,
      'test@example.com',
      { attempted_action: 'read', blocked_reason: 'insufficient_permissions' }
    );
    console.log('✅ Test 2 passed: Unauthorized access logged');
    
    // Test 3: Log a GDPR request
    await auditLogger.logGDPRRequest(
      'testuser@example.com',
      'access',
      { request_source: 'web_form', automated_test: true }
    );
    console.log('✅ Test 3 passed: GDPR request logged');
    
    // Test 4: Get audit statistics
    const stats = await auditLogger.getAuditStats('day');
    console.log('✅ Test 4 passed: Audit stats retrieved:', stats);
    
    console.log('🎉 All audit logging tests passed!');
    
    return {
      success: true,
      message: 'Audit logging system is working correctly',
      stats
    };
    
  } catch (error) {
    console.error('❌ Audit logging test failed:', error);
    return {
      success: false,
      message: 'Audit logging system has issues',
      error
    };
  }
};

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
  (window as any).testAuditLogging = testAuditLogging;
  console.log('💡 Run window.testAuditLogging() in browser console to test audit logging');
}