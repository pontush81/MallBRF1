describe('Authentication Flow', () => {
  beforeEach(() => {
    // Reset any previous state
    cy.window().then((win) => {
      win.localStorage.clear();
    });
  });

  it('should allow user to register and login', () => {
    const testUser = {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User'
    };

    // Register new user
    cy.visit('/register');
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('input[name="confirmPassword"]').type(testUser.password);
    cy.get('input[name="name"]').type(testUser.name);
    cy.get('button[type="submit"]').click();

    // Should be redirected to pages after successful registration
    cy.url().should('include', '/pages');

    // Logout
    cy.get('[data-testid="logout-button"]').click();

    // Try to login with the new account
    cy.visit('/login');
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();

    // Should be redirected to pages after successful login
    cy.url().should('include', '/pages');
  });

  it('should show error for invalid login', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Should show error message
    cy.contains(/felaktig e-post eller lösenord/i).should('be.visible');
  });

  it('should validate registration form', () => {
    cy.visit('/register');
    cy.get('button[type="submit"]').click();

    // Should show validation errors
    cy.contains(/alla fält måste fyllas i/i).should('be.visible');

    // Test password mismatch
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('differentpassword');
    cy.get('button[type="submit"]').click();

    cy.contains(/lösenorden matchar inte/i).should('be.visible');
  });

  it('should allow login with demo account', () => {
    cy.visit('/login');
    
    // Click the demo user button
    cy.contains('button', /användare/i).click();

    // Verify form is filled with demo credentials
    cy.get('input[name="email"]').should('have.value', 'user@example.com');
    cy.get('input[name="password"]').should('have.value', 'password123');

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Should be redirected to pages after successful login
    cy.url().should('include', '/pages');
  });
}); 