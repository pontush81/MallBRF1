import { Page } from '../types/Page';
import { v4 as uuidv4 } from 'uuid';

// Mockade sidor för demo
let pages: Page[] = [
  {
    id: '1',
    title: 'Välkomstsida',
    content: '# Välkommen\n\nDetta är vår välkomstsida.\n\n## Underrubrik\n\nDetta är en underrubrik med **fet text** och *kursiv text*.',
    slug: 'valkomstsida',
    isPublished: true,
    show: true,
    createdAt: '2023-03-15T12:00:00Z',
    updatedAt: '2023-03-15T12:00:00Z'
  },
  {
    id: '2',
    title: 'Om oss',
    content: '# Om oss\n\nVi är ett företag som fokuserar på kvalitet och kundnöjdhet.\n\n## Vår historia\n\nVårt företag grundades 2010 med målet att erbjuda de bästa produkterna på marknaden.',
    slug: 'om-oss',
    isPublished: true,
    show: true,
    createdAt: '2023-03-16T12:00:00Z',
    updatedAt: '2023-03-16T12:00:00Z'
  },
  {
    id: '3',
    title: 'Kontakt',
    content: '# Kontakta oss\n\nDu kan nå oss via följande kanaler:\n\n- Email: info@example.com\n- Telefon: 08-123 45 67\n- Adress: Exempelgatan 123, 123 45 Stockholm',
    slug: 'kontakt',
    isPublished: true,
    show: false,
    createdAt: '2023-03-17T12:00:00Z',
    updatedAt: '2023-03-17T12:00:00Z'
  }
];

// Service för att hantera sidor
const pageService = {
  // Hämta alla sidor
  getAllPages: (): Promise<Page[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...pages]);
      }, 500);
    });
  },

  // Hämta publicerade sidor
  getPublishedPages: (): Promise<Page[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(pages.filter(page => page.isPublished));
      }, 500);
    });
  },

  // Hämta publicerade sidor som ska visas i sidlistan
  getVisiblePages: (): Promise<Page[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(pages.filter(page => page.isPublished && page.show));
      }, 500);
    });
  },

  // Hämta en specifik sida med ID
  getPageById: (id: string): Promise<Page | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const page = pages.find(p => p.id === id) || null;
        resolve(page);
      }, 500);
    });
  },

  // Hämta en specifik sida med slug
  getPageBySlug: (slug: string): Promise<Page | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const page = pages.find(p => p.slug === slug) || null;
        resolve(page);
      }, 500);
    });
  },

  // Skapa en ny sida
  createPage: (pageData: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<Page> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = new Date().toISOString();
        const newPage: Page = {
          ...pageData,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now
        };
        
        pages = [...pages, newPage];
        resolve(newPage);
      }, 500);
    });
  },

  // Uppdatera en befintlig sida
  updatePage: (id: string, pageData: Partial<Omit<Page, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Page | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const pageIndex = pages.findIndex(p => p.id === id);
        
        if (pageIndex === -1) {
          resolve(null);
          return;
        }
        
        const updatedPage: Page = {
          ...pages[pageIndex],
          ...pageData,
          updatedAt: new Date().toISOString()
        };
        
        pages = [
          ...pages.slice(0, pageIndex),
          updatedPage,
          ...pages.slice(pageIndex + 1)
        ];
        
        resolve(updatedPage);
      }, 500);
    });
  },

  // Radera en sida
  deletePage: (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const initialLength = pages.length;
        pages = pages.filter(p => p.id !== id);
        resolve(pages.length < initialLength);
      }, 500);
    });
  }
};

export default pageService; 