export interface CookiePreferences {
  necessary: boolean;
  authentication: boolean;
  analytics: boolean;
  consentDate?: string;
  consentVersion?: string;
  expiryDate?: string;
}

class CookieConsentService {
  private static instance: CookieConsentService;
  private preferences: CookiePreferences | null = null;
  private listeners: ((preferences: CookiePreferences) => void)[] = [];

  private constructor() {
    this.loadPreferences();
  }

  public static getInstance(): CookieConsentService {
    if (!CookieConsentService.instance) {
      CookieConsentService.instance = new CookieConsentService();
    }
    return CookieConsentService.instance;
  }

  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem('gdpr-consent');
      if (stored) {
        this.preferences = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading cookie preferences:', error);
    }
  }

  public getPreferences(): CookiePreferences | null {
    return this.preferences;
  }

  public hasConsent(): boolean {
    if (!this.preferences) return false;
    
    // Check if consent has expired
    if (this.preferences.expiryDate) {
      const expiry = new Date(this.preferences.expiryDate);
      const now = new Date();
      if (now > expiry) {
        // Consent has expired, clear it
        this.clearConsent();
        return false;
      }
    }
    
    return true;
  }

  public isConsentExpired(): boolean {
    if (!this.preferences || !this.preferences.expiryDate) return false;
    
    const expiry = new Date(this.preferences.expiryDate);
    const now = new Date();
    return now > expiry;
  }

  public hasAuthenticationConsent(): boolean {
    return this.preferences?.authentication === true;
  }

  public hasAnalyticsConsent(): boolean {
    return this.preferences?.analytics === true;
  }

  public updatePreferences(preferences: CookiePreferences): void {
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setFullYear(now.getFullYear() + 1); // Consent expires after 1 year
    
    const enrichedPreferences: CookiePreferences = {
      ...preferences,
      consentDate: now.toISOString(),
      consentVersion: '1.0', // Update this when cookie policy changes
      expiryDate: expiryDate.toISOString()
    };
    
    this.preferences = enrichedPreferences;
    try {
      localStorage.setItem('gdpr-consent', JSON.stringify(enrichedPreferences));
      localStorage.setItem('gdpr-consent-date', now.toISOString());
    } catch (error) {
      console.error('Error saving cookie preferences:', error);
    }
    
    // Notify listeners
    this.listeners.forEach(listener => listener(enrichedPreferences));
  }

  public addListener(listener: (preferences: CookiePreferences) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (preferences: CookiePreferences) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  public canUseSupabaseAuth(): boolean {
    // Allow Supabase auth if user hasn't made a choice yet, or has given authentication consent
    // For new users (no consent given), authentication is available by default
    const hasUserMadeChoice = this.hasConsent();
    const hasAuthConsent = this.hasAuthenticationConsent();
    
    // If user hasn't made any choice yet, allow authentication (first-time visitors)
    if (!hasUserMadeChoice) {
      return true;
    }
    
    // If user has made a choice, respect their authentication preference
    return hasAuthConsent;
  }

  public canUseGoogleOAuth(): boolean {
    return this.canUseSupabaseAuth();
  }

  public canUseAnalytics(): boolean {
    return this.hasAnalyticsConsent();
  }

  // Method to clear all consent (for testing or reset)
  public clearConsent(): void {
    this.preferences = null;
    localStorage.removeItem('gdpr-consent');
    localStorage.removeItem('gdpr-consent-date');
    this.listeners.forEach(listener => listener({
      necessary: true,
      authentication: false,
      analytics: false
    }));
  }
}

// Export singleton instance
export const cookieConsentService = CookieConsentService.getInstance();

// Helper hooks for React components
export const useCookieConsent = () => {
  const service = cookieConsentService;
  
  return {
    hasConsent: service.hasConsent(),
    isConsentExpired: service.isConsentExpired(),
    preferences: service.getPreferences(),
    canUseSupabaseAuth: service.canUseSupabaseAuth(),
    canUseGoogleOAuth: service.canUseGoogleOAuth(),
    canUseAnalytics: service.canUseAnalytics(),
    updatePreferences: (prefs: CookiePreferences) => service.updatePreferences(prefs),
    clearConsent: () => service.clearConsent()
  };
}; 