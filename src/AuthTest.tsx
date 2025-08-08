import React from 'react';
import { AuthProvider } from './context/AuthContextNew';
import { TestAuth } from './components/TestAuth';

const AuthTest: React.FC = () => {
  return (
    <AuthProvider>
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>🧪 Supabase Auth Test</h1>
        <TestAuth />
      </div>
    </AuthProvider>
  );
};

export default AuthTest;