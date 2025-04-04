export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  isActive?: boolean;
  pendingApproval?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface UserFormData {
  email: string;
  name?: string;
  password?: string;
  role: 'user' | 'admin';
  isActive: boolean;
} 