import { lazy } from 'react';

// Lazy load heavy admin components
export const LazyBookingsList = lazy(() => import('../pages/admin/BookingsList'));
export const LazyUsersList = lazy(() => import('../pages/admin/UsersList'));
export const LazyPageEditor = lazy(() => import('../pages/admin/PageEditor'));
export const LazyMaintenancePlanPage = lazy(() => import('../pages/admin/MaintenancePlanPage'));

// Lazy load heavy public components  
export const LazyBookingPage = lazy(() => import('../pages/public/BookingPage'));
export const LazyPageView = lazy(() => import('../pages/public/PageView'));

// Lazy load heavy maintenance components
export const LazyMaintenancePlan = lazy(() => import('./maintenance/MaintenancePlan'));
export const LazyMaintenanceTaskEditor = lazy(() => import('./maintenance/MaintenanceTaskEditor')); 