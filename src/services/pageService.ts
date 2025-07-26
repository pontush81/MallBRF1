import { Page } from '../types/Page';
import pageServiceSupabase from './pageServiceSupabase';

// Use Supabase instead of Express API
console.log('PageService använder Supabase direkt (inga API-anrop)');

// Cache konfiguration
const CACHE_DURATION = 30000; // 30 sekunder cache
const STALE_WHILE_REVALIDATE_DURATION = 300000; // 5 minuter stale-while-revalidate

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

class PageCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > CACHE_DURATION;
  }
  
  private isStale(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > STALE_WHILE_REVALIDATE_DURATION;
  }
  
  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = this.cache.get(key);
    
    // If we have fresh data, return it
    if (existing && !this.isExpired(existing)) {
      return existing.data;
    }
    
    // If we have stale data but not too old, return stale data and refresh in background
    if (existing && !this.isStale(existing)) {
      // Start background refresh if not already pending
      if (!this.pendingRequests.has(key)) {
        const refreshPromise = this.refreshInBackground(key, fetcher);
        this.pendingRequests.set(key, refreshPromise);
      }
      return existing.data;
    }
    
    // If we have a pending request, wait for it
    const pendingRequest = this.pendingRequests.get(key);
    if (pendingRequest) {
      return await pendingRequest;
    }
    
    // No cache or very stale - fetch fresh data
    const fetchPromise = this.fetchAndCache(key, fetcher);
    this.pendingRequests.set(key, fetchPromise);
    
    try {
      return await fetchPromise;
    } finally {
      this.pendingRequests.delete(key);
    }
  }
  
  private async refreshInBackground<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    try {
      const data = await fetcher();
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        isStale: false
      });
      return data;
    } catch (error) {
      console.warn(`Background refresh failed for ${key}:`, error);
      // Return stale data if refresh fails
      const existing = this.cache.get(key);
      if (existing) {
        return existing.data;
      }
      throw error;
    } finally {
      this.pendingRequests.delete(key);
    }
  }
  
  private async fetchAndCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      isStale: false
    });
    return data;
  }
  
  invalidate(keyPattern?: string): void {
    if (keyPattern) {
      // Invalidate keys matching pattern
      for (const key of this.cache.keys()) {
        if (key.includes(keyPattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
    this.pendingRequests.clear();
  }
  
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

const cache = new PageCache();

// Cache keys
const CACHE_KEYS = {
  ALL_PAGES: 'all_pages',
  VISIBLE_PAGES: 'visible_pages',
  PUBLISHED_PAGES: 'published_pages',
  PAGE_BY_ID: (id: string) => `page_${id}`,
  PAGE_BY_SLUG: (slug: string) => `page_slug_${slug}`
};

const pageService = {
  // Hämta alla synliga sidor
  async getVisiblePages(): Promise<Page[]> {
    return cache.get(CACHE_KEYS.VISIBLE_PAGES, async () => {
      console.log('🔄 Hämtar synliga sidor från Supabase...');
      return await pageServiceSupabase.getVisiblePages();
    });
  },

  // Hämta alla publicerade sidor
  async getPublishedPages(): Promise<Page[]> {
    return cache.get(CACHE_KEYS.PUBLISHED_PAGES, async () => {
      console.log('🔄 Hämtar publicerade sidor från Supabase...');
      return await pageServiceSupabase.getPublishedPages();
    });
  },

  // Hämta alla sidor (admin)
  async getAllPages(): Promise<Page[]> {
    return cache.get(CACHE_KEYS.ALL_PAGES, async () => {
      console.log('🔄 Hämtar alla sidor från Supabase...');
      return await pageServiceSupabase.getAllPages();
    });
  },

  // Hämta en specifik sida med ID
  async getPageById(id: string): Promise<Page | null> {
    return cache.get(CACHE_KEYS.PAGE_BY_ID(id), async () => {
      console.log(`🔄 Hämtar sida ${id} från Supabase...`);
      return await pageServiceSupabase.getPageById(id);
    });
  },

  // Hämta en specifik sida med slug
  async getPageBySlug(slug: string): Promise<Page | null> {
    return cache.get(CACHE_KEYS.PAGE_BY_SLUG(slug), async () => {
      console.log(`🔄 Hämtar sida med slug ${slug} från Supabase...`);
      return await pageServiceSupabase.getPageBySlug(slug);
    });
  },

  // Skapa ny sida
  async createPage(pageData: any): Promise<Page> {
    console.log('🔄 Skapar ny sida i Supabase...');
    const page = await pageServiceSupabase.createPage(pageData);
    
    // Invalidate relevant cache entries
    cache.invalidate('pages');
    
    return page;
  },

  // Uppdatera sida
  async updatePage(id: string, pageData: any): Promise<Page> {
    console.log(`🔄 Uppdaterar sida ${id} i Supabase...`);
    const page = await pageServiceSupabase.updatePage(id, pageData);
    
    // Invalidate relevant cache entries
    cache.invalidate('pages');
    cache.invalidate(`page_${id}`);
    if (pageData.slug) {
      cache.invalidate(`page_slug_${pageData.slug}`);
    }
    
    return page;
  },

  // Radera sida
  async deletePage(id: string): Promise<void> {
    console.log(`🔄 Raderar sida ${id} från Supabase...`);
    await pageServiceSupabase.deletePage(id);
    
    // Invalidate relevant cache entries
    cache.invalidate('pages');
    cache.invalidate(`page_${id}`);
  },

  // File upload methods
  async uploadFile(file: File, pageId?: string): Promise<{ filename: string; url: string }> {
    console.log('🔄 Laddar upp fil till Supabase Storage...');
    const result = await pageServiceSupabase.uploadFile(pageId || '', file);
    return {
      filename: result.originalName || file.name,
      url: result.url
    };
  },

  async deleteFile(filename: string): Promise<void> {
    console.log(`🔄 Raderar fil ${filename} från Supabase Storage...`);
    // Importera supabaseStorage direkt för filoperationer
    const { default: supabaseStorage } = await import('./supabaseStorage');
    await supabaseStorage.deleteFile(filename);
  },

  // Cache management
  clearCache(): void {
    console.log('🧹 Rensar page cache...');
    cache.clear();
  },

  invalidateCache(pattern?: string): void {
    console.log(`🧹 Invaliderar page cache${pattern ? ` (${pattern})` : ''}...`);
    cache.invalidate(pattern);
  }
};

export default pageService; 