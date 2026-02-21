export type UserRole = 'user' | 'board' | 'admin';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  isActive?: boolean;
  pendingApproval?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface UserFormData {
  email: string;
  name?: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
}
