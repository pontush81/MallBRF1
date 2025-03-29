import { Page } from '../types/Page';
import { API_BASE_URL } from '../config';
import { BaseService } from './baseService';
import { httpClient } from './httpClient';

// Define interface for the debug response
interface DebugInfo {
  clientInfo?: {
    location: string;
    origin: string;
    hostname: string;
    environment: string;
  };
  serverInfo?: any;
  error?: string;
}

class PageService extends BaseService {
  constructor() {
    super('/pages');
  }

  // Hämta alla sidor
  async getAllPages(): Promise<Page[]> {
    try {
      return await this.get<Page[]>();
    } catch (error) {
      console.error('Error fetching all pages:', error);
      return [];
    }
  }

  // Hämta synliga sidor
  async getVisiblePages(): Promise<Page[]> {
    try {
      console.log('Fetching visible pages from API');
      const response = await this.get<Page[]>('/visible');
      console.log('Visible pages response received:', { 
        dataType: typeof response,
        isArray: Array.isArray(response),
        length: Array.isArray(response) ? response.length : 0 
      });
      
      // Säkerställ att vi returnerar en array
      if (!response) {
        console.warn('No response received from API');
        return [];
      }
      
      if (!Array.isArray(response)) {
        console.warn('Response is not an array, converting to array:', response);
        return [response as unknown as Page]; 
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching visible pages:', error);
      // Om vi får en CORS-relaterad nätverksfel, försök använda alternativa metoder
      if (window.location.hostname.includes('stage.gulmaran.com')) {
        console.log('Attempting fallback method for stage environment');
        return this.getFallbackPages();
      }
      return [];
    }
  }

  // Fallback-metod för att hantera CORS-problem
  private async getFallbackPages(): Promise<Page[]> {
    try {
      // Returnera några statiska sidor som fallback
      console.log('Using fallback static pages due to CORS issues');
      return [
        {
          id: 'fallback-1',
          title: 'Välkommen till BRF Gulmåran',
          content: '**OBS: Detta är temporärt innehåll p.g.a. CORS-problem.**\n\nVälkommen till BRF Gulmåran! Vi är glada att du besöker vår sida. Innehållet kommer att laddas när API-problemen är lösta.',
          slug: 'welcome',
          isPublished: true,
          show: true,
          files: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'fallback-2',
          title: 'Information',
          content: '**Detta är statiskt innehåll**\n\nDenna sida visar statiskt innehåll medan vi löser tekniska problem med vår API-server. Vi beklagar eventuella olägenheter.',
          slug: 'info',
          isPublished: true,
          show: true,
          files: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Error in fallback method:', error);
      return [];
    }
  }

  // Hämta publicerade sidor
  async getPublishedPages(): Promise<Page[]> {
    try {
      return await this.get<Page[]>('/published');
    } catch (error) {
      console.error('Error fetching published pages:', error);
      return [];
    }
  }

  // Hämta en sida med ID
  async getPageById(id: string): Promise<Page | null> {
    try {
      return await this.get<Page>(`/${id}`);
    } catch (error) {
      console.error('Error fetching page by ID:', error);
      return null;
    }
  }

  // Hämta en sida med slug
  async getPageBySlug(slug: string): Promise<Page | null> {
    try {
      return await this.get<Page>(`/slug/${slug}`);
    } catch (error) {
      console.error('Error fetching page by slug:', error);
      return null;
    }
  }

  // Skapa en ny sida
  async createPage(pageData: Partial<Page>): Promise<Page | null> {
    try {
      return await this.post<Page>('', pageData);
    } catch (error) {
      console.error('Error creating page:', error);
      return null;
    }
  }

  // Uppdatera en sida
  async updatePage(id: string, pageData: Partial<Page>): Promise<Page | null> {
    try {
      return await this.put<Page>(`/${id}`, pageData);
    } catch (error) {
      console.error('Error updating page:', error);
      return null;
    }
  }

  // Ta bort en sida
  async deletePage(id: string): Promise<boolean> {
    try {
      await this.delete(`/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting page:', error);
      return false;
    }
  }

  // Test debug endpoint - external API path, so we use a different approach
  async testDebugEndpoint(): Promise<DebugInfo> {
    try {
      const response = await httpClient.get('/debug');
      return response.data;
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

  // Ladda upp en fil till en sida
  async uploadFile(pageId: string, file: File): Promise<{ success: boolean; file?: any; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await httpClient.post(`/pages/${pageId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        file: response.data
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Ta bort en fil från en sida
  async deleteFile(pageId: string, fileId: string): Promise<boolean> {
    try {
      await httpClient.delete(`/pages/${pageId}/files/${fileId}`);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Hjälpfunktion för att bygga URL:er (legacy, kept for backward compatibility)
  buildApiUrl(path: string): string {
    return `${API_BASE_URL}${path}`;
  }
}

// Skapa en instans av PageService
const pageServiceInstance = new PageService();

// Exportera som både en named export (för bakåtkompatibilitet) och som default export
export const pageService = pageServiceInstance;
export default pageServiceInstance; 