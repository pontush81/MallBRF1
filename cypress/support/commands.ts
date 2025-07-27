// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

// Custom commands for HSB testing
Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/login');
  cy.get('input[type="email"]').type('tinautas@gmail.com');
  cy.get('input[type="password"]').type('password123');
  cy.get('form').submit();
  cy.url().should('include', '/admin');
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>
    }
  }
} 