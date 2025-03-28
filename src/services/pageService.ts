import { Page } from '../types/Page';
import { API_BASE_URL } from '../config';
import { DebugInfo } from '../types/Debug';

// Service för att hantera sidor
const pageService = {
  // Hjälpfunktion för att bygga API URL
  buildApiUrl: (endpoint: string): string => {
    // Om vi använder proxy, ta bort /api prefix från endpoint
    const apiPath = API_BASE_URL.includes('/proxy') 
      ? endpoint.replace(/^\/api/, '')
      : endpoint;
    
    return `${API_BASE_URL}${apiPath}`;
  },

  // Hämta alla sidor
  getAllPages: async (): Promise<Page[]> => {
    try {
      const requestUrl = pageService.buildApiUrl('/api/pages');
      console.log('Fetching all pages from:', requestUrl);
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true',
          'Origin': window.location.origin
        },
        mode: 'cors',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching pages:', error);
      return [];
    }
  },

  // Hämta publicerade sidor som ska visas i sidlistan
  getVisiblePages: async (): Promise<Page[]> => {
    try {
      const requestUrl = pageService.buildApiUrl('/api/pages/visible');
      console.log('Making API request to:', requestUrl);
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Using proxy:', API_BASE_URL.includes('/proxy'));

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching visible pages:', error);
      return [];
    }
  },

  // Hämta en sida med ID
  getPageById: async (id: string): Promise<Page | null> => {
    try {
      const requestUrl = pageService.buildApiUrl(`/api/pages/${id}`);
      console.log('Making API request to:', requestUrl);

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching page by ID:', error);
      return null;
    }
  },

  // Hämta en sida med slug
  getPageBySlug: async (slug: string): Promise<Page | null> => {
    try {
      const requestUrl = pageService.buildApiUrl(`/api/pages/slug/${slug}`);
      console.log('Making API request to:', requestUrl);

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching page by slug:', error);
      return null;
    }
  },

  // Skapa en ny sida
  createPage: async (pageData: Partial<Page>): Promise<Page | null> => {
    try {
      const requestUrl = pageService.buildApiUrl('/api/pages');
      console.log('Creating new page at:', requestUrl);

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(pageData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating page:', error);
      return null;
    }
  },

  // Uppdatera en sida
  updatePage: async (id: string, pageData: Partial<Page>): Promise<Page | null> => {
    try {
      const requestUrl = pageService.buildApiUrl(`/api/pages/${id}`);
      console.log('Updating page at:', requestUrl);

      const response = await fetch(requestUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(pageData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating page:', error);
      return null;
    }
  },

  // Ta bort en sida
  deletePage: async (id: string): Promise<boolean> => {
    try {
      const requestUrl = pageService.buildApiUrl(`/api/pages/${id}`);
      console.log('Deleting page at:', requestUrl);

      const response = await fetch(requestUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting page:', error);
      return false;
    }
  },

  // Test debug endpoint
  testDebugEndpoint: async (): Promise<DebugInfo> => {
    try {
      const requestUrl = pageService.buildApiUrl('/api/debug');
      console.log('Making debug request to:', requestUrl);
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Using proxy:', API_BASE_URL.includes('/proxy'));

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error testing debug endpoint:', error);
      return {
        error: 'Failed to fetch debug info',
        clientInfo: {
          location: window.location.href,
          origin: window.location.origin,
          hostname: window.location.hostname,
          environment: process.env.NODE_ENV || 'development'
        }
      };
    }
  }
};

export default pageService; 