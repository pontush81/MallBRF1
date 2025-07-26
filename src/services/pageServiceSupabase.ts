import { Page } from '../types/Page';
import { executeWithRLS, executePublic } from './supabaseClient';

// Fallback data för när Supabase inte är tillgängligt
const FALLBACK_PAGES: Page[] = [
  {
    id: '1',
    title: 'Fallback - Information',
    content: 'Denna sida laddades från fallback-data eftersom databasen inte var tillgänglig.',
    slug: 'fallback-information',
    isPublished: true,
    show: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: []
  }
];

// Database table mapping
const PAGES_TABLE = 'pages';

// Helper function to transform database row to Page object
function transformPageFromDB(row: any): Page {
  return {
    id: row.id?.toString(),
    title: row.title || '',
    content: row.content || '',
    isPublished: row.ispublished ?? row.isPublished ?? false,
    show: row.show ?? true,
    createdAt: row.createdat || row.createdAt || new Date().toISOString(),
    updatedAt: row.updatedat || row.updatedAt || new Date().toISOString(),
    files: row.files ? (typeof row.files === 'string' ? JSON.parse(row.files) : row.files) : [],
    slug: row.slug
  };
}

// Helper function to transform Page object to database row
function transformPageToDB(page: Partial<Page>): any {
  return {
    title: page.title,
    content: page.content,
    ispublished: page.isPublished,
    show: page.show,
    files: page.files ? JSON.stringify(page.files) : null,
    slug: page.slug,
    updatedat: new Date().toISOString()
  };
}

const pageServiceSupabase = {
  // Hämta alla synliga sidor (published och show = true)
  getVisiblePages: async (): Promise<Page[]> => {
    return executePublic(async (supabase) => {
      console.log('Fetching visible pages from Supabase...');
      
      const { data, error } = await supabase
        .from(PAGES_TABLE)
        .select('*')
        .eq('ispublished', true)
        .eq('show', true)
        .order('createdat', { ascending: false });

      if (error) {
        console.error('Error fetching visible pages:', error);
        throw new Error('Kunde inte hämta sidor från databasen');
      }

      const pages = data?.map(transformPageFromDB) || [];
      console.log(`Found ${pages.length} visible pages`);
      
      if (pages.length > 0) {
        console.log('Sample page:', {
          id: pages[0].id,
          title: pages[0].title,
          isPublished: pages[0].isPublished,
          show: pages[0].show
        });
      }

      return pages;
    }, FALLBACK_PAGES);
  },

  // Hämta alla publicerade sidor
  getPublishedPages: async (): Promise<Page[]> => {
    return executePublic(async (supabase) => {
      const { data, error } = await supabase
        .from(PAGES_TABLE)
        .select('*')
        .eq('ispublished', true)
        .order('createdat', { ascending: false });

      if (error) {
        console.error('Error fetching published pages:', error);
        throw error;
      }

      return data?.map(transformPageFromDB) || [];
    }, FALLBACK_PAGES);
  },

  // Hämta alla sidor (admin)
  getAllPages: async (): Promise<Page[]> => {
    return executeWithRLS(async (supabase) => {
      const { data, error } = await supabase
        .from(PAGES_TABLE)
        .select('*')
        .order('createdat', { ascending: false });

      if (error) {
        console.error('Error fetching all pages:', error);
        throw error;
      }

      return data?.map(transformPageFromDB) || [];
    }, []);
  },

  // Hämta en specifik sida med ID
  getPageById: async (id: string): Promise<Page | null> => {
    return executeWithRLS(async (supabase) => {
      const { data, error } = await supabase
        .from(PAGES_TABLE)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching page by ID:', error);
        throw error;
      }

      return data ? transformPageFromDB(data) : null;
    }, null);
  },

  // Hämta en specifik sida med slug
  getPageBySlug: async (slug: string): Promise<Page | null> => {
    return executePublic(async (supabase) => {
      const { data, error } = await supabase
        .from(PAGES_TABLE)
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching page by slug:', error);
        throw error;
      }

      return data ? transformPageFromDB(data) : null;
    }, null);
  },

  // Skapa en ny sida
  createPage: async (pageData: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<Page> => {
    return executeWithRLS(async (supabase) => {
      const dbData = {
        ...transformPageToDB(pageData),
        createdat: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(PAGES_TABLE)
        .insert(dbData)
        .select()
        .single();

      if (error) {
        console.error('Error creating page:', error);
        throw new Error('Kunde inte skapa sidan');
      }

      return transformPageFromDB(data);
    });
  },

  // Uppdatera en befintlig sida
  updatePage: async (id: string, pageData: Partial<Page>): Promise<Page> => {
    return executeWithRLS(async (supabase) => {
      const dbData = transformPageToDB(pageData);

      const { data, error } = await supabase
        .from(PAGES_TABLE)
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating page:', error);
        throw new Error('Kunde inte uppdatera sidan');
      }

      return transformPageFromDB(data);
    });
  },

  // Ta bort en sida
  deletePage: async (id: string): Promise<void> => {
    return executeWithRLS(async (supabase) => {
      const { error } = await supabase
        .from(PAGES_TABLE)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting page:', error);
        throw new Error('Kunde inte ta bort sidan');
      }
    });
  },

  // Ladda upp fil med Supabase Storage
  uploadFile: async (pageId: string, file: File): Promise<{ id: string; url: string; originalName: string }> => {
    try {
      // Dynamisk import av supabaseStorage för att undvika cirkulärt beroende
      const { default: supabaseStorage } = await import('./supabaseStorage');
      
      const uploadedFile = await supabaseStorage.uploadFile(file, pageId);
      
      return {
        id: uploadedFile.id,
        url: uploadedFile.url,
        originalName: uploadedFile.originalName
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('Kunde inte ladda upp filen');
    }
  },

  // Ta bort fil med Supabase Storage
  deleteFile: async (pageId: string, fileId: string): Promise<boolean> => {
    try {
      // Dynamisk import av supabaseStorage för att undvika cirkulärt beroende
      const { default: supabaseStorage } = await import('./supabaseStorage');
      
      // fileId är storage-path i Supabase Storage
      return await supabaseStorage.deleteFile(fileId);
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }
};

export default pageServiceSupabase; 