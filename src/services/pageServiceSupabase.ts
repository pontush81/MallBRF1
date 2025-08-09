import supabaseClient from './supabaseClient';
import { Page } from '../types/Page';
import { logUserAccess, logAnonymousAccess } from './auditLog';

// Transform function to convert from database format to frontend format
function transformPageFromDB(dbPage: any): Page {
  return {
    id: dbPage.id,
    title: dbPage.title,
    content: dbPage.content,
    slug: dbPage.slug,
    isPublished: dbPage.ispublished,
    show: dbPage.show,
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
  if (page.createdAt !== undefined) dbPage.createdat = page.createdAt;
  if (page.updatedAt !== undefined) dbPage.updatedat = page.updatedAt;
  if (page.files !== undefined) dbPage.files = JSON.stringify(page.files);
  
  return dbPage;
}

const pageServiceSupabase = {
  // Hämta alla synliga sidor (för public sidor)
  getVisiblePages: async (): Promise<Page[]> => {
    try {
      console.log('🔍 Fetching visible pages from Supabase... (v2.0)');
      
      const { data, error } = await supabaseClient
        .from('pages')
        .select('*')
        .eq('ispublished', true)
        .eq('show', true)
        .order('createdat', { ascending: true });

      if (error) {
        console.error('❌ Error fetching visible pages:', error);
        throw error;
      }

      const pages = data?.map(transformPageFromDB) || [];
      
      // Log anonymous access for public page viewing (temporarily disabled to fix loading issues)
      // await logAnonymousAccess('pages', 'SELECT', undefined, `get_visible_pages_${pages.length}_results`);

      console.log(`✅ Found ${pages.length} visible pages`);
      return pages;
    } catch (error) {
      console.error('Error in getVisiblePages:', error);
      throw error;
    }
  },

  // Hämta alla publicerade sidor (alias för getVisiblePages för backward compatibility)
  getPublishedPages: async (): Promise<Page[]> => {
    return pageServiceSupabase.getVisiblePages();
  },

  // Hämta alla sidor (för admin)
  getAllPages: async (): Promise<Page[]> => {
    try {
      console.log('🔍 Fetching all pages from Supabase...');
      
      const { data, error } = await supabaseClient
        .from('pages')
        .select('*')
        .order('createdat', { ascending: true });

      if (error) {
        console.error('❌ Error fetching all pages:', error);
        throw error;
      }

      const pages = data?.map(transformPageFromDB) || [];
      
      // Log admin access to all pages
      await logUserAccess('pages', 'SELECT', undefined, `admin_get_all_pages_${pages.length}_results`);

      console.log(`✅ Found ${pages.length} total pages`);
      return pages;
    } catch (error) {
      console.error('Error in getAllPages:', error);
      throw error;
    }
  },

  // Hämta en specifik sida via ID
  getPageById: async (id: string): Promise<Page | null> => {
    try {
      console.log(`🔍 Fetching page by ID: ${id}`);
      
      const { data, error } = await supabaseClient
        .from('pages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`⚠️ Page not found: ${id}`);
          return null;
        }
        console.error('❌ Error fetching page by ID:', error);
        throw error;
      }

      const page = transformPageFromDB(data);
      
      // Determine if this is admin access or public access
      const currentUserData = localStorage.getItem('currentUser');
      const isAdmin = currentUserData ? JSON.parse(currentUserData).role === 'admin' : false;
      
      if (isAdmin) {
        await logUserAccess('pages', 'SELECT', String(id), 'admin_get_page_by_id');
      } else {
        // await logAnonymousAccess('pages', 'SELECT', String(id), 'public_get_page_by_id');
      }

      console.log(`✅ Found page: ${page.title}`);
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
      
      const { data, error } = await supabaseClient
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`⚠️ Page not found: ${slug}`);
          return null;
        }
        console.error('❌ Error fetching page by slug:', error);
        throw error;
      }

      const page = transformPageFromDB(data);
      
      // Determine if this is admin access or public access
      const currentUserData = localStorage.getItem('currentUser');
      const isAdmin = currentUserData ? JSON.parse(currentUserData).role === 'admin' : false;
      
      if (isAdmin) {
        await logUserAccess('pages', 'SELECT', String(page.id), `admin_get_page_by_slug_${slug}`);
      } else {
        // await logAnonymousAccess('pages', 'SELECT', String(page.id), `public_get_page_by_slug_${slug}`);
      }

      console.log(`✅ Found page: ${page.title}`);
      return page;
    } catch (error) {
      console.error('Error in getPageBySlug:', error);
      throw error;
    }
  },

  // Skapa en ny sida
  createPage: async (pageData: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<Page> => {
    // Check Firebase authentication and admin permissions from localStorage
    const currentUserData = localStorage.getItem('currentUser');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn || !currentUserData) {
      throw new Error('Du måste vara inloggad för att skapa sidor.');
    }
    
    const parsedUser = JSON.parse(currentUserData);
    console.log('🔐 Current Firebase user:', parsedUser.email, 'Role:', parsedUser.role);
    
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
    // Check Firebase authentication and admin permissions from localStorage
    const currentUserData = localStorage.getItem('currentUser');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn || !currentUserData) {
      throw new Error('Du måste vara inloggad för att uppdatera sidor.');
    }
    
    const parsedUser = JSON.parse(currentUserData);
    console.log('🔐 Current Firebase user:', parsedUser.email, 'Role:', parsedUser.role);
    
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
        })
      });

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
      throw error;
    }
  },

  // Ta bort en sida
  deletePage: async (id: string): Promise<void> => {
    // Check Firebase authentication and admin permissions from localStorage
    const currentUserData = localStorage.getItem('currentUser');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn || !currentUserData) {
      throw new Error('Du måste vara inloggad för att ta bort sidor.');
    }
    
    const parsedUser = JSON.parse(currentUserData);
    console.log('🔐 Current Firebase user:', parsedUser.email, 'Role:', parsedUser.role);
    
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