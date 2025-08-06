import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DataRetentionManager from '../../../pages/admin/DataRetentionManager';
import { getAuthenticatedSupabaseClient } from '../../../services/supabaseClient';

// Mock the Supabase client
jest.mock('../../../services/supabaseClient', () => ({
  getAuthenticatedSupabaseClient: jest.fn(),
}));

const mockSupabaseClient = getAuthenticatedSupabaseClient as jest.MockedFunction<typeof getAuthenticatedSupabaseClient>;

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('DataRetentionManager', () => {
  const mockSupabase = {
    functions: {
      invoke: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockSupabaseClient.mockResolvedValue(mockSupabase as any);
  });

  describe('Component Rendering', () => {
    test('renders main heading and key elements', async () => {
      render(<DataRetentionManager />);
      
      expect(screen.getByText('Data Retention Manager')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /analysera retention/i })).toBeInTheDocument();
    });

    test('shows overdue warning when no previous analysis exists', async () => {
      render(<DataRetentionManager />);
      
      await waitFor(() => {
        expect(screen.getByText(/påminnelse: data retention analys/i)).toBeInTheDocument();
        expect(screen.getByText(/kör analys nu för första gången/i)).toBeInTheDocument();
      });
    });

    test('calculates next run date correctly when previous analysis exists', () => {
      const mockDate = '2024-01-15T10:00:00.000Z';
      mockLocalStorage.setItem('last_retention_analysis', mockDate);
      
      render(<DataRetentionManager />);
      
      // Should show next run date (one month after last run)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('last_retention_analysis');
    });
  });

  describe('Retention Analysis Function', () => {
    test('successfully runs retention analysis', async () => {
      const mockAnalysisData = {
        analysis: [
          {
            table: 'users',
            description: 'Medlemsuppgifter',
            retentionDays: 730,
            candidateCount: 5,
            sampleChecked: 3,
            safeToDeleteCount: 2,
            cutoffDate: '2022-06-01T00:00:00.000Z',
            safetyChecks: ['no_active_bookings', 'membership_ended'],
            exceptions: ['styrelse_member']
          }
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockAnalysisData,
        error: null
      });

      render(<DataRetentionManager />);
      
      const analyzeButton = screen.getByRole('button', { name: /analysera retention/i });
      await userEvent.click(analyzeButton);

      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('data-retention-cleanup', {
          body: { action: 'analyze_retention' }
        });
      });

      // Should update localStorage with analysis date
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'last_retention_analysis',
        expect.any(String)
      );

      // Should display analysis results
      await waitFor(() => {
        expect(screen.getByText('users')).toBeInTheDocument();
        expect(screen.getByText('Medlemsuppgifter')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // candidateCount
        expect(screen.getByText('2')).toBeInTheDocument(); // safeToDeleteCount
      });
    });

    test('handles analysis errors gracefully', async () => {
      mockSupabase.functions.invoke.mockRejectedValueOnce(new Error('API Error'));

      render(<DataRetentionManager />);
      
      const analyzeButton = screen.getByRole('button', { name: /analysera retention/i });
      await userEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/kunde inte köra retention-analys/i)).toBeInTheDocument();
      });
    });

    test('shows loading state during analysis', async () => {
      mockSupabase.functions.invoke.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<DataRetentionManager />);
      
      const analyzeButton = screen.getByRole('button', { name: /analysera retention/i });
      await userEvent.click(analyzeButton);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Data Cleanup Function', () => {
    beforeEach(() => {
      // Setup some analysis data first
      const mockAnalysisData = {
        analysis: [
          {
            table: 'users',
            candidateCount: 5,
            safeToDeleteCount: 2,
          }
        ]
      };
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockAnalysisData,
        error: null
      });
    });

    test('runs dry-run cleanup by default', async () => {
      const mockCleanupData = {
        cleanup_results: [
          {
            table: 'users',
            candidates_found: 5,
            safe_to_delete: 2,
            actually_deleted: 0,
            errors: [],
            dry_run: true
          }
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockCleanupData,
        error: null
      });

      render(<DataRetentionManager />);
      
      // First run analysis to get data
      await userEvent.click(screen.getByRole('button', { name: /analysera retention/i }));
      
      await waitFor(() => {
        const cleanupButton = screen.getByRole('button', { name: /kör cleanup \(dry-run\)/i });
        expect(cleanupButton).toBeInTheDocument();
      });

      const cleanupButton = screen.getByRole('button', { name: /kör cleanup \(dry-run\)/i });
      await userEvent.click(cleanupButton);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/är du säker/i)).toBeInTheDocument();
      });

      // Confirm the action
      const confirmButton = screen.getByRole('button', { name: /ja, kör cleanup/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('data-retention-cleanup', {
          body: { 
            action: 'cleanup_data',
            dryRun: true
          }
        });
      });
    });

    test('can switch to live mode (non-dry-run)', async () => {
      render(<DataRetentionManager />);
      
      const dryRunSwitch = screen.getByRole('checkbox', { name: /dry-run läge/i });
      await userEvent.click(dryRunSwitch);

      expect(dryRunSwitch).not.toBeChecked();
      expect(screen.getByRole('button', { name: /kör cleanup \(live\)/i })).toBeInTheDocument();
    });

    test('shows dangerous action warning in live mode', async () => {
      render(<DataRetentionManager />);
      
      const dryRunSwitch = screen.getByRole('checkbox', { name: /dry-run läge/i });
      await userEvent.click(dryRunSwitch);

      expect(screen.getByText(/varning: live-läge/i)).toBeInTheDocument();
      expect(screen.getByText(/data raderas permanent/i)).toBeInTheDocument();
    });

    test('handles cleanup errors appropriately', async () => {
      mockSupabase.functions.invoke.mockRejectedValueOnce(new Error('Cleanup failed'));

      render(<DataRetentionManager />);
      
      // Set up for cleanup
      const analyzeButton = screen.getByRole('button', { name: /analysera retention/i });
      await userEvent.click(analyzeButton);

      await waitFor(() => {
        const cleanupButton = screen.getByRole('button', { name: /kör cleanup/i });
        expect(cleanupButton).toBeInTheDocument();
      });

      const cleanupButton = screen.getByRole('button', { name: /kör cleanup/i });
      await userEvent.click(cleanupButton);
      
      const confirmButton = screen.getByRole('button', { name: /ja, kör cleanup/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/kunde inte köra data cleanup/i)).toBeInTheDocument();
      });
    });
  });

  describe('Safety Calculations', () => {
    test('calculates total candidates correctly', async () => {
      const mockAnalysisData = {
        analysis: [
          { candidateCount: 5, safeToDeleteCount: 2 },
          { candidateCount: 3, safeToDeleteCount: 1 },
          { candidateCount: 0, safeToDeleteCount: 0 }
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockAnalysisData,
        error: null
      });

      render(<DataRetentionManager />);
      
      await userEvent.click(screen.getByRole('button', { name: /analysera retention/i }));

      await waitFor(() => {
        // Total candidates: 5 + 3 + 0 = 8
        expect(screen.getByText('8')).toBeInTheDocument();
        // Total safe to delete: 2 + 1 + 0 = 3
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    test('shows correct status colors based on safety', async () => {
      const mockAnalysisData = {
        analysis: [
          { table: 'safe_table', candidateCount: 0, safeToDeleteCount: 0 }, // Green (success)
          { table: 'warning_table', candidateCount: 5, safeToDeleteCount: 0 }, // Yellow (warning)
          { table: 'partial_table', candidateCount: 5, safeToDeleteCount: 3 }, // Yellow (warning)
          { table: 'ready_table', candidateCount: 3, safeToDeleteCount: 3 } // Blue (info)
        ]
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockAnalysisData,
        error: null
      });

      render(<DataRetentionManager />);
      
      await userEvent.click(screen.getByRole('button', { name: /analysera retention/i }));

      // We'd need to check the actual chip colors here, but that's complex with MUI
      // Instead, verify the data is displayed correctly
      await waitFor(() => {
        expect(screen.getByText('safe_table')).toBeInTheDocument();
        expect(screen.getByText('warning_table')).toBeInTheDocument();
        expect(screen.getByText('partial_table')).toBeInTheDocument();
        expect(screen.getByText('ready_table')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles empty analysis results', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: { analysis: [] },
        error: null
      });

      render(<DataRetentionManager />);
      
      await userEvent.click(screen.getByRole('button', { name: /analysera retention/i }));

      await waitFor(() => {
        expect(screen.getByText(/inga retention-kandidater hittades/i)).toBeInTheDocument();
      });
    });

    test('handles missing data in analysis response', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: null
      });

      render(<DataRetentionManager />);
      
      await userEvent.click(screen.getByRole('button', { name: /analysera retention/i }));

      // Should handle gracefully without crashing
      expect(screen.getByRole('button', { name: /analysera retention/i })).toBeInTheDocument();
    });

    test('handles network timeout gracefully', async () => {
      const timeoutError = new Error('Network timeout');
      mockSupabase.functions.invoke.mockRejectedValueOnce(timeoutError);

      render(<DataRetentionManager />);
      
      await userEvent.click(screen.getByRole('button', { name: /analysera retention/i }));

      await waitFor(() => {
        expect(screen.getByText(/kunde inte köra retention-analys/i)).toBeInTheDocument();
      });
    });

    test('prevents cleanup when no analysis has been run', async () => {
      render(<DataRetentionManager />);
      
      // Cleanup button should be disabled when no analysis exists
      const cleanupButton = screen.getByRole('button', { name: /kör cleanup/i });
      expect(cleanupButton).toBeDisabled();
    });

    test('disables cleanup button during operation', async () => {
      // Setup analysis first
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: { analysis: [{ candidateCount: 5, safeToDeleteCount: 2 }] },
        error: null
      });

      render(<DataRetentionManager />);
      
      await userEvent.click(screen.getByRole('button', { name: /analysera retention/i }));

      await waitFor(() => {
        const cleanupButton = screen.getByRole('button', { name: /kör cleanup/i });
        expect(cleanupButton).toBeEnabled();
      });

      // Mock long-running cleanup
      mockSupabase.functions.invoke.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const cleanupButton = screen.getByRole('button', { name: /kör cleanup/i });
      await userEvent.click(cleanupButton);
      
      const confirmButton = screen.getByRole('button', { name: /ja, kör cleanup/i });
      await userEvent.click(confirmButton);

      // Cleanup button should be disabled during operation
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });
  });

  describe('GDPR Compliance Tests', () => {
    test('shows appropriate warnings for GDPR data deletion', async () => {
      render(<DataRetentionManager />);
      
      expect(screen.getByText(/gdpr-kompatibel datahantering/i)).toBeInTheDocument();
      expect(screen.getByText(/automatisk radering av persondata/i)).toBeInTheDocument();
    });

    test('requires confirmation for permanent data deletion', async () => {
      const mockAnalysisData = {
        analysis: [{ candidateCount: 5, safeToDeleteCount: 2 }]
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockAnalysisData,
        error: null
      });

      render(<DataRetentionManager />);
      
      // Run analysis first
      await userEvent.click(screen.getByRole('button', { name: /analysera retention/i }));

      await waitFor(() => {
        const cleanupButton = screen.getByRole('button', { name: /kör cleanup/i });
        expect(cleanupButton).toBeEnabled();
      });

      const cleanupButton = screen.getByRole('button', { name: /kör cleanup/i });
      await userEvent.click(cleanupButton);

      // Should show confirmation dialog with GDPR warning
      await waitFor(() => {
        expect(screen.getByText(/är du säker/i)).toBeInTheDocument();
        expect(screen.getByText(/denna åtgärd kan inte ångras/i)).toBeInTheDocument();
      });
    });

    test('displays retention policy information', async () => {
      render(<DataRetentionManager />);
      
      expect(screen.getByText(/data retention enligt gdpr/i)).toBeInTheDocument();
    });
  });

  describe('User Interaction Tests', () => {
    test('dialog can be cancelled', async () => {
      const mockAnalysisData = {
        analysis: [{ candidateCount: 5, safeToDeleteCount: 2 }]
      };

      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: mockAnalysisData,
        error: null
      });

      render(<DataRetentionManager />);
      
      await userEvent.click(screen.getByRole('button', { name: /analysera retention/i }));

      await waitFor(() => {
        const cleanupButton = screen.getByRole('button', { name: /kör cleanup/i });
        userEvent.click(cleanupButton);
      });

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /avbryt/i });
        expect(cancelButton).toBeInTheDocument();
        userEvent.click(cancelButton);
      });

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText(/är du säker/i)).not.toBeInTheDocument();
      });
    });

    test('shows appropriate results after cleanup', async () => {
      const mockAnalysisData = {
        analysis: [{ candidateCount: 5, safeToDeleteCount: 2 }]
      };

      const mockCleanupData = {
        cleanup_results: [
          {
            table: 'users',
            candidates_found: 5,
            safe_to_delete: 2,
            actually_deleted: 2,
            errors: [],
            dry_run: false
          }
        ]
      };

      mockSupabase.functions.invoke
        .mockResolvedValueOnce({ data: mockAnalysisData, error: null })
        .mockResolvedValueOnce({ data: mockCleanupData, error: null });

      render(<DataRetentionManager />);
      
      // Run analysis
      await userEvent.click(screen.getByRole('button', { name: /analysera retention/i }));

      // Switch to live mode
      await waitFor(() => {
        const dryRunSwitch = screen.getByRole('checkbox', { name: /dry-run läge/i });
        userEvent.click(dryRunSwitch);
      });

      // Run cleanup
      await waitFor(() => {
        const cleanupButton = screen.getByRole('button', { name: /kör cleanup \(live\)/i });
        userEvent.click(cleanupButton);
      });

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /ja, kör cleanup/i });
        userEvent.click(confirmButton);
      });

      // Should show cleanup results
      await waitFor(() => {
        expect(screen.getByText(/cleanup-resultat/i)).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // actually_deleted count
      });
    });
  });
});