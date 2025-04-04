import { Page } from '../types/Page';
import { apiRequest, withFallback } from '../utils/apiClient';

// Fallback data for when API requests fail
const FALLBACK_PAGES = [
  {
    id: "fallback-1",
    title: "Bokning",
    content: "# Bokning\n\nHär kan du boka föreningens lokaler.\n\n**OBS!** Det kan hända att du ser fallback-innehåll eftersom servern tillfälligt inte kunde nås. Prova att ladda om sidan för att se aktuell information.",
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
    content: "# Information\n\nViktig information om föreningen.\n\n**OBS!** Det kan hända att du ser fallback-innehåll eftersom servern tillfälligt inte kunde nås. Prova att ladda om sidan för att se aktuell information.",
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
    content: "# Välkommen\n\nDetta är vår välkomstsida.\n\n**OBS!** Det kan hända att du ser fallback-innehåll eftersom servern tillfälligt inte kunde nås. Prova att ladda om sidan för att se aktuell information.",
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
  "bokning": FALLBACK_PAGES[0],
  "lagenhet-info": {
    id: "fallback-4",
    title: "Lägenhetsinformation",
    content: "# Lägenhetsinformation\n\nInformation om föreningens lägenheter.",
    slug: "lagenhet-info",
    isPublished: true,
    show: true,
    files: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
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
      console.error('Fel vid hämtning av sida med slug:', error);
      
      // Försök använda fallback för denna slug
      if (slug in FALLBACK_PAGES_BY_SLUG) {
        console.log(`Använder fallback för slug: ${slug}`);
        return FALLBACK_PAGES_BY_SLUG[slug];
      }
      
      // Returnera null som säkerhetsåtgärd
      return null;
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
      console.log('Starting file upload process:', { 
        filename: file.name, 
        size: file.size, 
        type: file.type,
        pageId: pageId
      });
      
      // Validera filen först
      if (file.size === 0) {
        throw new Error('Filen är tom (0 bytes)');
      }

      const formData = new FormData();
      formData.append('file', file);
      
      const url = `/pages/${pageId}/upload`;
      
      // Använd window.location.origin istället för hårdkodad localhost
      const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : window.location.origin;
      const fullUrl = `${apiBaseUrl}/api${url}`;
      
      console.log('Making upload request to:', fullUrl);
      
      // Använd vanlig fetch istället för apiRequest för formdata
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'x-vercel-protection-bypass': 'true'
        },
        body: formData,
        credentials: 'include'
      });

      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed with status:', response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Om det inte är JSON, använd texten direkt
          throw new Error(`Kunde inte ladda upp filen: ${response.status} ${errorText}`);
        }
        throw new Error(errorData.error || errorData.details || 'Kunde inte ladda upp filen');
      }
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!data.file) {
        console.error('No file data in response:', data);
        throw new Error('Servern returnerade inget fildata');
      }

      // Create response object with strict type checking
      const result = {
        success: true,
        file: {
          id: String(data.file.id || Date.now()),
          filename: String(data.file.filename || file.name),
          originalName: String(data.file.originalName || file.name),
          mimetype: String(data.file.mimetype || file.type),
          size: Number(data.file.size || file.size),
          url: String(data.file.url || ''),
          uploadedAt: String(data.file.uploadedAt || new Date().toISOString())
        }
      };

      console.log('Upload completed successfully:', result);
      return result;
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error(`Kunde inte ladda upp filen: ${error instanceof Error ? error.message : String(error)}`);
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