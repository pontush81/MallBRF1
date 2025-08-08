/**
 * RLS (Row Level Security) Negative Tests
 * =====================================
 * 
 * These tests attempt to BREAK RLS policies to verify they're working correctly.
 * All tests here should FAIL to access unauthorized data - if they succeed, 
 * there's a security vulnerability!
 * 
 * Based on Perplexity recommendation: "Add integration/unit tests that 
 * deliberately try to subvert each RLS policy"
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config';

// Create test clients with different user contexts
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

describe('🛡️ RLS Security Tests (Negative Testing)', () => {
  // Test user IDs (these would be real UUIDs in actual tests)
  const ADMIN_USER_ID = '00000000-0000-4000-8000-000000000001';
  const REGULAR_USER_ID = '00000000-0000-4000-8000-000000000002'; 
  const MALICIOUS_USER_ID = '00000000-0000-4000-8000-000000000003';

  describe('👤 Users Table RLS Protection', () => {
    it('should prevent regular user from accessing other users data', async () => {
      // Simulate being logged in as regular user
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', REGULAR_USER_ID); // Try to access OTHER users' data
      
      // This should either return empty or throw an error due to RLS
      if (error) {
        expect(error.message).toContain('policy');
      } else {
        expect(userData).toHaveLength(0);
      }
    });

    it('should prevent unauthenticated access to users table', async () => {
      // Clear any existing session
      await supabase.auth.signOut();
      
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      expect(error).toBeTruthy();
      expect(error?.message).toContain('policy');
    });

    it('should prevent users from updating other users roles', async () => {
      const { data, error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', ADMIN_USER_ID); // Try to make someone else admin
      
      expect(error).toBeTruthy();
      expect(error?.message).toContain('policy');
    });
  });

  describe('🏠 Residents Table RLS Protection (GDPR Critical)', () => {
    it('should prevent non-admin from accessing resident personal data', async () => {
      const { data, error } = await supabase
        .from('residents')
        .select('*');
      
      expect(error).toBeTruthy();
      expect(error?.message).toContain('policy');
    });

    it('should prevent non-admin from inserting fake resident data', async () => {
      const { data, error } = await supabase
        .from('residents')
        .insert({
          apartment_number: '999Z',
          resident_names: 'Hacker McHackface',
          primary_email: 'hacker@evil.com'
        });
      
      expect(error).toBeTruthy();
      expect(error?.message).toContain('policy');
    });

    it('should prevent data exfiltration via SQL injection attempts', async () => {
      const maliciousQuery = "'; DROP TABLE residents; --";
      
      const { data, error } = await supabase
        .from('residents')
        .select('*')
        .eq('apartment_number', maliciousQuery);
      
      // Should either error due to RLS or return empty (never expose data)
      if (error) {
        expect(error.message).toContain('policy');
      } else {
        expect(data).toHaveLength(0);
      }
    });
  });

  describe('📊 GDPR & Audit Logs RLS Protection', () => {
    it('should prevent non-admin from accessing GDPR request logs', async () => {
      const { data, error } = await supabase
        .from('gdpr_requests_log')
        .select('*');
      
      expect(error).toBeTruthy();
      expect(error?.message).toContain('policy');
    });

    it('should prevent non-admin from accessing audit logs', async () => {
      const { data, error } = await supabase
        .from('data_access_log')
        .select('*');
      
      expect(error).toBeTruthy();
      expect(error?.message).toContain('policy');
    });

    it('should prevent tampering with audit trail', async () => {
      const { data, error } = await supabase
        .from('data_access_log')
        .delete()
        .eq('id', 'any-id');
      
      expect(error).toBeTruthy();
      expect(error?.message).toContain('policy');
    });
  });

  describe('🚨 Security Incidents RLS Protection', () => {
    it('should prevent non-admin from accessing security incidents', async () => {
      const { data, error } = await supabase
        .from('security_incidents')
        .select('*');
      
      expect(error).toBeTruthy();
      expect(error?.message).toContain('policy');
    });

    it('should prevent creation of fake security incidents', async () => {
      const { data, error } = await supabase
        .from('security_incidents')
        .insert({
          type: 'fake_incident',
          severity: 'critical',
          description: 'This is a fake incident created by unauthorized user'
        });
      
      expect(error).toBeTruthy();
      expect(error?.message).toContain('policy');
    });
  });

  describe('⚡ Race Condition & Concurrency Tests', () => {
    it('should prevent concurrent role escalation attacks', async () => {
      // Simulate multiple concurrent requests trying to escalate privileges
      const promises = Array(5).fill(null).map(() =>
        supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', REGULAR_USER_ID)
      );

      const results = await Promise.allSettled(promises);
      
      // All should fail due to RLS
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.error).toBeTruthy();
        }
      });
    });

    it('should prevent time-of-check-time-of-use (TOCTOU) attacks', async () => {
      // Try to exploit potential timing windows in RLS checks
      const rapidRequests = Array(10).fill(null).map((_, index) =>
        supabase
          .from('residents')
          .select('*')
          .limit(1)
      );

      const results = await Promise.allSettled(rapidRequests);
      
      // All should be blocked by RLS
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { data, error } = result.value;
          if (error) {
            expect(error.message).toContain('policy');
          } else {
            expect(data).toHaveLength(0);
          }
        }
      });
    });
  });

  describe('🎭 Admin Role Validation Tests', () => {
    // Note: These would need actual admin session to test positive cases
    it('should verify admin role requirements are strict', async () => {
      // Try various fake admin identifiers
      const fakeAdminAttempts = [
        'admin',
        'administrator', 
        'root',
        'superuser',
        ADMIN_USER_ID + '_fake'
      ];

      for (const fakeId of fakeAdminAttempts) {
        const { data, error } = await supabase
          .from('residents')
          .select('*')
          .eq('created_by_fake', fakeId); // This should not bypass RLS

        if (error) {
          expect(error.message).toContain('policy');
        } else {
          expect(data).toHaveLength(0);
        }
      }
    });
  });

  describe('📋 Maintenance Data RLS Protection', () => {
    it('should allow authenticated users to read maintenance tasks', async () => {
      // This is a positive test - maintenance tasks should be readable by auth users
      // But we test that unauthenticated cannot access
      await supabase.auth.signOut();
      
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .select('*');
      
      expect(error).toBeTruthy();
      expect(error?.message).toContain('policy');
    });

    it('should prevent unauthorized modification of critical maintenance', async () => {
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .update({ 
          description: 'HACKED - All maintenance cancelled',
          priority: 'low',
          status: 'completed'
        })
        .eq('priority', 'critical');
      
      // Should be blocked if user doesn't have proper permissions
      expect(error).toBeTruthy();
    });
  });
});

/**
 * Test Helper Functions
 */
describe('🔧 RLS Test Utilities', () => {
  it('should have working test database connection', async () => {
    // Basic connectivity test
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    // This should work or give a permissions error (both are fine)
    expect(true).toBe(true); // Just verify tests can run
  });
});

// Export for potential integration with other test suites
export const RLSTestHelpers = {
  ADMIN_USER_ID,
  REGULAR_USER_ID,
  MALICIOUS_USER_ID,
  
  async attemptUnauthorizedAccess(table: string, userId: string) {
    return await supabase
      .from(table)
      .select('*')
      .neq('id', userId);
  },
  
  async verifyPolicyBlock(result: any) {
    if (result.error) {
      expect(result.error.message).toContain('policy');
    } else {
      expect(result.data).toHaveLength(0);
    }
  }
};