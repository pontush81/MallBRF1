import { Page } from '../types/Page';
import { API_BASE_URL } from '../config';

// Service för att hantera sidor
const pageService = {
  // Hämta alla sidor
  getAllPages: async (): Promise<Page[]> => {
    try {
      console.log('Fetching all pages from:', `${API_BASE_URL}/pages`);
      const response = await fetch(`${API_BASE_URL}/pages`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        mode: 'cors',
        credentials: 'omit'
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        });
        throw new Error(`Kunde inte hämta sidor: ${response.status} ${response.statusText}`);
      }

      const pages = await response.json();
      console.log(`Successfully fetched ${pages.length} pages`);
      return pages;
    } catch (error) {
      console.error('Error fetching pages:', {
        error,
        message: error.message,
        stack: error.stack,
        url: `${API_BASE_URL}/pages`
      });
      return [];
    }
  },

  // Hämta publicerade sidor
  getPublishedPages: async (): Promise<Page[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/pages/published`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        mode: 'cors',
        credentials: 'omit'
      });
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
      console.log('Fetching visible pages from:', `${API_BASE_URL}/pages/visible`);
      const response = await fetch(`${API_BASE_URL}/pages/visible`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        });
        throw new Error(`Kunde inte hämta synliga sidor: ${response.status} ${response.statusText}`);
      }
      
      const pages = await response.json();
      console.log(`Successfully fetched ${pages.length} visible pages`);
      // Sortera sidorna i alfabetisk ordning baserat på titeln
      const sortedPages = [...pages].sort((a, b) => a.title.localeCompare(b.title, 'sv'));
      return sortedPages;
    } catch (error) {
      console.error('Error fetching visible pages:', {
        error,
        message: error.message,
        stack: error.stack,
        url: `${API_BASE_URL}/pages/visible`
      });
      
      // Use fallback data if the API fails
      console.log('Using fallback data due to API error');
      const fallbackPages = [
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
      return fallbackPages.sort((a, b) => a.title.localeCompare(b.title, 'sv'));
    }
  },

  // Hämta en specifik sida med ID
  getPageById: async (id: string): Promise<Page | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/pages/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        mode: 'cors',
        credentials: 'omit'
      });
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
      const response = await fetch(`${API_BASE_URL}/pages/slug/${slug}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Kunde inte hämta sidan');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Fel vid hämtning av sida med slug:', error);
      
      // Fallback pages data
      const fallbackPages = {
        "valkomstsida": {
          id: "fallback-1",
          title: "Välkomstsida",
          content: "# Välkommen\n\nDetta är vår välkomstsida.",
          slug: "valkomstsida",
          isPublished: true,
          show: true,
          files: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        "information": {
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
        "bokning": {
          id: "fallback-3",
          title: "Bokning",
          content: "# Bokning\n\nHär kan du boka föreningens lokaler.",
          slug: "bokning",
          isPublished: true,
          show: true,
          files: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      
      return fallbackPages[slug] || null;
    }
  },

  // Skapa en ny sida
  createPage: async (pageData: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<Page> => {
    try {
      const response = await fetch(`${API_BASE_URL}/pages`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        body: JSON.stringify(pageData),
        mode: 'cors',
        credentials: 'omit'
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
      console.log('Updating page:', { id, pageData });
      
      const response = await fetch(`${API_BASE_URL}/pages/${id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        body: JSON.stringify(pageData),
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          details: errorData.details
        });
        
        if (response.status === 404) {
          return null;
        }
        throw new Error(errorData.details || errorData.error || 'Kunde inte uppdatera sidan');
      }

      const updatedPage = await response.json();
      console.log('Page updated successfully:', updatedPage);
      return updatedPage;
    } catch (error) {
      console.error('Error updating page:', error);
      throw error;
    }
  },

  // Radera en sida
  deletePage: async (id: string): Promise<boolean> => {
    try {
      console.log('Attempting to delete page:', { id });
      
      const response = await fetch(`${API_BASE_URL}/pages/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Okänt fel' }));
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          details: errorData.details,
          url: `${API_BASE_URL}/pages/${id}`
        });
        
        if (response.status === 404) {
          throw new Error('Sidan kunde inte hittas. Den kan ha raderats av en annan användare.');
        }
        throw new Error(errorData.details || errorData.error || 'Kunde inte radera sidan');
      }

      console.log('Page deleted successfully:', { id });
      return true;
    } catch (error) {
      console.error('Fel vid radering av sida:', {
        error,
        message: error.message,
        stack: error.stack,
        url: `${API_BASE_URL}/pages/${id}`
      });
      throw error;
    }
  },

  // Ladda upp en fil till en sida
  uploadFile: async (pageId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Uploading file:', { filename: file.name, size: file.size, type: file.type });
      
      const response = await fetch(`${API_BASE_URL}/pages/${pageId}/upload`, {
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
      console.log('Attempting to delete file:', { pageId, fileId });
      const response = await fetch(`${API_BASE_URL}/pages/${pageId}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-protection-bypass': 'true'
        },
        credentials: 'omit'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from server:', errorData);
        throw new Error(errorData.error || 'Kunde inte radera filen');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Kunde inte radera filen');
      }

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
        await fetch(`${API_BASE_URL}/pages/${page.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-vercel-protection-bypass': 'true'
          },
          body: JSON.stringify(page),
          credentials: 'omit'
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