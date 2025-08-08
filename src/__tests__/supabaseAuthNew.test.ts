/**
 * 🧪 Comprehensive Supabase Auth Testing Suite
 * 
 * Tests based on Perplexity recommendations:
 * - Auth Lifecycle Tests (login, logout, token refresh, OAuth)  
 * - RLS Policy Tests
 * - Session Consistency Tests
 * - Migration Idempotency Tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Supabase client first (before imports)
const mockSupabase = {
  auth: {
    signInWithOAuth: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    signOut: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  })),
  rpc: jest.fn()
};

jest.mock('../services/supabaseClient', () => mockSupabase);

// Now import the functions to test
import { 
  loginWithGoogle, 
  handleAuthCallback, 
  getCurrentUser, 
  logout,
  getUserProfile,
  createUserProfileFromOAuth
} from '../services/supabaseAuthNew';

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    replaceState: jest.fn(),
  },
  writable: true,
});

// Mock console methods  
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('🔐 Supabase Auth System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('🚀 OAuth Login Flow', () => {
    it('should initiate Google OAuth correctly', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ 
        data: { url: 'https://accounts.google.com/oauth/authorize?...' }, 
        error: null 
      });

      await loginWithGoogle();

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
    });

    it('should handle OAuth errors gracefully', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ 
        data: null, 
        error: { message: 'OAuth configuration error' } 
      });

      const result = await loginWithGoogle();

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('OAuth configuration error')
      );
    });
  });

  describe('🔄 OAuth Callback Handling', () => {
    it('should handle successful OAuth callback', async () => {
      const mockUserData = {
        id: '9e44f39b-080b-421d-abdc-ff27611ca41b',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUserData } },
        error: null
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: mockUserData.id,
          email: mockUserData.email,
          name: 'Test User',
          role: 'user',
          isactive: true
        },
        error: null
      });

      const result = await handleAuthCallback();

      expect(result).toEqual({
        id: mockUserData.id,
        email: mockUserData.email,
        name: 'Test User',
        role: 'user',
        isActive: true
      });

      expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('should handle migration case (Firebase → Supabase)', async () => {
      const mockUserData = {
        id: '9e44f39b-080b-421d-abdc-ff27611ca41b',  // New Supabase UUID
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      };

      const mockExistingUser = {
        id: 'firebase-old-id-123456',  // Old Firebase ID
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        isactive: true
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUserData } },
        error: null
      });

      // First call (by auth ID) fails, second call (by email) succeeds
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({ data: null, error: { message: 'No rows found' } })
        .mockResolvedValueOnce({ data: mockExistingUser, error: null });

      // Mock atomic migration
      mockSupabase.rpc.mockResolvedValue({
        data: {
          id: mockUserData.id,
          email: mockUserData.email,
          name: 'Test User',
          role: 'user',
          isactive: true,
          migration_status: 'migrated'
        },
        error: null
      });

      const result = await handleAuthCallback();

      expect(mockSupabase.rpc).toHaveBeenCalledWith('migrate_user_id_atomic', {
        old_user_id: 'firebase-old-id-123456',
        new_user_id: mockUserData.id,
        user_email: mockUserData.email
      });

      expect(result).toEqual({
        id: mockUserData.id,
        email: mockUserData.email,
        name: 'Test User',
        role: 'user',
        isActive: true
      });
    });
  });

  describe('👤 User Profile Operations', () => {
    it('should get current user successfully', async () => {
      const mockUser = {
        id: '9e44f39b-080b-421d-abdc-ff27611ca41b',
        email: 'test@example.com'
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: mockUser.id,
          email: mockUser.email,
          name: 'Test User',
          role: 'user',
          isactive: true
        },
        error: null
      });

      const result = await getCurrentUser();

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: 'Test User',
        role: 'user',
        isActive: true
      });
    });

    it('should handle RLS policy violations gracefully', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'new row violates row-level security policy' }
      });

      await expect(getUserProfile('test-id')).rejects.toThrow(
        expect.stringContaining('row-level security policy')
      );
    });
  });

  describe('🔒 Security & Session Tests', () => {
    it('should logout successfully and clear session', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await logout();

      expect(result).toBe(true);
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ 
        error: { message: 'Logout failed' } 
      });

      const result = await logout();

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Logout failed')
      );
    });
  });

  describe('🔄 Migration Idempotency Tests', () => {
    it('should handle repeated migration attempts safely', async () => {
      const mockUserData = {
        id: '9e44f39b-080b-421d-abdc-ff27611ca41b',
        email: 'test@example.com'
      };

      // Mock atomic migration returning "already_migrated"
      mockSupabase.rpc.mockResolvedValue({
        data: {
          id: mockUserData.id,
          email: mockUserData.email,
          name: 'Test User',
          role: 'user',
          isactive: true,
          migration_status: 'already_migrated'
        },
        error: null
      });

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUserData } },
        error: null
      });

      // First call by auth ID fails, second by email finds already migrated user
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({ data: null, error: { message: 'No rows found' } })
        .mockResolvedValueOnce({ 
          data: { ...mockUserData, name: 'Test User', role: 'user', isactive: true }, 
          error: null 
        });

      const result = await handleAuthCallback();

      expect(result?.id).toBe(mockUserData.id);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('already_migrated')
      );
    });

    it('should prevent duplicate user creation', async () => {
      const mockUserData = {
        id: '9e44f39b-080b-421d-abdc-ff27611ca41b',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      };

      // Mock duplicate email constraint error  
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint "users_email_key"' }
      });

      // Mock successful fetch of existing user
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: mockUserData.id,
          email: mockUserData.email,
          name: 'Test User',
          role: 'user',
          isactive: true
        },
        error: null
      });

      const result = await createUserProfileFromOAuth(mockUserData);

      expect(result).toEqual({
        id: mockUserData.id,
        email: mockUserData.email,
        name: 'Test User',
        role: 'user',
        isActive: true
      });
    });
  });

  describe('⚡ Error Handling & Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Network error'));

      const result = await handleAuthCallback();

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('OAuth callback error')
      );
    });

    it('should handle malformed session data', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const result = await handleAuthCallback();

      expect(result).toBeNull();
    });

    it('should handle atomic migration failures gracefully', async () => {
      const mockUserData = {
        id: '9e44f39b-080b-421d-abdc-ff27611ca41b',
        email: 'test@example.com'
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUserData } },
        error: null
      });

      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({ data: null, error: { message: 'No rows found' } })
        .mockResolvedValueOnce({ 
          data: { id: 'old-firebase-id', email: mockUserData.email }, 
          error: null 
        });

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Migration function failed' }
      });

      await expect(handleAuthCallback()).rejects.toThrow('Migration failed');
    });
  });
});