import { Page } from '../types/Page';
import { v4 as uuidv4 } from 'uuid';

// Base URL for the API (dynamically determined)
export const BASE_URL = '';

// API URL - simplifierad för att fungera med Vercel och utveckling
const API_URL = '/api';

// Service för att hantera sidor
const pageService = {
  // Hämta alla sidor
  getAllPages: async (): Promise<Page[]> => {
    try {
      const response = await fetch(`${API_URL}/pages`);
      if (!response.ok) {
        throw new Error('Kunde inte hämta sidor');
      }
      return await response.json();
    } catch (error) {
      console.error('Fel vid hämtning av sidor:', error);
      return [];
    }
  },

  // Hämta publicerade sidor
  getPublishedPages: async (): Promise<Page[]> => {
    try {
      const response = await fetch(`${API_URL}/pages/published`);
      if (!response.ok) {
        throw new Error('Kunde inte hämta publicerade sidor');
      }
      return await response.json();
    } catch (error) {
      console.error('Fel vid hämtning av publicerade sidor:', error);
      return [];
    }
  },

  // Hämta publicerade sidor som ska visas i sidlistan
  getVisiblePages: async (): Promise<Page[]> => {
    try {
      const response = await fetch(`${API_URL}/pages/visible`);
      if (!response.ok) {
        throw new Error('Kunde inte hämta synliga sidor');
      }
      return await response.json();
    } catch (error) {
      console.error('Fel vid hämtning av synliga sidor:', error);
      return [];
    }
  },

  // Hämta en specifik sida med ID
  getPageById: async (id: string): Promise<Page | null> => {
    try {
      const response = await fetch(`${API_URL}/pages/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Kunde inte hämta sidan');
      }
      return await response.json();
    } catch (error) {
      console.error('Fel vid hämtning av sida:', error);
      return null;
    }
  },

  // Hämta en specifik sida med slug
  getPageBySlug: async (slug: string): Promise<Page | null> => {
    try {
      const response = await fetch(`${API_URL}/pages/slug/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Kunde inte hämta sidan');
      }
      return await response.json();
    } catch (error) {
      console.error('Fel vid hämtning av sida med slug:', error);
      return null;
    }
  },

  // Skapa en ny sida
  createPage: async (pageData: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<Page> => {
    try {
      const response = await fetch(`${API_URL}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
      });

      if (!response.ok) {
        throw new Error('Kunde inte skapa sidan');
      }

      return await response.json();
    } catch (error) {
      console.error('Fel vid skapande av sida:', error);
      throw error;
    }
  },

  // Uppdatera en befintlig sida
  updatePage: async (id: string, pageData: Partial<Omit<Page, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Page | null> => {
    try {
      const response = await fetch(`${API_URL}/pages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Kunde inte uppdatera sidan');
      }

      return await response.json();
    } catch (error) {
      console.error('Fel vid uppdatering av sida:', error);
      return null;
    }
  },

  // Radera en sida
  deletePage: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/pages/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Kunde inte radera sidan');
      }

      return true;
    } catch (error) {
      console.error('Fel vid radering av sida:', error);
      return false;
    }
  },

  // Ladda upp en fil till en sida
  uploadFile: async (pageId: string, file: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_URL}/pages/${pageId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Kunde inte ladda upp filen');
      }

      return await response.json();
    } catch (error) {
      console.error('Fel vid uppladdning av fil:', error);
      throw error;
    }
  },

  // Radera en fil från en sida
  deleteFile: async (pageId: string, fileId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/pages/${pageId}/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Kunde inte radera filen');
      }

      return true;
    } catch (error) {
      console.error('Fel vid radering av fil:', error);
      return false;
    }
  },

  // Exportera alla sidor som JSON-fil
  exportPages: async (): Promise<string> => {
    try {
      const pages = await pageService.getAllPages();
      return JSON.stringify(pages, null, 2);
    } catch (error) {
      console.error('Fel vid export av sidor:', error);
      return '[]';
    }
  },

  // Importera sidor från JSON-sträng
  importPages: async (pagesJson: string): Promise<boolean> => {
    try {
      const pages = JSON.parse(pagesJson) as Page[];
      
      // Validera att det är en array av Page-objekt
      if (!Array.isArray(pages) || !pages.every(p => 
        p.id && p.title && p.content && typeof p.isPublished === 'boolean')) {
        throw new Error('Ogiltig siddata');
      }
      
      // Detta är en förenklad implementation som skulle kräva en ny endpoint
      // på servern för att importera flera sidor samtidigt.
      // Här laddar vi upp varje sida separat
      for (const page of pages) {
        await fetch(`${API_URL}/pages/${page.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(page),
        });
      }
      
      return true;
    } catch (error) {
      console.error('Fel vid import av sidor:', error);
      throw error;
    }
  },
};

export default pageService; 