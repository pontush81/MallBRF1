// Debug utility för att lösa boknings-laddningsproblem
import bookingServiceSupabase from '../services/bookingServiceSupabase';

// Lägg till i window för enkel åtkomst från browser console
declare global {
  interface Window {
    debugBookings: {
      forceRefresh: () => Promise<void>;
      clearCache: () => void;
      clearAuthCache: () => void;
      testAPI: () => Promise<void>;
      getBookings: () => Promise<any>;
    };
  }
}

const debugBookings = {
  // Force refresh alla bokningar
  forceRefresh: async () => {
    console.log('🔄 Force refreshing bookings...');
    try {
      // No cache to clear - Supabase service fetches fresh data directly
      const bookings = await bookingServiceSupabase.getAllBookings();
      console.log('✅ Refreshed bookings:', bookings);
      
      // Trigga en page reload för att uppdatera UI
      window.location.reload();
    } catch (error) {
      console.error('❌ Failed to refresh bookings:', error);
    }
  },

  // Rensa cache helt (no-op for Supabase service)
  clearCache: () => {
    console.log('🗑️ No cache to clear - Supabase service fetches fresh data directly');
    console.log('✅ Cache cleared (no-op)!');
  },

  // Rensa auth cache (för JWT token problem)
  clearAuthCache: () => {
    console.log('🗑️ Clearing ALL auth caches...');
    try {
      const { clearAllAuthCaches } = require('../services/supabaseClient');
      clearAllAuthCaches();
      console.log('✅ Auth cache cleared! Try your operation again.');
    } catch (error) {
      console.error('❌ Failed to clear auth cache:', error);
    }
  },

  // Testa API direkt
  testAPI: async () => {
    console.log('🧪 Testing API directly...');
    try {
      const response = await fetch('http://localhost:3002/api/bookings', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        mode: 'cors',
        credentials: 'include'
      });
      
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API working, got data:', data);
      } else {
        const errorText = await response.text();
        console.log('❌ API error:', errorText);
      }
    } catch (error) {
      console.error('❌ API test failed:', error);
    }
  },

  // Hämta bokningar med logging
  getBookings: async () => {
    console.log('📖 Getting bookings with full logging...');
    try {
      const bookings = await bookingServiceSupabase.getAllBookings();
      console.log('📊 Bookings result:', bookings);
      return bookings;
    } catch (error) {
      console.error('❌ Get bookings failed:', error);
      return [];
    }
  }
};

// Lägg till i window för åtkomst från browser console
if (typeof window !== 'undefined') {
  window.debugBookings = debugBookings;
  console.log('🐛 Debug tools loaded! Use window.debugBookings in console:');
  console.log('• window.debugBookings.forceRefresh() - Force refresh bookings');
  console.log('• window.debugBookings.clearCache() - Clear cache');
  console.log('• window.debugBookings.clearAuthCache() - Clear auth tokens (for JWT errors)');
  console.log('• window.debugBookings.testAPI() - Test API directly');
  console.log('• window.debugBookings.getBookings() - Get bookings with logging');
} 