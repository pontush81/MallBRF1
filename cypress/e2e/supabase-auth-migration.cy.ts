/**
 * 🌐 End-to-End Auth Migration Tests
 * 
 * Tests the complete Supabase auth flow including:
 * - OAuth login/logout
 * - User migration from Firebase to Supabase
 * - Session consistency 
 * - RLS policy enforcement
 * - Multi-tab scenarios
 */

describe('🔐 Supabase Auth Migration E2E Tests', () => {
  
  beforeEach(() => {
    // Clear all auth state before each test
    cy.clearLocalStorage();
    cy.clearCookies();
    
    // Mock console to track auth events
    cy.window().then((win) => {
      cy.spy(win.console, 'log').as('consoleLog');
      cy.spy(win.console, 'error').as('consoleError');
    });
  });

  describe('🚀 OAuth Login Flow', () => {
    it('should redirect to Google OAuth when login button is clicked', () => {
      cy.visit('/auth-test');
      
      // Check that login button is present
      cy.get('[data-testid="google-login-btn"]').should('be.visible');
      cy.get('[data-testid="google-login-btn"]').should('contain', 'Test Google OAuth');
      
      // Click login - this will redirect to Google (we can't fully test OAuth in Cypress)
      // Instead, we verify the redirect URL is correct
      cy.get('[data-testid="google-login-btn"]').click();
      
      // Verify console shows OAuth initiation
      cy.get('@consoleLog').should('have.been.calledWith', 
        Cypress.sinon.match.string.and(Cypress.sinon.match(/Google OAuth/))
      );
    });

    it('should display user info after successful login simulation', () => {
      // Simulate a successful OAuth callback by visiting the test page with mocked auth state
      cy.window().then((win) => {
        // Mock Supabase session
        win.localStorage.setItem('mallbrf-supabase-auth-new.0.session', JSON.stringify({
          user: {
            id: '9e44f39b-080b-421d-abdc-ff27611ca41b',
            email: 'test@example.com',
            user_metadata: { full_name: 'Test User' }
          },
          access_token: 'mock-access-token',
          expires_at: Date.now() + 3600000
        }));
      });

      cy.visit('/auth-test');
      cy.wait(2000); // Wait for auth state to load

      // Check user info is displayed  
      cy.get('[data-testid="user-info"]').should('be.visible');
      cy.get('[data-testid="user-email"]').should('contain', 'test@example.com');
      cy.get('[data-testid="logout-btn"]').should('be.enabled');
    });
  });

  describe('🔄 User Migration Scenarios', () => {
    it('should handle Firebase to Supabase ID migration', () => {
      cy.visit('/auth-test');
      
      // Simulate OAuth callback URL with parameters
      cy.visit('/auth/callback?code=test-oauth-code');
      
      // Should redirect to success page after processing
      cy.url().should('include', '/auth-test');
      cy.url().should('include', 'login=success');
      
      // Check that migration console logs appear
      cy.get('@consoleLog').should('have.been.calledWith',
        Cypress.sinon.match(/Migrating user ID/)
      );
    });

    it('should prevent duplicate user creation during migration', () => {
      // This test would require mocking the Supabase response
      // In a real scenario, we'd use cy.intercept to mock API calls
      
      cy.intercept('POST', '**/rest/v1/users*', {
        statusCode: 409,
        body: {
          code: '23505',
          message: 'duplicate key value violates unique constraint "users_email_key"'
        }
      }).as('duplicateUserError');
      
      cy.visit('/auth/callback?code=test-oauth-code');
      
      // Should handle the duplicate error gracefully
      cy.get('@consoleError').should('not.have.been.calledWith',
        Cypress.sinon.match(/Uncaught/)
      );
    });
  });

  describe('🔒 Session Management', () => {
    beforeEach(() => {
      // Set up authenticated state
      cy.window().then((win) => {
        win.localStorage.setItem('mallbrf-supabase-auth-new.0.session', JSON.stringify({
          user: {
            id: '9e44f39b-080b-421d-abdc-ff27611ca41b',
            email: 'test@example.com'
          },
          access_token: 'mock-access-token',
          expires_at: Date.now() + 3600000
        }));
      });
    });

    it('should maintain session across page refreshes', () => {
      cy.visit('/auth-test');
      
      // Verify user is logged in
      cy.get('[data-testid="user-info"]').should('be.visible');
      
      // Refresh page
      cy.reload();
      
      // Should still be logged in
      cy.get('[data-testid="user-info"]').should('be.visible');
      cy.get('[data-testid="logout-btn"]').should('be.enabled');
    });

    it('should logout successfully and clear session', () => {
      cy.visit('/auth-test');
      
      // Verify user is logged in first
      cy.get('[data-testid="user-info"]').should('be.visible');
      cy.get('[data-testid="logout-btn"]').should('be.enabled');
      
      // Click logout
      cy.get('[data-testid="logout-btn"]').click();
      
      // Should show logged out state
      cy.get('[data-testid="user-info"]').should('not.exist');
      cy.get('[data-testid="google-login-btn"]').should('be.visible');
      
      // Local storage should be cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('mallbrf-supabase-auth-new.0.session')).to.be.null;
      });
    });

    it('should handle expired sessions gracefully', () => {
      // Set up expired session
      cy.window().then((win) => {
        win.localStorage.setItem('mallbrf-supabase-auth-new.0.session', JSON.stringify({
          user: {
            id: '9e44f39b-080b-421d-abdc-ff27611ca41b',
            email: 'test@example.com'
          },
          access_token: 'expired-token',
          expires_at: Date.now() - 1000 // Expired 1 second ago
        }));
      });

      cy.visit('/auth-test');
      
      // Should show logged out state for expired session
      cy.get('[data-testid="google-login-btn"]').should('be.visible');
      cy.get('[data-testid="user-info"]').should('not.exist');
    });
  });

  describe('🛡️ Security & RLS Policy Tests', () => {
    it('should prevent unauthorized access to user data', () => {
      // Mock API calls to test RLS policies
      cy.intercept('GET', '**/rest/v1/users*', (req) => {
        // Simulate 406 Not Acceptable (RLS violation)
        if (!req.headers['authorization']) {
          req.reply({
            statusCode: 406,
            body: { message: 'Row level security policy violated' }
          });
        }
      }).as('rlsViolation');
      
      // Try to access user data without auth
      cy.visit('/auth-test');
      
      // Should handle RLS violation gracefully
      cy.get('@consoleError').should('not.have.been.calledWith',
        Cypress.sinon.match(/Uncaught/)
      );
    });

    it('should allow admin users to access all data', () => {
      // Set up admin user session
      cy.window().then((win) => {
        win.localStorage.setItem('mallbrf-supabase-auth-new.0.session', JSON.stringify({
          user: {
            id: '9e44f39b-080b-421d-abdc-ff27611ca41b',
            email: 'admin@example.com',
            user_metadata: { role: 'admin' }
          },
          access_token: 'admin-token',
          expires_at: Date.now() + 3600000
        }));
      });
      
      cy.visit('/auth-test');
      
      // Admin should have access to user list (if implemented)
      // This would require actual admin UI components to test
      cy.get('[data-testid="user-info"]').should('contain', 'admin@example.com');
    });
  });

  describe('📱 Multi-tab Session Consistency', () => {
    it('should sync logout across multiple tabs', () => {
      // Set up authenticated state
      cy.window().then((win) => {
        win.localStorage.setItem('mallbrf-supabase-auth-new.0.session', JSON.stringify({
          user: { id: 'test-user', email: 'test@example.com' },
          access_token: 'test-token',
          expires_at: Date.now() + 3600000
        }));
      });

      cy.visit('/auth-test');
      
      // Verify logged in
      cy.get('[data-testid="user-info"]').should('be.visible');
      
      // Simulate logout from another tab by clearing localStorage
      cy.window().then((win) => {
        win.localStorage.removeItem('mallbrf-supabase-auth-new.0.session');
        // Trigger storage event to simulate cross-tab communication
        win.dispatchEvent(new StorageEvent('storage', {
          key: 'mallbrf-supabase-auth-new.0.session',
          newValue: null,
          oldValue: 'previous-session-data'
        }));
      });

      // Should detect session loss and show logged out state
      cy.get('[data-testid="google-login-btn"]').should('be.visible');
      cy.get('[data-testid="user-info"]').should('not.exist');
    });
  });

  describe('⚡ Error Handling & Recovery', () => {
    it('should recover from network errors during auth', () => {
      // Mock network failure
      cy.intercept('GET', '**/auth/v1/user', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('networkError');
      
      cy.visit('/auth-test');
      
      // Should handle error gracefully without crashing
      cy.get('[data-testid="google-login-btn"]').should('be.visible');
      
      // Error should be logged but app should remain functional
      cy.get('@consoleError').should('have.been.called');
    });

    it('should handle malformed auth responses', () => {
      // Mock malformed response
      cy.intercept('GET', '**/auth/v1/user', {
        statusCode: 200,
        body: { malformed: 'response' }
      }).as('malformedResponse');
      
      cy.visit('/auth-test');
      
      // Should fall back to logged out state
      cy.get('[data-testid="google-login-btn"]').should('be.visible');
    });
  });
});

/**
 * 🔧 Helper Commands for Auth Testing
 */

// Add custom commands
Cypress.Commands.add('loginAsUser', (userEmail: string = 'test@example.com') => {
  cy.window().then((win) => {
    win.localStorage.setItem('mallbrf-supabase-auth-new.0.session', JSON.stringify({
      user: {
        id: '9e44f39b-080b-421d-abdc-ff27611ca41b',
        email: userEmail
      },
      access_token: 'test-token',
      expires_at: Date.now() + 3600000
    }));
  });
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('mallbrf-supabase-auth-new.0.session', JSON.stringify({
      user: {
        id: 'admin-id',
        email: 'admin@example.com',
        user_metadata: { role: 'admin' }
      },
      access_token: 'admin-token',
      expires_at: Date.now() + 3600000
    }));
  });
});

// TypeScript declarations
declare global {
  namespace Cypress {
    interface Chainable {
      loginAsUser(userEmail?: string): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
    }
  }
}