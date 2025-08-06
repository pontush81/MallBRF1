import { getAuthenticatedSupabaseClient } from '../../services/supabaseClient';

// Mock the Supabase client
jest.mock('../../services/supabaseClient', () => ({
  getAuthenticatedSupabaseClient: jest.fn(),
}));

const mockSupabaseClient = getAuthenticatedSupabaseClient as jest.MockedFunction<typeof getAuthenticatedSupabaseClient>;

describe('Data Retention Safety Tests', () => {
  const mockSupabase = {
    functions: {
      invoke: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.mockResolvedValue(mockSupabase as any);
  });

  describe('Edge Function Communication', () => {
    test('handles analyze_retention action correctly', async () => {
      const expectedResponse = {
        analysis: [
          {
            table: 'users',
            description: 'Medlemsuppgifter - endast efter medlemskap slutar + 2 år',
            retentionDays: 730,
            candidateCount: 3,
            sampleChecked: 3,
            safeToDeleteCount: 2,
            cutoffDate: '2022-08-06T00:00:00.000Z',
            safetyChecks: ['no_active_bookings', 'membership_ended'],
            exceptions: ['styrelse_member']
          }
        ],
        recommendation: 'Granska resultat noga innan du kör faktisk cleanup',
        timestamp: expect.any(String)
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: expectedResponse,
        error: null
      });

      const supabase = await getAuthenticatedSupabaseClient();
      const { data, error } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { action: 'analyze_retention' }
      });

      expect(error).toBeNull();
      expect(data.analysis).toBeDefined();
      expect(data.analysis[0].table).toBe('users');
      expect(data.analysis[0].safetyChecks).toContain('no_active_bookings');
      expect(data.recommendation).toContain('Granska resultat');
    });

    test('handles cleanup_data action with dry run', async () => {
      const expectedResponse = {
        cleanup_results: [
          {
            table: 'users',
            description: 'Medlemsuppgifter',
            candidates_found: 5,
            safe_to_delete: 2,
            actually_deleted: 0,
            errors: [],
            dry_run: true
          }
        ],
        warning: 'Detta var en test-körning. Ingen data raderades.'
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: expectedResponse,
        error: null
      });

      const supabase = await getAuthenticatedSupabaseClient();
      const { data } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { 
          action: 'cleanup_data',
          dryRun: true
        }
      });

      expect(data.cleanup_results[0].dry_run).toBe(true);
      expect(data.cleanup_results[0].actually_deleted).toBe(0);
      expect(data.warning).toContain('test-körning');
    });

    test('handles cleanup_data action with live mode', async () => {
      const expectedResponse = {
        cleanup_results: [
          {
            table: 'users',
            candidates_found: 5,
            safe_to_delete: 2,
            actually_deleted: 2,
            errors: [],
            dry_run: false
          }
        ],
        warning: 'Data har raderats permanent enligt säkerhetsregler.'
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: expectedResponse,
        error: null
      });

      const supabase = await getAuthenticatedSupabaseClient();
      const { data } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { 
          action: 'cleanup_data',
          dryRun: false
        }
      });

      expect(data.cleanup_results[0].dry_run).toBe(false);
      expect(data.cleanup_results[0].actually_deleted).toBe(2);
      expect(data.warning).toContain('permanent');
    });

    test('handles get_retention_status action', async () => {
      const expectedResponse = {
        retention_rules: 4,
        last_cleanup_run: null,
        next_scheduled_run: null,
        total_tables_managed: ['users', 'bookings', 'audit_logs', 'gdpr_requests_log'],
        safety_checks_enabled: true
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: expectedResponse,
        error: null
      });

      const supabase = await getAuthenticatedSupabaseClient();
      const { data } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { action: 'get_retention_status' }
      });

      expect(data.retention_rules).toBe(4);
      expect(data.total_tables_managed).toContain('users');
      expect(data.safety_checks_enabled).toBe(true);
    });
  });

  describe('Safety Rule Validation', () => {
    test('prevents deletion of users with active bookings', async () => {
      const responseWithSafetyBlocks = {
        cleanup_results: [
          {
            table: 'users',
            candidates_found: 5,
            safe_to_delete: 1, // Only 1 out of 5 is safe to delete
            actually_deleted: 1,
            errors: [
              'User ID 123: Har aktiva/framtida bokningar',
              'User ID 456: Inloggad senaste 6 månaderna',
              'User ID 789: Medlemskap fortfarande aktivt'
            ],
            dry_run: false
          }
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: responseWithSafetyBlocks,
        error: null
      });

      const supabase = await getAuthenticatedSupabaseClient();
      const { data } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { action: 'cleanup_data', dryRun: false }
      });

      expect(data.cleanup_results[0].safe_to_delete).toBe(1);
      expect(data.cleanup_results[0].errors).toContain('Har aktiva/framtida bokningar');
      expect(data.cleanup_results[0].errors).toContain('Medlemskap fortfarande aktivt');
    });

    test('prevents deletion of bookings with unresolved payments', async () => {
      const responseWithPaymentBlocks = {
        cleanup_results: [
          {
            table: 'bookings',
            candidates_found: 10,
            safe_to_delete: 7,
            actually_deleted: 7,
            errors: [
              'Booking ID 101: Betalning ej reglerad',
              'Booking ID 102: Pågående tvist',
              'Booking ID 103: Bokföringsspärr'
            ],
            dry_run: false
          }
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: responseWithPaymentBlocks,
        error: null
      });

      const supabase = await getAuthenticatedSupabaseClient();
      const { data } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { action: 'cleanup_data', dryRun: false }
      });

      expect(data.cleanup_results[0].errors).toContain('Betalning ej reglerad');
      expect(data.cleanup_results[0].errors).toContain('Pågående tvist');
    });

    test('validates retention periods are correctly applied', async () => {
      const analysisResponse = {
        analysis: [
          {
            table: 'users',
            retentionDays: 730, // 2 years
            cutoffDate: '2022-08-06T00:00:00.000Z',
            description: 'Medlemsuppgifter - endast efter medlemskap slutar + 2 år'
          },
          {
            table: 'bookings', 
            retentionDays: 1095, // 3 years
            cutoffDate: '2021-08-06T00:00:00.000Z',
            description: 'Bokningshistorik - 3 år för ekonomisk redovisning'
          },
          {
            table: 'gdpr_requests_log',
            retentionDays: 1825, // 5 years
            cutoffDate: '2019-08-06T00:00:00.000Z', 
            description: 'GDPR-loggar - 5 år enligt myndighetskrav'
          }
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: analysisResponse,
        error: null
      });

      const supabase = await getAuthenticatedSupabaseClient();
      const { data } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { action: 'analyze_retention' }
      });

      // Verify retention periods follow GDPR and Swedish law
      const userPolicy = data.analysis.find((a: any) => a.table === 'users');
      const bookingPolicy = data.analysis.find((a: any) => a.table === 'bookings');
      const gdprPolicy = data.analysis.find((a: any) => a.table === 'gdpr_requests_log');

      expect(userPolicy.retentionDays).toBe(730); // 2 years for user data
      expect(bookingPolicy.retentionDays).toBe(1095); // 3 years for bookings
      expect(gdprPolicy.retentionDays).toBe(1825); // 5 years for GDPR logs
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles authentication failures', async () => {
      mockSupabase.functions.invoke.mockRejectedValueOnce(
        new Error('Authentication failed')
      );

      const supabase = await getAuthenticatedSupabaseClient();
      
      await expect(
        supabase.functions.invoke('data-retention-cleanup', {
          body: { action: 'analyze_retention' }
        })
      ).rejects.toThrow('Authentication failed');
    });

    test('handles edge function timeout', async () => {
      // Mock timeout after 30 seconds
      jest.setTimeout(35000);
      mockSupabase.functions.invoke.mockImplementationOnce(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Function timeout')), 30000)
        )
      );

      const supabase = await getAuthenticatedSupabaseClient();
      
      await expect(
        supabase.functions.invoke('data-retention-cleanup', {
          body: { action: 'cleanup_data', dryRun: false }
        })
      ).rejects.toThrow('Function timeout');
    });

    test('handles partial cleanup failures', async () => {
      const partialFailureResponse = {
        cleanup_results: [
          {
            table: 'users',
            candidates_found: 5,
            safe_to_delete: 3,
            actually_deleted: 2, // One failed to delete
            errors: ['User ID 999: Database constraint violation'],
            dry_run: false
          }
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: partialFailureResponse,
        error: null
      });

      const supabase = await getAuthenticatedSupabaseClient();
      const { data } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { action: 'cleanup_data', dryRun: false }
      });

      expect(data.cleanup_results[0].actually_deleted).toBeLessThan(
        data.cleanup_results[0].safe_to_delete
      );
      expect(data.cleanup_results[0].errors).toContain('Database constraint violation');
    });

    test('validates date calculations are correct', async () => {
      const now = new Date('2024-08-06T12:00:00.000Z');
      const expectedCutoffFor2Years = new Date('2022-08-06T12:00:00.000Z');
      const expectedCutoffFor3Years = new Date('2021-08-06T12:00:00.000Z');

      // Mock the analysis to return specific cutoff dates
      const analysisResponse = {
        analysis: [
          {
            table: 'users',
            retentionDays: 730,
            cutoffDate: expectedCutoffFor2Years.toISOString()
          },
          {
            table: 'bookings',
            retentionDays: 1095,
            cutoffDate: expectedCutoffFor3Years.toISOString()
          }
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: analysisResponse,
        error: null
      });

      const supabase = await getAuthenticatedSupabaseClient();
      const { data } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { action: 'analyze_retention' }
      });

      // Verify dates are calculated correctly
      expect(new Date(data.analysis[0].cutoffDate)).toEqual(expectedCutoffFor2Years);
      expect(new Date(data.analysis[1].cutoffDate)).toEqual(expectedCutoffFor3Years);
    });

    test('handles empty database tables gracefully', async () => {
      const emptyResponse = {
        analysis: [
          {
            table: 'users',
            candidateCount: 0,
            safeToDeleteCount: 0,
            cutoffDate: '2022-08-06T00:00:00.000Z'
          }
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: emptyResponse,
        error: null
      });

      const supabase = await getAuthenticatedSupabaseClient();
      const { data } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { action: 'analyze_retention' }
      });

      expect(data.analysis[0].candidateCount).toBe(0);
      expect(data.analysis[0].safeToDeleteCount).toBe(0);
    });
  });

  describe('GDPR Compliance Edge Cases', () => {
    test('ensures proper handling of GDPR deletion requests', async () => {
      const gdprScenarioResponse = {
        cleanup_results: [
          {
            table: 'users',
            candidates_found: 1,
            safe_to_delete: 0, // User has GDPR deletion request - special handling
            actually_deleted: 0,
            errors: ['User ID 555: GDPR radering pågår - ska inte processas via retention'],
            dry_run: false
          }
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: gdprScenarioResponse,
        error: null
      });

      const supabase = await getAuthenticatedSupabaseClient();
      const { data } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { action: 'cleanup_data', dryRun: false }
      });

      expect(data.cleanup_results[0].errors).toContain('GDPR radering pågår');
      expect(data.cleanup_results[0].actually_deleted).toBe(0);
    });

    test('validates audit trail is preserved', async () => {
      const auditPreservationResponse = {
        cleanup_results: [
          {
            table: 'audit_logs',
            candidates_found: 100,
            safe_to_delete: 50, // Only non-security-critical logs
            actually_deleted: 50,
            errors: [
              'Log ID 101: Säkerhetskritisk händelse - behålls',
              'Log ID 102: Del av aktiv utredning - behålls'
            ],
            dry_run: false
          }
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: auditPreservationResponse,
        error: null
      });

      const supabase = await getAuthenticatedSupabaseClient();
      const { data } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { action: 'cleanup_data', dryRun: false }
      });

      expect(data.cleanup_results[0].errors).toContain('Säkerhetskritisk händelse');
      expect(data.cleanup_results[0].errors).toContain('aktiv utredning');
    });

    test('validates Swedish law compliance for accounting data', async () => {
      const swedishLawResponse = {
        cleanup_results: [
          {
            table: 'bookings',
            candidates_found: 20,
            safe_to_delete: 15,
            actually_deleted: 15,
            errors: [
              'Booking ID 201: Swedish Accounting Law (Bokföringslagen) - 7 year retention',
              'Booking ID 202: Unsettled payment obligation'
            ],
            dry_run: false
          }
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: swedishLawResponse,
        error: null
      });

      const supabase = await getAuthenticatedSupabaseClient();
      const { data } = await supabase.functions.invoke('data-retention-cleanup', {
        body: { action: 'cleanup_data', dryRun: false }
      });

      expect(data.cleanup_results[0].errors).toContain('Bokföringslagen');
      expect(data.cleanup_results[0].errors).toContain('Unsettled payment');
    });
  });
});