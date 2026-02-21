import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';

// Import cache management for automatic Safari iPhone fixes
import { initCacheManagement } from './utils/cacheManager';

// Importera den nya ThemeProvider
import { ThemeProvider } from './context/ThemeContext';


// Debug tools removed for production performance

// Static imports
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';
// Using Supabase Auth system (CLEANED UP - removed old Firebase auth)
import { AuthProvider, useAuth } from './context/AuthContextNew';
import { PageProvider } from './context/PageContext';
import { MaintenanceProvider } from './context/MaintenanceContext';
import ScrollToTop from './components/ScrollToTop';
// AuthCallback removed - OAuth now redirects to root and is handled automatically
// Direct import for ModernPublicPages to avoid lazy loading issues
import ModernPublicPages from './pages/ModernPublicPages';

// Lazy loaded components
import { 
  LazyLogin, 
  LazyRegister, 
  LazyPageView, 

  LazyBookingPage,
  LazyBookingStatusPage,
  LazyPrivacyPolicy,
  LazyDataDeletion,
  LazyAbout,
  LazyTermsOfService,
  LazyCookiePolicy,
  LazyAccessibility,
  LazyComplaints,
  LazyStadgar,
  LazyFaultReportPage,
  LazyFaultReportStatus,
  LazyDashboard,
  LazyDashboardHome,
  LazyPagesList,
  LazyPageEditor,

  LazyUsersList,

  LazyNotificationSettings,
  LazyMaintenancePlanPage,
  LazyDataRetentionManager,
  LazyNotFound,
  LazyHSBReportEditor,
  LazyFaultReportsList,
  CookieConsentBanner
} from './components/LazyComponents';

// Import AuthCallback for OAuth handling
import { AuthCallback } from './pages/auth/AuthCallback';

// Import AuthTest for testing (disabled, uncomment for debugging)
// import AuthTest from './AuthTest';
// Import LazyAuthCallback for OAuth redirects
// Import StandardLoading component
import { PageLoading } from './components/common/StandardLoading';
import { Button, Fab, Tooltip } from '@mui/material';
import { Build as ReportIcon } from '@mui/icons-material';
import { initMobileOptimizations } from './utils/mobileOptimizations';
import { initPerformanceOptimizations } from './utils/performanceOptimizations';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

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
  
  if (showError) {
    return (
      <Layout>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center', color: '#d32f2f' }}>
            <p>Sidan tar för lång tid att ladda.</p>
            <Button 
              variant="contained"
              onClick={() => window.location.reload()}
            >
              Ladda om sidan
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <PageLoading message="Väntar på sidan..." />
    </Layout>
  );
};

// Simple loading fallback for admin routes (no nested Layout)
const AdminLoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
    <PageLoading message="Laddar..." />
  </div>
);

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isLoggedIn, currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    // Board members who try admin-only pages → redirect to admin home
    if (currentUser.role === 'board') {
      return <Navigate to="/admin" replace />;
    }
    // Regular users → redirect to public pages
    return <Navigate to="/pages" replace />;
  }

  return <>{children}</>;
};

// Floating fault report button - visible on all pages except /felanmalan
const FaultReportFab = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname.startsWith('/felanmalan') || location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <Tooltip title="Felanmälan" placement="left">
      <Fab
        size="medium"
        aria-label="Gör en felanmälan"
        onClick={() => navigate('/felanmalan')}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, md: 24 },
          right: { xs: 16, md: 24 },
          bgcolor: '#6b7c8d',
          color: '#fff',
          '&:hover': { bgcolor: '#556270' },
          zIndex: 1000,
        }}
      >
        <ReportIcon />
      </Fab>
    </Tooltip>
  );
};

function AppRoutes() {
  return (
    <Router>
      <ScrollToTop />
      <OfflineIndicator />
      <FaultReportFab />
      <Routes>
        {/* Root and /pages both show the handbook */}
        <Route path="/" element={<Layout><ModernPublicPages /></Layout>} />
        <Route path="/pages" element={<Layout><ModernPublicPages /></Layout>} />
        
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
        <Route path="/stadgar" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyStadgar /></Layout>
          </Suspense>
        } />
<Route path="/felanmalan" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyFaultReportPage /></Layout>
          </Suspense>
        } />
        <Route path="/felanmalan/status" element={
          <Suspense fallback={<LoadingFallback />}>
            <Layout><LazyFaultReportStatus /></Layout>
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
        
        {/* OAuth callback route for Supabase */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin', 'board']}>
            <Suspense fallback={<AdminLoadingFallback />}>
              <LazyDashboard />
            </Suspense>
          </ProtectedRoute>
        }>
          <Route index element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <LazyDashboardHome />
            </Suspense>
          } />
          <Route path="pages" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <LazyPagesList />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="pages/new" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <LazyPageEditor />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="pages/edit/:id" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <LazyPageEditor />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <LazyUsersList />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="notifications" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <LazyNotificationSettings />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="maintenance" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <LazyMaintenancePlanPage />
            </Suspense>
          } />
          <Route path="data-retention" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <LazyDataRetentionManager />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="hsb-report" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Suspense fallback={<AdminLoadingFallback />}>
                <LazyHSBReportEditor />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="felanmalningar" element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <LazyFaultReportsList />
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
      <Suspense fallback={null}>
        <CookieConsentBanner />
      </Suspense>
    </Router>
  );
}

// Automatisk cache-clearing för att lösa localhost-problem
const clearBadCache = async () => {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const localhostCaches = cacheNames.filter(name => 
        name.includes('localhost') || name.includes('3000')
      );
      
      if (localhostCaches.length > 0) {
        console.log('🧹 Clearing localhost caches:', localhostCaches);
        await Promise.all(localhostCaches.map(name => caches.delete(name)));
      }
    }
    
    // Avregistrera service workers som refererar localhost
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        if (registration.scope.includes('localhost') || registration.scope.includes('3000')) {
          console.log('🧹 Unregistering localhost service worker:', registration.scope);
          await registration.unregister();
        }
      }
    }
  } catch (error) {
    console.warn('Cache clearing failed:', error);
  }
};

// Removed temporary OAuth redirect fix - now using proper /auth/callback route

function App() {
  // Rensa dålig cache vid app-start och initiera optimeringar
  useEffect(() => {
    clearBadCache();
    initMobileOptimizations();
    initPerformanceOptimizations();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CssBaseline />
        <AuthProvider>
          <PageProvider>
            <MaintenanceProvider>
              <AppRoutes />
              <Analytics />
              <SpeedInsights />
            </MaintenanceProvider>
          </PageProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
