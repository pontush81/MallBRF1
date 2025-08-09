import { lazy } from 'react';

// Auth Components
export const LazyLogin = lazy(() => import('../pages/auth/LoginNew').then(module => ({ default: module.LoginNew })));
export const LazyRegister = lazy(() => import('../pages/auth/Register'));

// Public Pages
export const LazyPageView = lazy(() => import('../pages/public/PageView'));  
export const LazyPublicPages = lazy(() => import('../pages/ModernPublicPages'));
export const LazyBookingPage = lazy(() => 
  import('../pages/public/BookingPage').then(module => ({ default: module.default }))
);
export const LazyBookingStatusPage = lazy(() => import('../pages/public/BookingStatusPage'));
export const LazyPrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
export const LazyDataDeletion = lazy(() => import('../pages/DataDeletion'));
export const LazyAbout = lazy(() => import('../pages/About'));
export const LazyTermsOfService = lazy(() => import('../pages/TermsOfService'));
export const LazyCookiePolicy = lazy(() => import('../pages/CookiePolicy'));
export const LazyAccessibility = lazy(() => import('../pages/Accessibility'));
export const LazyComplaints = lazy(() => import('../pages/Complaints'));
export const LazyContact = lazy(() => import('../pages/Contact'));
export const LazyNotFound = lazy(() => import('../pages/NotFound'));

// Admin Components  
export const LazyDashboard = lazy(() => import('../pages/admin/Dashboard'));
export const LazyDashboardHome = lazy(() => import('../pages/admin/DashboardHome'));
export const LazyPagesList = lazy(() => import('../pages/admin/PagesList'));
export const LazyPageEditor = lazy(() => import('../pages/admin/PageEditor'));

export const LazyUsersList = lazy(() => import('../pages/admin/UsersList'));

export const LazyNotificationSettings = lazy(() => import('../pages/admin/NotificationSettings'));
export const LazyMaintenancePlanPage = lazy(() => import('../pages/admin/MaintenancePlanPage'));
export const LazyDataRetentionManager = lazy(() => import('../pages/admin/DataRetentionManager'));

// Component Exports
// MIGRATION: BackupManager disabled - depends on Firebase
// export const LazyBackupManager = lazy(() => import('./BackupManager'));
export const LazyBookingDetails = lazy(() => import('./booking/BookingDetails'));
export const LazyBookingStatus = lazy(() => import('./booking/BookingStatus'));
export const LazyErrorBoundary = lazy(() => import('./ErrorBoundary'));
export const LazyHSBReportPreview = lazy(() => import('./HSBReportPreview'));
export const LazyLayout = lazy(() => import('./Layout'));
export const LazyLogo = lazy(() => import('./Logo'));
export const LazyStyledMarkdown = lazy(() => import('./StyledMarkdown'));
export const LazyThemeDesignSelector = lazy(() => import('./ThemeDesignSelector'));

// Modern Components
export const LazyModernHeader = lazy(() => import('./modern/ModernHeader'));
// export const LazyModernPagesList = lazy(() => import('./modern/ModernPagesList'));

// Common Components
// export const LazyBookingSkeleton = lazy(() => import('./common/BookingSkeleton'));
// export const LazyModernCard = lazy(() => import('./common/ModernCard'));
// export const LazyParkingChip = lazy(() => import('./common/ParkingChip'));
// export const LazyWeekChip = lazy(() => import('./common/WeekChip'));

// Maintenance Components  
export const LazyMaintenancePlan = lazy(() => import('./maintenance/MaintenancePlan'));
export const LazyMaintenanceTaskEditor = lazy(() => import('./maintenance/MaintenanceTaskEditor')); 

// GDPR Components
export const CookieConsentBanner = lazy(() => import('./CookieConsentBanner'));
// Note: GDPRRequestForm is directly imported in DataDeletion (no lazy loading to avoid nested conflicts) 