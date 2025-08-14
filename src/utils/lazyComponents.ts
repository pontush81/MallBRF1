import { lazy } from 'react';

// Lazy load heavy components to reduce main thread blocking
export const LazyPageEditor = lazy(() => 
  import('../pages/admin/PageEditor').then(module => ({
    default: module.default
  }))
);

export const LazyBookingPage = lazy(() => 
  import('../pages/public/BookingPage').then(module => ({
    default: module.default
  }))
);

export const LazyHSBReportEditor = lazy(() => 
  import('../components/HSBReportEditor').then(module => ({
    default: module.default
  }))
);

export const LazyMaintenancePlan = lazy(() => 
  import('../components/maintenance/SimpleMaintenancePlan').then(module => ({
    default: module.default
  }))
);

// Lazy load admin components
export const LazyUsersList = lazy(() => 
  import('../pages/admin/UsersList').then(module => ({
    default: module.default
  }))
);

export const LazyPagesList = lazy(() => 
  import('../pages/admin/PagesList').then(module => ({
    default: module.default
  }))
);
