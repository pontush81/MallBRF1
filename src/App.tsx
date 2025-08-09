import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';

// Importera den nya ThemeProvider
import { ThemeProvider } from './context/ThemeContext';


// Debug tools för att lösa bokningsproblem
import './utils/debugBookings';
import './utils/debugPages';

// Static imports
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
// MIGRATION: Using new Supabase Auth system instead of Firebase
// import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthProvider, useAuth } from './context/AuthContextNew';
import { PageProvider } from './context/PageContext';
import { MaintenanceProvider } from './context/MaintenanceContext';
import ScrollToTop from './components/ScrollToTop';

// Lazy loaded components
import { 
  LazyLogin, 
  LazyRegister, 
  LazyPageView, 
  LazyPublicPages,
  LazyBookingPage,
  LazyBookingStatusPage,
  LazyPrivacyPolicy,
  LazyDataDeletion,
  LazyAbout,
  LazyTermsOfService,
  LazyCookiePolicy,
  LazyAccessibility,
  LazyComplaints,
  LazyContact,
  LazyDashboard,
  LazyDashboardHome,
  LazyPagesList,
  LazyPageEditor,

  LazyUsersList,

  LazyNotificationSettings,
  LazyMaintenancePlanPage,
  LazyDataRetentionManager,
  LazyNotFound,
  LazyAuthCallback,
  LazyHSBReportEditor,
  CookieConsentBanner
} from './components/LazyComponents';

// Import AuthTest for testing (disabled, uncomment for debugging)
// import AuthTest from './AuthTest';
// Import LazyAuthCallback for OAuth redirects

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
  const { isLoggedIn, isAdmin, loading } = useAuth();
  
  // Show loading while auth state is being determined
  if (loading) {
    return <LoadingFallback />;
  }
  
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
            <Layout><LazyLogin /></Layout>
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyRegister /></Layout>
          </Suspense>
        } />
        <Route path="/page/:id" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyPageView /></Layout>
          </Suspense>
        } />
        <Route path="/pages" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyPublicPages /></Layout>
          </Suspense>
        } />
        <Route path="/booking" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyBookingPage /></Layout>
          </Suspense>
        } />
        <Route path="/booking/status" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyBookingStatusPage /></Layout>
          </Suspense>
        } />
        <Route path="/privacy-policy" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyPrivacyPolicy /></Layout>
          </Suspense>
        } />
        <Route path="/data-deletion" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyDataDeletion /></Layout>
          </Suspense>
        } />
        <Route path="/about" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyAbout /></Layout>
          </Suspense>
        } />
        <Route path="/terms-of-service" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyTermsOfService /></Layout>
          </Suspense>
        } />
        <Route path="/cookie-policy" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyCookiePolicy /></Layout>
          </Suspense>
        } />
        <Route path="/accessibility" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyAccessibility /></Layout>
          </Suspense>
        } />
        <Route path="/complaints" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyComplaints /></Layout>
          </Suspense>
        } />
        <Route path="/contact" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyContact /></Layout>
          </Suspense>
        } />
        
        {/* 🧪 AUTH TEST ROUTE - DISABLED (uncomment for debugging) */}
        {/* 
        <Route path="/auth-test" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><AuthTest /></Layout>
          </Suspense>
        } />
        */}
        
        {/* 🔐 OAuth Callback Route */}
        <Route path="/auth/callback" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyAuthCallback /></Layout>
          </Suspense>
        } />
        
        {/* Protected routes */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <Suspense fallback={<LoadingFallback />}>
              <LazyDashboard />
            </Suspense>
          </ProtectedRoute>
        }>
          <Route index element={
            <Suspense fallback={<LoadingFallback />}>
              <LazyDashboardHome />
            </Suspense>
          } />
          <Route path="pages" element={
            <Suspense fallback={<LoadingFallback />}>
              <LazyPagesList />
            </Suspense>
          } />
          <Route path="pages/new" element={
            <Suspense fallback={<LoadingFallback />}>
              <LazyPageEditor />
            </Suspense>
          } />
          <Route path="pages/edit/:id" element={
            <Suspense fallback={<LoadingFallback />}>
              <LazyPageEditor />
            </Suspense>
          } />

          <Route path="users" element={
            <Suspense fallback={<LoadingFallback />}>
              <LazyUsersList />
            </Suspense>
          } />

          <Route path="notifications" element={
            <Suspense fallback={<LoadingFallback />}>
              <LazyNotificationSettings />
            </Suspense>
          } />
          <Route path="maintenance" element={
            <Suspense fallback={<LoadingFallback />}>
              <LazyMaintenancePlanPage />
            </Suspense>
          } />
          <Route path="data-retention" element={
            <Suspense fallback={<LoadingFallback />}>
              <LazyDataRetentionManager />
            </Suspense>
          } />
          <Route path="hsb-report" element={
            <Suspense fallback={<LoadingFallback />}>
              <LazyHSBReportEditor />
            </Suspense>
          } />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyNotFound /></Layout>
          </Suspense>
        } />
      </Routes>
      <CookieConsentBanner />
    </Router>
  );
}

function App() {
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
