import supabaseClient from './supabaseClient';
import { Page } from '../types/Page';
import { logUserAccess } from './auditLog';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { logAnonymousAccess } from './auditLog';

// Transform function to convert from database format to frontend format
function transformPageFromDB(dbPage: any): Page {
  return {
    id: dbPage.id,
    title: dbPage.title,
    content: dbPage.content,
    slug: dbPage.slug,
    isPublished: dbPage.ispublished,
    show: dbPage.show,
    icon: dbPage.icon, // Add icon mapping
    createdAt: dbPage.createdat,
    updatedAt: dbPage.updatedat,
    files: dbPage.files ? (typeof dbPage.files === 'string' ? JSON.parse(dbPage.files) : dbPage.files) : []
  };
}

// Transform function to convert from frontend format to database format
function transformPageToDB(page: Partial<Page>): any {
  const dbPage: any = {};
  
  if (page.title !== undefined) dbPage.title = page.title;
  if (page.content !== undefined) dbPage.content = page.content;
  if (page.slug !== undefined) dbPage.slug = page.slug;
  if (page.isPublished !== undefined) dbPage.ispublished = page.isPublished;
  if (page.show !== undefined) dbPage.show = page.show;
  if (page.icon !== undefined) dbPage.icon = page.icon; // Add icon mapping
  if (page.createdAt !== undefined) dbPage.createdat = page.createdAt;
  if (page.updatedAt !== undefined) dbPage.updatedat = page.updatedAt;
  if (page.files !== undefined) dbPage.files = JSON.stringify(page.files);
  
  return dbPage;
}

