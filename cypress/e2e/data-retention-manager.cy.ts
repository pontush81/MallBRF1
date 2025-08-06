// End-to-end tests for Data Retention Manager
// Tests the complete user journey and critical safety flows

describe('Data Retention Manager E2E Tests', () => {
  beforeEach(() => {
    // Mock authentication - assuming admin user is logged in
    cy.window().then((win) => {
      win.localStorage.setItem('auth-token', 'mock-admin-token');
    });

    // Mock Supabase Edge Function responses
    cy.intercept('POST', '**/functions/v1/data-retention-cleanup', (req) => {
      const { action } = req.body;

      switch (action) {
        case 'get_retention_status':
          req.reply({
            statusCode: 200,
            body: {
              retention_rules: 4,
              total_tables_managed: ['users', 'bookings', 'audit_logs', 'gdpr_requests_log'],
              safety_checks_enabled: true
            }
          });
          break;

        case 'analyze_retention':
          req.reply({
            statusCode: 200,
            body: {
              analysis: [
                {
                  table: 'users',
                  description: 'Medlemsuppgifter - endast efter medlemskap slutar + 2 år',
                  retentionDays: 730,
                  candidateCount: 5,
                  sampleChecked: 3,
                  safeToDeleteCount: 2,
                  cutoffDate: '2022-08-06T00:00:00.000Z',
                  safetyChecks: ['no_active_bookings', 'membership_ended'],
                  exceptions: ['styrelse_member']
                },
                {
                  table: 'bookings',
                  description: 'Bokningshistorik - 3 år för ekonomisk redovisning',
                  retentionDays: 1095,
                  candidateCount: 10,
                  sampleChecked: 5,
                  safeToDeleteCount: 8,
                  cutoffDate: '2021-08-06T00:00:00.000Z',
                  safetyChecks: ['booking_completed', 'payment_settled'],
                  exceptions: ['dispute_ongoing']
                }
              ],
              recommendation: 'Granska resultat noga innan du kör faktisk cleanup'
            }
          });
          break;

        case 'cleanup_data':
          const isDryRun = req.body.dryRun;
          req.reply({
            statusCode: 200,
            body: {
              cleanup_results: [
                {
                  table: 'users',
                  candidates_found: 5,
                  safe_to_delete: 2,
                  actually_deleted: isDryRun ? 0 : 2,
                  errors: [
                    'User ID 123: Har aktiva/framtida bokningar',
                    'User ID 456: Medlemskap fortfarande aktivt'
                  ],
                  dry_run: isDryRun
                },
                {
                  table: 'bookings',
                  candidates_found: 10,
                  safe_to_delete: 8,
                  actually_deleted: isDryRun ? 0 : 8,
                  errors: [
                    'Booking ID 101: Betalning ej reglerad'
                  ],
                  dry_run: isDryRun
                }
              ],
              warning: isDryRun 
                ? 'Detta var en test-körning. Ingen data raderades.'
                : 'Data har raderats permanent enligt säkerhetsregler.'
            }
          });
          break;

        default:
          req.reply({ statusCode: 400, body: { error: 'Invalid action' } });
      }
    }).as('retentionAPI');
  });

  describe('Page Loading and Initial State', () => {
    it('loads the data retention manager page correctly', () => {
      cy.visit('/admin/data-retention');

      // Verify page loaded
      cy.contains('Data Retention Manager').should('be.visible');
      cy.contains('GDPR-kompatibel datahantering').should('be.visible');
      
      // Should show overdue warning for first-time users
      cy.contains('Påminnelse: Data Retention Analys').should('be.visible');
      cy.contains('Kör analys nu för första gången').should('be.visible');
    });

    it('shows retention policy information', () => {
      cy.visit('/admin/data-retention');

      cy.contains('Data Retention enligt GDPR').should('be.visible');
      cy.contains('Automatisk radering av persondata').should('be.visible');
      cy.contains('Säkerhetsregler').should('be.visible');
    });

    it('has cleanup button disabled initially', () => {
      cy.visit('/admin/data-retention');

      cy.contains('button', 'Kör Cleanup').should('be.disabled');
    });
  });

  describe('Retention Analysis Flow', () => {
    it('successfully runs retention analysis', () => {
      cy.visit('/admin/data-retention');

      // Click analyze button
      cy.contains('button', 'Analysera Retention').click();

      // Should show loading state
      cy.get('[role="progressbar"]').should('be.visible');

      // Wait for API call
      cy.wait('@retentionAPI');

      // Should display analysis results
      cy.contains('Retention-analys resultat').should('be.visible');
      cy.contains('users').should('be.visible');
      cy.contains('bookings').should('be.visible');
      cy.contains('Medlemsuppgifter').should('be.visible');
      cy.contains('Bokningshistorik').should('be.visible');

      // Should show candidate counts
      cy.contains('5').should('be.visible'); // users candidates
      cy.contains('10').should('be.visible'); // bookings candidates

      // Should show safe to delete counts
      cy.contains('2').should('be.visible'); // users safe
      cy.contains('8').should('be.visible'); // bookings safe

      // Cleanup button should now be enabled
      cy.contains('button', 'Kör Cleanup').should('not.be.disabled');
    });

    it('shows error message on analysis failure', () => {
      cy.intercept('POST', '**/functions/v1/data-retention-cleanup', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('failedAPI');

      cy.visit('/admin/data-retention');

      cy.contains('button', 'Analysera Retention').click();
      cy.wait('@failedAPI');

      cy.contains('Kunde inte köra retention-analys').should('be.visible');
    });

    it('updates last run date after successful analysis', () => {
      cy.visit('/admin/data-retention');

      // Initially shows first-time message
      cy.contains('Kör analys nu för första gången').should('be.visible');

      cy.contains('button', 'Analysera Retention').click();
      cy.wait('@retentionAPI');

      // Should update the next run date
      cy.contains('Kör analys nu för första gången').should('not.exist');
    });
  });

  describe('Dry-Run Cleanup Flow', () => {
    beforeEach(() => {
      // Run analysis first to enable cleanup
      cy.visit('/admin/data-retention');
      cy.contains('button', 'Analysera Retention').click();
      cy.wait('@retentionAPI');
    });

    it('performs dry-run cleanup by default', () => {
      // Dry-run should be enabled by default
      cy.get('[type="checkbox"]').should('be.checked');
      cy.contains('button', 'Kör Cleanup (Dry-Run)').should('be.visible');

      // Click cleanup button
      cy.contains('button', 'Kör Cleanup (Dry-Run)').click();

      // Should show confirmation dialog
      cy.contains('Är du säker?').should('be.visible');
      cy.contains('Dry-run läge').should('be.visible');
      cy.contains('Ingen data raderas').should('be.visible');

      // Confirm the action
      cy.contains('button', 'Ja, kör Cleanup').click();

      cy.wait('@retentionAPI');

      // Should show dry-run results
      cy.contains('Cleanup-resultat').should('be.visible');
      cy.contains('Detta var en test-körning').should('be.visible');
      cy.contains('actually_deleted: 0').should('be.visible'); // No actual deletion in dry run
    });

    it('shows detailed results after dry-run', () => {
      cy.contains('button', 'Kör Cleanup (Dry-Run)').click();
      cy.contains('button', 'Ja, kör Cleanup').click();
      cy.wait('@retentionAPI');

      // Should show detailed results
      cy.contains('users').should('be.visible');
      cy.contains('bookings').should('be.visible');
      cy.contains('Kandidater hittade: 5').should('be.visible');
      cy.contains('Säkra att radera: 2').should('be.visible');

      // Should show safety errors
      cy.contains('Har aktiva/framtida bokningar').should('be.visible');
      cy.contains('Medlemskap fortfarande aktivt').should('be.visible');
    });
  });

  describe('Live Mode Cleanup Flow', () => {
    beforeEach(() => {
      cy.visit('/admin/data-retention');
      cy.contains('button', 'Analysera Retention').click();
      cy.wait('@retentionAPI');
    });

    it('switches to live mode with proper warnings', () => {
      // Switch to live mode
      cy.get('[type="checkbox"]').click();

      // Should show danger warnings
      cy.contains('VARNING: Live-läge').should('be.visible');
      cy.contains('Data raderas PERMANENT').should('be.visible');
      cy.contains('button', 'Kör Cleanup (LIVE)').should('be.visible');

      // Button should have danger styling
      cy.contains('button', 'Kör Cleanup (LIVE)').should('have.class', 'MuiButton-containedError');
    });

    it('performs live cleanup with extra confirmation', () => {
      // Switch to live mode
      cy.get('[type="checkbox"]').click();

      cy.contains('button', 'Kör Cleanup (LIVE)').click();

      // Should show serious confirmation dialog
      cy.contains('Är du säker?').should('be.visible');
      cy.contains('PERMANENT radering').should('be.visible');
      cy.contains('Denna åtgärd kan INTE ångras').should('be.visible');

      // Confirm the dangerous action
      cy.contains('button', 'Ja, kör Cleanup').click();

      cy.wait('@retentionAPI');

      // Should show live results
      cy.contains('Cleanup-resultat').should('be.visible');
      cy.contains('Data har raderats permanent').should('be.visible');
      cy.contains('actually_deleted: 2').should('be.visible'); // Actual deletion in live mode
      cy.contains('actually_deleted: 8').should('be.visible');
    });

    it('can cancel cleanup operation', () => {
      cy.get('[type="checkbox"]').click();
      cy.contains('button', 'Kör Cleanup (LIVE)').click();

      // Cancel the operation
      cy.contains('button', 'Avbryt').click();

      // Dialog should close without making API call
      cy.contains('Är du säker?').should('not.exist');
      cy.get('@retentionAPI').should('have.been.calledTimes', 1); // Only the initial analysis call
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      cy.visit('/admin/data-retention');
      cy.contains('button', 'Analysera Retention').click();
      cy.wait('@retentionAPI');
    });

    it('handles cleanup API failures gracefully', () => {
      // Mock cleanup failure
      cy.intercept('POST', '**/functions/v1/data-retention-cleanup', (req) => {
        if (req.body.action === 'cleanup_data') {
          req.reply({ statusCode: 500, body: { error: 'Cleanup failed' } });
        }
      }).as('failedCleanup');

      cy.contains('button', 'Kör Cleanup (Dry-Run)').click();
      cy.contains('button', 'Ja, kör Cleanup').click();

      cy.wait('@failedCleanup');

      cy.contains('Kunde inte köra data cleanup').should('be.visible');
    });

    it('prevents multiple simultaneous cleanup operations', () => {
      // Mock slow cleanup
      cy.intercept('POST', '**/functions/v1/data-retention-cleanup', (req) => {
        if (req.body.action === 'cleanup_data') {
          // Delay the response
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                statusCode: 200,
                body: {
                  cleanup_results: [],
                  warning: 'Test completed'
                }
              });
            }, 2000);
          });
        }
      }).as('slowCleanup');

      cy.contains('button', 'Kör Cleanup (Dry-Run)').click();
      cy.contains('button', 'Ja, kör Cleanup').click();

      // While loading, button should be disabled
      cy.get('[role="progressbar"]').should('be.visible');
      cy.contains('button', 'Kör Cleanup').should('be.disabled');

      cy.wait('@slowCleanup');
    });

    it('handles empty analysis results', () => {
      // Mock empty analysis
      cy.intercept('POST', '**/functions/v1/data-retention-cleanup', (req) => {
        if (req.body.action === 'analyze_retention') {
          req.reply({
            statusCode: 200,
            body: {
              analysis: [],
              recommendation: 'Inga retention-kandidater hittades'
            }
          });
        }
      }).as('emptyAnalysis');

      cy.visit('/admin/data-retention');
      cy.contains('button', 'Analysera Retention').click();

      cy.wait('@emptyAnalysis');

      cy.contains('Inga retention-kandidater hittades').should('be.visible');
      cy.contains('button', 'Kör Cleanup').should('be.disabled');
    });
  });

  describe('GDPR Compliance Verification', () => {
    it('shows GDPR compliance information', () => {
      cy.visit('/admin/data-retention');

      cy.contains('GDPR Artikel 5').should('be.visible');
      cy.contains('Data minimization').should('be.visible');
      cy.contains('Automatisk radering enligt lagstiftning').should('be.visible');
    });

    it('displays retention periods according to law', () => {
      cy.visit('/admin/data-retention');
      cy.contains('button', 'Analysera Retention').click();
      cy.wait('@retentionAPI');

      // Should show legal retention periods
      cy.contains('730 dagar').should('be.visible'); // 2 years for users
      cy.contains('1095 dagar').should('be.visible'); // 3 years for bookings

      // Should show legal basis
      cy.contains('medlemskap slutar + 2 år').should('be.visible');
      cy.contains('ekonomisk redovisning').should('be.visible');
    });

    it('shows safety checks for GDPR compliance', () => {
      cy.visit('/admin/data-retention');
      cy.contains('button', 'Analysera Retention').click();
      cy.wait('@retentionAPI');

      // Click cleanup to see safety results
      cy.contains('button', 'Kör Cleanup (Dry-Run)').click();
      cy.contains('button', 'Ja, kör Cleanup').click();
      cy.wait('@retentionAPI');

      // Should show GDPR-compliant safety checks
      cy.contains('no_active_bookings').should('be.visible');
      cy.contains('membership_ended').should('be.visible');
      cy.contains('payment_settled').should('be.visible');

      // Should show legal exceptions
      cy.contains('styrelse_member').should('be.visible');
      cy.contains('dispute_ongoing').should('be.visible');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('works on mobile viewport', () => {
      cy.viewport(390, 844); // iPhone 12 Pro
      cy.visit('/admin/data-retention');

      cy.contains('Data Retention Manager').should('be.visible');
      cy.contains('button', 'Analysera Retention').should('be.visible');

      // Run analysis on mobile
      cy.contains('button', 'Analysera Retention').click();
      cy.wait('@retentionAPI');

      // Results should be readable on mobile
      cy.contains('Retention-analys resultat').should('be.visible');
      cy.contains('button', 'Kör Cleanup').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and keyboard navigation', () => {
      cy.visit('/admin/data-retention');

      // Check ARIA labels
      cy.get('[role="button"]').should('have.attr', 'aria-label').or('contain.text');
      cy.get('[type="checkbox"]').should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby');

      // Test keyboard navigation
      cy.get('body').tab();
      cy.focused().should('contain.text', 'Analysera Retention');

      // Tab to dry-run switch
      cy.focused().tab();
      cy.focused().should('have.attr', 'type', 'checkbox');
    });

    it('maintains focus after modal interactions', () => {
      cy.visit('/admin/data-retention');
      cy.contains('button', 'Analysera Retention').click();
      cy.wait('@retentionAPI');

      cy.contains('button', 'Kör Cleanup (Dry-Run)').focus();
      cy.focused().click();

      // Focus should be maintained in modal
      cy.contains('button', 'Ja, kör Cleanup').should('be.focused');

      // Cancel and check focus returns
      cy.contains('button', 'Avbryt').click();
      cy.contains('button', 'Kör Cleanup (Dry-Run)').should('be.focused');
    });
  });
});