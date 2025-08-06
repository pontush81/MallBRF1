export interface TenantConfig {
  id: string;
  name: string;
  slug: string; // används för handbok.org/slug
  domain?: string; // för custom domains som gulmaran.com
  theme: 'gulmaran' | 'handbok' | 'default';
  features: string[];
  databaseSchema: string;
  settings: {
    primaryColor?: string;
    logo?: string;
    contactEmail?: string;
    phone?: string;
    address?: string;
    showBooking?: boolean;
    showMaintenance?: boolean;
  };
  subscription: {
    plan: 'trial' | 'basic' | 'premium';
    trialEndsAt?: string;
    isActive: boolean;
  };
}

// Predefined tenant configurations
const tenantConfigs: TenantConfig[] = [
  {
    id: 'gulmaran',
    name: 'BRF Gulmåran',
    slug: 'gulmaran',
    domain: 'gulmaran.com',
    theme: 'gulmaran',
    features: ['booking', 'maintenance', 'documents', 'advanced-editor'],
    databaseSchema: 'public', // existing schema
    settings: {
      primaryColor: '#1976d2',
      contactEmail: 'gulmaranbrf@gmail.com',
      showBooking: true,
      showMaintenance: true,
    },
    subscription: {
      plan: 'premium',
      isActive: true,
    }
  },
  {
    id: 'solgläntan',
    name: 'BRF Solgläntan', 
    slug: 'solgläntan',
    theme: 'handbok',
    features: ['documents', 'contacts', 'basic-editor'],
    databaseSchema: 'solgläntan_schema',
    settings: {
      primaryColor: '#2e7d32',
      contactEmail: '08-123 45 67',
      showBooking: false,
      showMaintenance: false,
    },
    subscription: {
      plan: 'trial',
      trialEndsAt: '2025-02-28',
      isActive: true,
    }
  }
];

class TenantService {
  private static instance: TenantService;
  private currentTenant: TenantConfig | null = null;

  private constructor() {}

  public static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }

  // Resolve tenant based on current URL
  public resolveTenant(): TenantConfig | null {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // Check for custom domain first (like gulmaran.com)
    const domainTenant = tenantConfigs.find(config => config.domain === hostname);
    if (domainTenant) {
      this.currentTenant = domainTenant;
      return domainTenant;
    }

    // Check for handbok.org path-based routing
    if (hostname === 'handbok.org' || hostname === 'localhost') {
      const pathSegments = pathname.split('/').filter(segment => segment);
      if (pathSegments.length > 0) {
        const slug = pathSegments[0];
        const pathTenant = tenantConfigs.find(config => config.slug === slug);
        if (pathTenant) {
          this.currentTenant = pathTenant;
          return pathTenant;
        }
      }
      
      // If on handbok.org root without specific tenant, return null (show landing page)
      if (hostname === 'handbok.org' && pathSegments.length === 0) {
        return null;
      }
    }

    // Default fallback for development
    if (hostname === 'localhost' && !this.currentTenant) {
      this.currentTenant = tenantConfigs[0]; // gulmaran for dev
      return this.currentTenant;
    }

    return null;
  }

  public getCurrentTenant(): TenantConfig | null {
    if (!this.currentTenant) {
      return this.resolveTenant();
    }
    return this.currentTenant;
  }

  public getTenantBySlug(slug: string): TenantConfig | null {
    return tenantConfigs.find(config => config.slug === slug) || null;
  }

  public getAllTenants(): TenantConfig[] {
    return [...tenantConfigs];
  }

  public isHandbokLandingPage(): boolean {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    return (hostname === 'handbok.org' || hostname.includes('handbok')) && 
           (pathname === '/' || pathname === '');
  }

  // Check if current user has access to tenant admin
  public canAccessTenantAdmin(tenant: TenantConfig): boolean {
    // This would integrate with your existing auth system
    // For now, simple logic based on tenant
    return tenant.id === 'gulmaran'; // Only gulmaran has full admin for now
  }

  // Get database schema for current tenant
  public getDatabaseSchema(): string {
    const tenant = this.getCurrentTenant();
    return tenant?.databaseSchema || 'public';
  }

  // Check if feature is enabled for current tenant
  public hasFeature(feature: string): boolean {
    const tenant = this.getCurrentTenant();
    return tenant?.features.includes(feature) || false;
  }
}

export default TenantService.getInstance(); 