const pageServiceSupabase = {
  // Hämta alla synliga sidor (för public sidor)
  getVisiblePages: async (): Promise<Page[]> => {
    const maxRetries = 2;
    const baseDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Fetching visible pages... (attempt ${attempt}/${maxRetries})`);
        
        // Try direct fetch first (bypass SDK issues in production)
        if (attempt === 1) {
          try {
            console.log('🚀 Trying direct REST API call...');
            const startTime = Date.now();
            
            const response = await fetch(`https://qhdgqevdmvkrwnzpwikz.supabase.co/rest/v1/pages?ispublished=eq.true&show=eq.true&order=createdat.asc&select=*`, {
              method: 'GET',
              headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            
            const duration = Date.now() - startTime;
            
            if (response.ok) {
              const data = await response.json();
              const pages = data?.map(transformPageFromDB) || [];
              console.log(`✅ Direct API success! Found ${pages.length} pages (${duration}ms)`);
              return pages;
            } else {
              console.log(`⚠️ Direct API failed: ${response.status} ${response.statusText} (${duration}ms)`);
            }
          } catch (fetchError) {
            console.log('⚠️ Direct API call failed:', fetchError);
          }
        }
        
        // Fallback to SDK with shorter timeout
        console.log('🔄 Falling back to Supabase SDK...');
        const queryPromise = supabaseClient
          .from('pages')
          .select('*')
          .eq('ispublished', true)
          .eq('show', true)
          .order('createdat', { ascending: true });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SDK query timeout after 4 seconds')), 4000)
        );
        
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        const { data, error } = result;

        if (error) {
          console.error(`❌ SDK error (attempt ${attempt}):`, error);
          
          if (attempt === maxRetries) {
            console.log('⚠️ All attempts failed, returning empty pages array');
            return [];
          }
          
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        const pages = data?.map(transformPageFromDB) || [];
        console.log(`✅ SDK success! Found ${pages.length} pages on attempt ${attempt}`);
        return pages;
        
      } catch (error) {
        console.error(`Error in getVisiblePages (attempt ${attempt}):`, error);
        
        if (attempt === maxRetries) {
          console.log('⚠️ Final attempt failed, returning empty pages array');
          return [];
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return [];
  },

  // Hämta alla publicerade sidor (alias för getVisiblePages för backward compatibility)
  getPublishedPages: async (): Promise<Page[]> => {
    return pageServiceSupabase.getVisiblePages();
  },

  // Hämta alla sidor (för admin)
  getAllPages: async (): Promise<Page[]> => {
    try {
      console.log('🚀 Fetching all pages via direct REST API...');
      
      const response = await fetch(`https://qhdgqevdmvkrwnzpwikz.supabase.co/rest/v1/pages?select=*&order=createdat.asc`, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10s timeout för admin
      });

      console.log('📡 getAllPages API Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ getAllPages API Response error:', errorText);
        throw new Error(`Direct API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 getAllPages Raw API data:', data);
      console.log('📊 getAllPages Data type:', typeof data, 'Is array:', Array.isArray(data));
      
      const pages = data?.map(transformPageFromDB) || [];
      console.log('🔄 getAllPages Transformed pages:', pages.length);
      
      console.log(`✅ Found ${pages.length} total pages via direct API (FAST!)`);
      
      // Log admin access to all pages (skip if fails, don't block response)
      setTimeout(async () => {
        try {
          await logUserAccess('pages', 'SELECT', undefined, `admin_get_all_pages_${pages.length}_results`);
        } catch (logError) {
          console.log('ℹ️ Audit logging skipped (non-critical)');
        }
      }, 0);
      
      return pages;
    } catch (error) {
      console.error('❌ Error in getAllPages via direct API:', error);
      throw error;
    }
  },

  // Hämta en specifik sida via ID
  getPageById: async (id: string): Promise<Page | null> => {
    try {
      console.log(`🔍 Fetching page by ID: ${id}`);
      
      const response = await fetch(`https://qhdgqevdmvkrwnzpwikz.supabase.co/rest/v1/pages?id=eq.${id}&select=*`, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // Ökat timeout för editor
      });

      console.log(`📡 getPageById API Response status for ID ${id}:`, response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ getPageById API Response error for ID ${id}:`, errorText);
        throw new Error(`Direct API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📊 getPageById Raw API data for ID ${id}:`, data);
      
      if (!data || data.length === 0) {
        console.log(`⚠️ Page not found: ${id}`);
        return null;
      }

      const page = transformPageFromDB(data[0]);
      console.log(`🔄 getPageById Transformed page for ID ${id}:`, page);
      
      // Determine if this is admin access or public access
      const currentUserData = localStorage.getItem('currentUser');
      const isAdmin = currentUserData ? JSON.parse(currentUserData).role === 'admin' : false;
      
      console.log(`✅ Found page via direct API (FAST!): ${page.title}`);
      
      // Log access (skip if fails, don't block response)
      setTimeout(async () => {
        try {
          if (isAdmin) {
            await logUserAccess('pages', 'SELECT', String(id), 'admin_get_page_by_id');
          }
        } catch (logError) {
          console.log('⚠️ Audit logging skipped (non-critical)');
        }
      }, 0);
      
      return page;
    } catch (error) {
      console.error('Error in getPageById:', error);
      throw error;
    }
  },

  // Hämta en specifik sida via slug
  getPageBySlug: async (slug: string): Promise<Page | null> => {
    try {
      console.log(`🔍 Fetching page by slug: ${slug}`);
      
      const response = await fetch(`https://qhdgqevdmvkrwnzpwikz.supabase.co/rest/v1/pages?slug=eq.${encodeURIComponent(slug)}&select=*`, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Direct API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        console.log(`⚠️ Page not found: ${slug}`);
        return null;
      }

      const page = transformPageFromDB(data[0]);
      
      // Determine if this is admin access or public access
      const currentUserData = localStorage.getItem('currentUser');
      const isAdmin = currentUserData ? JSON.parse(currentUserData).role === 'admin' : false;
      
      // Log access (skip if fails)
      try {
        if (isAdmin) {
          await logUserAccess('pages', 'SELECT', String(page.id), `admin_get_page_by_slug_${slug}`);
        }
      } catch (logError) {
        console.log('⚠️ Audit logging skipped (non-critical)');
      }

      console.log(`✅ Found page via direct API (FAST!): ${page.title}`);
      return page;
    } catch (error) {
      console.error('Error in getPageBySlug:', error);
      throw error;
    }
  },

  // Skapa en ny sida
  createPage: async (pageData: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<Page> => {
    // Check authentication and admin permissions from localStorage
    const currentUserData = localStorage.getItem('currentUser');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn || !currentUserData) {
      throw new Error('Du måste vara inloggad för att skapa sidor.');
    }
    
    const parsedUser = JSON.parse(currentUserData);
    console.log('🔐 Current user:', parsedUser.email, 'Role:', parsedUser.role);
    
    if (parsedUser.role !== 'admin') {
      throw new Error('Du måste vara admin för att skapa sidor.');
    }

    try {
      console.log('✅ Admin authentication verified, calling admin Edge Function...');
      
      // Transform page data to database format
      const dbData = transformPageToDB({
        ...pageData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('📝 Create data:', dbData);
      
      // Call the admin Edge Function (bypasses RLS with service role)
      const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('../config');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          pageData: dbData,
          userEmail: parsedUser.email,
          userRole: parsedUser.role
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Admin function failed:', errorData);
        throw new Error(errorData.error || 'Kunde inte skapa sidan');
      }

      const { page } = await response.json();
      const createdPage = transformPageFromDB(page);
      
      // Log the page creation
      await logUserAccess('pages', 'INSERT', createdPage.id, `admin_create_page_${createdPage.title}`);
      
      console.log('✅ Page created successfully via admin function');
      return createdPage;
      
    } catch (error) {
      console.error('❌ Error creating page:', error);
      throw error;
    }
  },

    // Uppdatera en befintlig sida
  updatePage: async (id: string, pageData: Partial<Page>): Promise<Page> => {
    // Check authentication and admin permissions from localStorage
    const currentUserData = localStorage.getItem('currentUser');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn || !currentUserData) {
      throw new Error('Du måste vara inloggad för att uppdatera sidor.');
    }
    
    const parsedUser = JSON.parse(currentUserData);
    console.log('🔐 Current user:', parsedUser.email, 'Role:', parsedUser.role);
    
    if (parsedUser.role !== 'admin') {
      throw new Error('Du måste vara admin för att uppdatera sidor.');
    }

    try {
      console.log('✅ Admin authentication verified, calling admin Edge Function...');
      
      // Transform page data to database format
      const dbData = transformPageToDB(pageData);
      console.log('📝 Update data:', dbData);
      
      // Call the admin Edge Function (bypasses RLS with service role)
      const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('../config');
      
      console.log('🚀 Calling admin Edge Function with timeout...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Request timeout after 15 seconds');
        controller.abort();
      }, 15000); // 15 second timeout
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-pages`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          id,
          pageData: dbData,
          userEmail: parsedUser.email,
          userRole: parsedUser.role
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Admin function failed:', errorData);
        throw new Error(errorData.error || 'Kunde inte uppdatera sidan');
      }

      const { page } = await response.json();
      const updatedPage = transformPageFromDB(page);
      
      // Log the page update
      await logUserAccess('pages', 'UPDATE', id, `admin_update_page_${updatedPage.title}`);
      
      console.log('✅ Page updated successfully via admin function');
      return updatedPage;
      
    } catch (error) {
      console.error('❌ Error updating page:', error);
      
      // Better error messages for different types of errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Sparprocessen tog för lång tid. Försök igen.');
        } else if (error.message.includes('fetch')) {
          throw new Error('Kunde inte ansluta till servern. Kontrollera din internetanslutning.');
        }
      }
      
      throw error;
    }
  },

  // Ta bort en sida
  deletePage: async (id: string): Promise<void> => {
    // Check authentication and admin permissions from localStorage
    const currentUserData = localStorage.getItem('currentUser');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn || !currentUserData) {
      throw new Error('Du måste vara inloggad för att ta bort sidor.');
    }
    
    const parsedUser = JSON.parse(currentUserData);
    console.log('🔐 Current user:', parsedUser.email, 'Role:', parsedUser.role);
    
    if (parsedUser.role !== 'admin') {
      throw new Error('Du måste vara admin för att ta bort sidor.');
    }

    try {
      console.log('✅ Admin authentication verified, calling admin Edge Function...');
      
      // Call the admin Edge Function (bypasses RLS with service role)
      const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('../config');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-pages`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          id,
          userEmail: parsedUser.email,
          userRole: parsedUser.role
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Admin function failed:', errorData);
        throw new Error(errorData.error || 'Kunde inte ta bort sidan');
      }
      
      // Log the page deletion
      await logUserAccess('pages', 'DELETE', id, 'admin_delete_page');
      
      console.log('✅ Page deleted successfully via admin function');
      
    } catch (error) {
      console.error('❌ Error deleting page:', error);
      throw error;
    }
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