// Debug utility för att lösa pages-laddningsproblem
import pageServiceSupabase from '../services/pageServiceSupabase';
import { clearAllAuthCaches } from '../services/supabaseClient';

// Lägg till i window för enkel åtkomst från browser console
declare global {
  interface Window {
    debugPages: {
      testPages: () => Promise<any>;
      clearAllCache: () => void;
      testAuth: () => Promise<any>;
      testRLS: () => Promise<any>;
      fullDiagnostic: () => Promise<void>;
      quickTest: () => Promise<void>;
      networkDiagnostic: () => Promise<void>;
      forceReload: () => void;
    };
  }
}

const debugPages = {
  // Testa pages direkt
  testPages: async () => {
    console.log('🧪 Testing pages directly...');
    try {
      const pages = await pageServiceSupabase.getVisiblePages();
      console.log('✅ Pages test successful:', pages.length, 'pages found');
      console.log('📄 Pages:', pages);
      return pages;
    } catch (error) {
      console.error('❌ Pages test failed:', error);
      throw error;
    }
  },

  // Rensa ALL cache
  clearAllCache: () => {
    console.log('🗑️ Clearing ALL caches...');
    
    // Rensa localStorage
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      if (key.includes('supabase') || key.includes('pages') || key.includes('auth')) {
        console.log('🗑️ Removing localStorage key:', key);
        localStorage.removeItem(key);
      }
    });
    
    // Rensa sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorageKeys.forEach(key => {
      if (key.includes('supabase') || key.includes('pages') || key.includes('auth')) {
        console.log('🗑️ Removing sessionStorage key:', key);
        sessionStorage.removeItem(key);
      }
    });
    
    // Rensa auth cache
    try {
      clearAllAuthCaches();
      console.log('✅ Auth cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear auth cache:', error);
    }
    
    console.log('✅ All cache cleared!');
  },

  // Testa auth status
  testAuth: async () => {
    console.log('🔐 Testing auth status...');
    try {
      const supabaseClient = await import('../services/supabaseClient');
      const supabase = supabaseClient.default;
      
      console.log('📡 Getting session with timeout...');
      
      // Add timeout to prevent hanging
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout after 5 seconds')), 5000)
      );
      
      const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
      const { data: { session }, error } = result;
      
      if (error) {
        console.error('❌ Session error:', error);
        throw error;
      }
      
      console.log('📊 Auth session:', session);
      console.log('👤 User:', session?.user?.email || 'No user');
      console.log('🔑 Token exists:', !!session?.access_token);
      
      return session;
    } catch (error) {
      console.error('❌ Auth test failed:', error);
      
      // Try fallback - check localStorage directly
      try {
        console.log('🔄 Trying localStorage fallback...');
        const keys = Object.keys(localStorage).filter(k => k.includes('supabase'));
        console.log('🔍 Supabase localStorage keys:', keys);
        
        for (const key of keys) {
          const value = localStorage.getItem(key);
          if (value && value.includes('access_token')) {
            console.log('🔑 Found auth token in localStorage:', key);
            try {
              const authData = JSON.parse(value);
              console.log('📊 Auth data from localStorage:', authData);
            } catch (parseError) {
              console.log('📊 Raw auth data:', value.substring(0, 100) + '...');
            }
          }
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
      
      throw error;
    }
  },

  // Testa RLS policies
  testRLS: async () => {
    console.log('🛡️ Testing RLS policies...');
    try {
      const supabaseClient = await import('../services/supabaseClient');
      const supabase = supabaseClient.default;
      
      console.log('📡 Querying pages table...');
      const { data, error } = await supabase
        .from('pages')
        .select('id, title, ispublished, show')
        .eq('ispublished', true)
        .eq('show', true);
      
      if (error) {
        console.error('❌ RLS test failed:', error);
        throw error;
      }
      
      console.log('✅ RLS test successful:', data?.length, 'pages found');
      console.log('📄 RLS data:', data);
      return data;
    } catch (error) {
      console.error('❌ RLS test failed:', error);
      throw error;
    }
  },

  // Full diagnostik
  fullDiagnostic: async () => {
    console.log('🏥 Running full diagnostic...');
    console.log('=================================');
    
    try {
      // 1. Auth status
      console.log('1️⃣ Checking auth status...');
      await debugPages.testAuth();
      
      // 2. RLS test
      console.log('2️⃣ Testing RLS policies...');
      await debugPages.testRLS();
      
      // 3. Service test
      console.log('3️⃣ Testing page service...');
      await debugPages.testPages();
      
      // 4. Context check
      console.log('4️⃣ Checking localStorage...');
      const pagesCacheTime = localStorage.getItem('pages_last_load');
      console.log('📅 Pages last load:', pagesCacheTime ? new Date(parseInt(pagesCacheTime)).toISOString() : 'Never');
      
      const currentUser = localStorage.getItem('currentUser');
      console.log('👤 Current user in localStorage:', currentUser ? JSON.parse(currentUser).email : 'None');
      
      console.log('✅ Full diagnostic complete!');
      
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
    }
  },

  // Snabb test som hoppar över auth
  quickTest: async () => {
    console.log('⚡ Running quick test (skipping auth)...');
    console.log('=================================');
    
    try {
      // 1. Service test
      console.log('1️⃣ Testing page service...');
      await debugPages.testPages();
      
      // 2. Context check
      console.log('2️⃣ Checking localStorage...');
      const pagesCacheTime = localStorage.getItem('pages_last_load');
      console.log('📅 Pages last load:', pagesCacheTime ? new Date(parseInt(pagesCacheTime)).toISOString() : 'Never');
      
      console.log('✅ Quick test complete!');
      
    } catch (error) {
      console.error('❌ Quick test failed:', error);
    }
  },

  // Network diagnostic för produktionsproblem
  networkDiagnostic: async () => {
    console.log('🌐 Running network diagnostic...');
    console.log('===============================');
    
    try {
      // 1. Basic connectivity test
      console.log('1️⃣ Testing basic connectivity to Supabase...');
      const supabaseUrl = 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
      
      const connectivityTest = async (url: string, timeout: number) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const startTime = Date.now();
          const response = await fetch(url + '/rest/v1/', {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjkzMDgsImV4cCI6MjA4NjYyOTMwOH0.g-h09pMoIHGxxOfCOu97hK5TB0_BAtGrAl9CBxWhRwk'
            }
          });
          const duration = Date.now() - startTime;
          clearTimeout(timeoutId);
          
          console.log(`✅ Connectivity test successful: ${response.status} (${duration}ms)`);
          return { success: true, duration, status: response.status };
        } catch (error) {
          clearTimeout(timeoutId);
          console.error(`❌ Connectivity test failed:`, error);
          return { success: false, error: error.message };
        }
      };
      
      // Test with different timeouts
      await connectivityTest(supabaseUrl, 5000);
      await connectivityTest(supabaseUrl, 10000);
      
      // 2. Environment info
      console.log('2️⃣ Environment information:');
      console.log('📍 Location:', window.location.href);
      console.log('🌍 User Agent:', navigator.userAgent);
      console.log('🔗 Connection:', (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : 'Not available');
      
      // 3. DNS resolution test
      console.log('3️⃣ Testing DNS resolution...');
      try {
        const dnsStart = Date.now();
        await fetch(`${supabaseUrl}/rest/v1/`, { method: 'HEAD', mode: 'no-cors' });
        console.log(`✅ DNS resolution: ${Date.now() - dnsStart}ms`);
      } catch (error) {
        console.error('❌ DNS resolution failed:', error);
      }
      
      console.log('✅ Network diagnostic complete!');
      
    } catch (error) {
      console.error('❌ Network diagnostic failed:', error);
    }
  },

  // Force reload med cache clear
  forceReload: () => {
    console.log('🔄 Force reloading with cache clear...');
    debugPages.clearAllCache();
    
    // Unregister service worker om det finns
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          console.log('🗑️ Unregistering service worker');
          registration.unregister();
        });
        
        // Reload efter service worker cleanup
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      });
    } else {
      window.location.reload();
    }
  }
};

// Lägg till i window för åtkomst från browser console
if (typeof window !== 'undefined') {
  window.debugPages = debugPages;
  console.log('🐛 Pages Debug tools loaded! Use window.debugPages in console:');
  console.log('• window.debugPages.testPages() - Test pages service');
  console.log('• window.debugPages.clearAllCache() - Clear all cache');
  console.log('• window.debugPages.testAuth() - Test auth status');
  console.log('• window.debugPages.testRLS() - Test RLS policies');
  console.log('• window.debugPages.fullDiagnostic() - Run full diagnostic');
  console.log('• window.debugPages.forceReload() - Force reload with cache clear');
}

export default debugPages;
