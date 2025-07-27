import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';

// Importera den nya ThemeProvider
import { ThemeProvider } from './context/ThemeContext';
import { startVersionCheck } from './utils/versionCheck';

// Debug tools för att lösa bokningsproblem
import './utils/debugBookings';

// Static imports
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PageProvider } from './context/PageContext';
import { MaintenanceProvider } from './context/MaintenanceContext';
import ScrollToTop from './components/ScrollToTop';

// Lazy loaded components
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const DashboardHome = React.lazy(() => import('./pages/admin/DashboardHome'));
const PagesList = React.lazy(() => import('./pages/admin/PagesList'));
const PageEditor = React.lazy(() => import('./pages/admin/PageEditor'));
const BookingsList = React.lazy(() => import('./pages/admin/BookingsList'));
const UsersList = React.lazy(() => import('./pages/admin/UsersList'));
const AllowlistManager = React.lazy(() => import('./pages/admin/AllowlistManager'));
const NotificationSettings = React.lazy(() => import('./pages/admin/NotificationSettings'));
const MaintenancePlanPage = React.lazy(() => import('./pages/admin/MaintenancePlanPage'));
const PageView = React.lazy(() => import('./pages/public/PageView'));
const PublicPages = React.lazy(() => import('./pages/ModernPublicPages'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const BookingPage = React.lazy(() => 
  import('./pages/public/BookingPage').then(module => ({ default: module.default }))
);
const BookingStatusPage = React.lazy(() => import('./pages/public/BookingStatusPage'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const DataDeletion = React.lazy(() => import('./pages/DataDeletion'));

// Loading component with timeout protection
const LoadingFallback = () => {
  const [showError, setShowError] = React.useState(false);
  
  // Timeout protection - if loading takes too long, show error
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowError(true);
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <Layout>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '60vh', 
        flexDirection: 'column',
        gap: '16px'
      }}>
        {!showError ? (
          <>
            <div className="loading-spinner">Laddar...</div>
            <p style={{ color: '#666', fontSize: '14px' }}>Väntar på sidan...</p>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#d32f2f' }}>
            <p>Sidan tar för lång tid att ladda.</p>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#1976d2', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Ladda om sidan
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

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
      <OfflineIndicator />
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
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <Suspense fallback={<LoadingFallback />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        }>
          <Route index element={
            <Suspense fallback={<LoadingFallback />}>
              <DashboardHome />
            </Suspense>
          } />
          <Route path="pages" element={
            <Suspense fallback={<LoadingFallback />}>
              <PagesList />
            </Suspense>
          } />
          <Route path="pages/new" element={
            <Suspense fallback={<LoadingFallback />}>
              <PageEditor />
            </Suspense>
          } />
          <Route path="pages/edit/:id" element={
            <Suspense fallback={<LoadingFallback />}>
              <PageEditor />
            </Suspense>
          } />
          <Route path="bookings" element={
            <Suspense fallback={<LoadingFallback />}>
              <BookingsList />
            </Suspense>
          } />
          <Route path="users" element={
            <Suspense fallback={<LoadingFallback />}>
              <UsersList />
            </Suspense>
          } />
          <Route path="allowlist" element={
            <Suspense fallback={<LoadingFallback />}>
              <AllowlistManager />
            </Suspense>
          } />
          <Route path="notifications" element={
            <Suspense fallback={<LoadingFallback />}>
              <NotificationSettings />
            </Suspense>
          } />
          <Route path="maintenance" element={
            <Suspense fallback={<LoadingFallback />}>
              <MaintenancePlanPage />
            </Suspense>
          } />
        </Route>
        
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
  useEffect(() => {
    // Start version checking to detect updates and prevent cache issues
    startVersionCheck();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CssBaseline />
        <AuthProvider>
          <PageProvider>
            <MaintenanceProvider>
              <AppRoutes />
            </MaintenanceProvider>
          </PageProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
