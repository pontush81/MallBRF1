import { Page } from '../types/Page';
import { apiRequest, withFallback } from '../utils/apiClient';

// Fallback data for when API requests fail
const FALLBACK_PAGES = [
  {
    id: "fallback-1",
    title: "Bokning",
    content: "# Bokning\n\nHär kan du boka föreningens lokaler.",
    slug: "bokning",
    isPublished: true,
    show: true,
    files: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "fallback-2",
    title: "Information",
    content: "# Information\n\nViktig information om föreningen.",
    slug: "information",
    isPublished: true,
    show: true,
    files: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "fallback-3",
    title: "Välkomstsida",
    content: "# Välkommen\n\nDetta är vår välkomstsida.",
    slug: "valkomstsida",
    isPublished: true,
    show: true,
    files: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Fallback page data by slug
const FALLBACK_PAGES_BY_SLUG = {
  "valkomstsida": FALLBACK_PAGES[2],
  "information": FALLBACK_PAGES[1],
  "bokning": FALLBACK_PAGES[0]
};

// Service för att hantera sidor
const pageService = {
  // Hämta alla sidor
  getAllPages: async (): Promise<Page[]> => {
    return withFallback(
      async () => {
        const pages = await apiRequest<Page[]>('/pages');
        console.log(`Successfully fetched ${pages.length} pages`);
        return pages;
      }, 
      []
    );
  },

  // Hämta publicerade sidor
  getPublishedPages: async (): Promise<Page[]> => {
    return withFallback(
      async () => apiRequest<Page[]>('/pages/published'),
      []
    );
  },

  // Hämta publicerade sidor som ska visas i sidlistan
  getVisiblePages: async (): Promise<Page[]> => {
    return withFallback(
      async () => {
        const pages = await apiRequest<Page[]>('/pages/visible');
        console.log(`Successfully fetched ${pages.length} visible pages`);
        // Sortera sidorna i alfabetisk ordning baserat på titeln
        return [...pages].sort((a, b) => a.title.localeCompare(b.title, 'sv'));
      },
      // Sort fallback pages by title
      [...FALLBACK_PAGES].sort((a, b) => a.title.localeCompare(b.title, 'sv'))
    );
  },

  // Hämta en specifik sida med ID
  getPageById: async (id: string): Promise<Page | null> => {
    try {
      return await apiRequest<Page>(`/pages/${id}`);
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return null;
      }
      console.error('Fel vid hämtning av sida:', error);
      return null;
    }
  },

  // Hämta en specifik sida med slug
  getPageBySlug: async (slug: string): Promise<Page | null> => {
    try {
      return await apiRequest<Page>(`/pages/slug/${slug}`);
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return null;
      }
      console.error('Fel vid hämtning av sida med slug:', error);
      return FALLBACK_PAGES_BY_SLUG[slug] || null;
    }
  },

  // Skapa en ny sida
  createPage: async (pageData: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<Page> => {
    return await apiRequest<Page>('/pages', {
      method: 'POST',
      body: pageData
    });
  },

  // Uppdatera en befintlig sida
  updatePage: async (id: string, pageData: Partial<Page>): Promise<Page> => {
    return await apiRequest<Page>(`/pages/${id}`, {
      method: 'PUT',
      body: pageData
    });
  },

  // Ta bort en sida
  deletePage: async (id: string): Promise<void> => {
    await apiRequest<void>(`/pages/${id}`, {
      method: 'DELETE'
    });
  },

  // Ladda upp en fil till en sida
  uploadFile: async (pageId: string, file: File) => {
    try {
      console.log('Uploading file:', { filename: file.name, size: file.size, type: file.type });
      
      const formData = new FormData();
      formData.append('file', file);
      
      // We create a custom fetch for file uploads since our apiRequest utility expects JSON
      const url = `/pages/${pageId}/upload`;
      console.log(`Making POST request to: ${url}`);
      
      const response = await fetch(`/api${url}`, {
        method: 'POST',
        headers: {
          'x-vercel-protection-bypass': 'true'
        },
        body: formData,
        credentials: 'omit'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Kunde inte ladda upp filen' }));
        throw new Error(errorData.error || 'Kunde inte ladda upp filen');
      }

      // Försök avkoda JSON-svaret
      let data;
      try {
        data = await response.json();
        console.log('Raw file upload response:', data);
      } catch (e) {
        console.error('Failed to parse response JSON:', e);
        throw new Error('Kunde inte tolka svaret från servern');
      }

      // Skapa ett säkert svarsobjekt med fallback-värden
      return {
        success: true,
        file: {
          id: data?.file?.id || String(Date.now()),
          filename: data?.file?.filename || file.name,
          originalName: data?.file?.originalName || file.name,
          mimetype: data?.file?.mimetype || file.type,
          size: data?.file?.size || file.size,
          url: (data?.file?.url || '').toString(), // Säkerställ att URL är en sträng
          uploadedAt: data?.file?.uploadedAt || new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Fel vid uppladdning av fil:', error);
      throw error;
    }
  },

  // Radera en fil från en sida
  deleteFile: async (pageId: string, fileId: string): Promise<boolean> => {
    try {
      await apiRequest<{success: boolean}>(`/pages/${pageId}/files/${fileId}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Fel vid radering av fil:', error);
      throw error;
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
        await apiRequest<Page>(`/pages/${page.id}`, {
          method: 'PUT', 
          body: page
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