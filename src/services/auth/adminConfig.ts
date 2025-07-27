/**
 * Configuration for automatic admin assignment
 * Users with these email addresses will automatically get admin role when they first log in
 */

export const AUTO_ADMIN_EMAILS = [
  'pontus.hberg@gmail.com',
  'tinautas@gmail.com', 
  'tinautas@hotmail.com',
  'admin@example.com',
  // Add more admin emails here as needed
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
 * Get the appropriate role for a new user based on their email
 */
export function getInitialUserRole(email: string): 'admin' | 'user' {
  return shouldBeAdmin(email) ? 'admin' : 'user';
} 