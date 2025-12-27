import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
  LazyGulmaranGPT,
  LazyFaultReportsList,
  CookieConsentBanner
} from './components/LazyComponents';

// Import AuthCallback for OAuth handling
import { AuthCallback } from './pages/auth/AuthCallback';
import MaintenancePlan from './pages/MaintenancePlan';

// Import AuthTest for testing (disabled, uncomment for debugging)
// import AuthTest from './AuthTest';
// Import LazyAuthCallback for OAuth redirects
// Import StandardLoading component
import { PageLoading } from './components/common/StandardLoading';
import { Button } from '@mui/material';
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
        <Route path="/maintenance-plan" element={
          <Layout><MaintenancePlan /></Layout>
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
          <Route path="gulmaran-gpt" element={
            <Suspense fallback={<LoadingFallback />}>
              <LazyGulmaranGPT />
            </Suspense>
          } />
          <Route path="felanmalningar" element={
            <Suspense fallback={<LoadingFallback />}>
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
      <CookieConsentBanner />
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
