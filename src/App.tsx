import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

// Static imports
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PageProvider } from './context/PageContext';
import ScrollToTop from './components/ScrollToTop';

// Lazy loaded components
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const PageView = React.lazy(() => import('./pages/public/PageView'));
const PublicPages = React.lazy(() => import('./pages/PublicPages'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const BookingPage = React.lazy(() => import('./pages/public/BookingPage'));
const BookingStatusPage = React.lazy(() => import('./pages/public/BookingStatusPage'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const DataDeletion = React.lazy(() => import('./pages/DataDeletion'));

// Loading component
const LoadingFallback = () => (
  <Layout>
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <div className="loading-spinner">Laddar...</div>
    </div>
  </Layout>
);

// Protected route component
const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { isLoggedIn, isAdmin } = useAuth();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/pages" replace />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Redirect root to pages */}
        <Route path="/" element={<Navigate to="/pages" replace />} />
        
        {/* Public routes with lazy loading */}
        <Route path="/login" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><Login /></Layout>
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><Register /></Layout>
          </Suspense>
        } />
        <Route path="/page/:id" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><PageView /></Layout>
          </Suspense>
        } />
        <Route path="/pages" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><PublicPages /></Layout>
          </Suspense>
        } />
        <Route path="/booking" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><BookingPage /></Layout>
          </Suspense>
        } />
        <Route path="/booking/status" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><BookingStatusPage /></Layout>
          </Suspense>
        } />
        <Route path="/privacy-policy" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><PrivacyPolicy /></Layout>
          </Suspense>
        } />
        <Route path="/data-deletion" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><DataDeletion /></Layout>
          </Suspense>
        } />
        
        {/* Protected routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute adminOnly>
            <Suspense fallback={<LoadingFallback />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        } />
        
        {/* Fallback route */}
        <Route path="*" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><NotFound /></Layout>
          </Suspense>
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <PageProvider>
          <AppRoutes />
        </PageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
