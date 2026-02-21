/**
 * Configuration for automatic role assignment
 * Users with these email addresses will automatically get the corresponding role when they first log in
 */

import { UserRole } from '../../types/User';

export const AUTO_ADMIN_EMAILS = [
  'gulmaranbrf@gmail.com',
  'tinautas@gmail.com',
  'tinautas@hotmail.com',
  'admin@example.com',
  // Add more admin emails here as needed
];

export const AUTO_BOARD_EMAILS: string[] = [
  // Add board member emails here as needed
];

/**
 * Check if an email should automatically get admin privileges
 */
export function shouldBeAdmin(email: string): boolean {
  if (!email) return false;

  const normalizedEmail = email.toLowerCase().trim();
  return AUTO_ADMIN_EMAILS.some(adminEmail =>
    adminEmail.toLowerCase().trim() === normalizedEmail
  );
}

/**
 * Check if an email should automatically get board privileges
 */
export function shouldBeBoard(email: string): boolean {
  if (!email) return false;

  const normalizedEmail = email.toLowerCase().trim();
  return AUTO_BOARD_EMAILS.some(boardEmail =>
    boardEmail.toLowerCase().trim() === normalizedEmail
  );
}

/**
 * Get the appropriate role for a new user based on their email
 */
export function getInitialUserRole(email: string): UserRole {
  if (shouldBeAdmin(email)) return 'admin';
  if (shouldBeBoard(email)) return 'board';
  return 'user';
}
