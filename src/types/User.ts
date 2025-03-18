export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface UserFormData {
  email: string;
  name?: string;
  password?: string;
  role: 'user' | 'admin';
  isActive: boolean;
} 