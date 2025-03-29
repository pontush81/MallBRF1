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
      const response = await this.get<Page[]>('/visible');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching visible pages:', error);
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