// eslint-disable-next-line @typescript-eslint/no-unused-vars
import supabaseClient from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_BUCKET = 'page-files';

// Direct REST API helper for storage operations
const SUPABASE_URL = 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE';

// Direct storage API calls to bypass hanging SDK
async function directStorageCall(method: string, endpoint: string, body?: any, timeout: number = 10000) {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/${endpoint}`, {
    method,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      ...(method !== 'GET' && body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {})
    },
    body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    signal: AbortSignal.timeout(timeout)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Direct storage API error: ${response.status} ${errorText}`);
  }

  if (method === 'DELETE') {
    return null;
  }

  return await response.json();
}

export interface UploadedFile {
  id: string;
  url: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadedAt: string;
}

// Helper function to get file extension
function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Helper function to generate safe filename
function generateSafeFilename(originalName: string): string {
  const extension = getFileExtension(originalName);
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');
  const uniqueId = uuidv4().substring(0, 8);
  return `${baseName}_${uniqueId}.${extension}`;
}

const supabaseStorage = {
  // Ladda upp fil till Supabase Storage
  uploadFile: async (file: File, pageId?: string): Promise<UploadedFile> => {
    try {
      console.log('🚀 Uploading file via direct storage API:', file.name);

      // Generera säkert filnamn
      const safeFilename = generateSafeFilename(file.name);
      const filePath = pageId ? `pages/${pageId}/${safeFilename}` : `general/${safeFilename}`;

      // Skapa FormData för file upload
      const formData = new FormData();
      formData.append('file', file);

      // Ladda upp filen via direct storage API
      const endpoint = `object/${STORAGE_BUCKET}/${filePath}`;
      await directStorageCall('POST', endpoint, formData, 30000); // 30s timeout for uploads

      // Generera public URL direkt
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filePath}`;

      const uploadedFile: UploadedFile = {
        id: filePath, // Använd filePath som ID
        url: publicUrl,
        originalName: file.name,
        filename: safeFilename,
        mimetype: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };

      console.log('✅ File uploaded successfully via direct API (FAST!):', uploadedFile);
      return uploadedFile;

    } catch (error) {
      console.error('❌ File upload error via direct API:', error);
      throw error;
    }
  },

  // Ta bort fil från Supabase Storage
  deleteFile: async (filePath: string): Promise<boolean> => {
    try {
      console.log('🚀 Deleting file via direct storage API:', filePath);

      const endpoint = `object/${STORAGE_BUCKET}/${filePath}`;
      await directStorageCall('DELETE', endpoint);

      console.log('✅ File deleted successfully via direct API (FAST!):', filePath);
      return true;

    } catch (error) {
      console.error('❌ File deletion error via direct API:', error);
      return false;
    }
  },

  // Lista filer för en specifik sida
  listFiles: async (pageId: string): Promise<UploadedFile[]> => {
    try {
      console.log('🚀 Listing files via direct storage API for page:', pageId);

      const endpoint = `object/list/${STORAGE_BUCKET}?prefix=pages/${pageId}&limit=100`;
      const data = await directStorageCall('POST', endpoint, { prefix: `pages/${pageId}`, limit: 100 });

      const files: UploadedFile[] = data?.map((file: any) => {
        const filePath = `pages/${pageId}/${file.name}`;
        // Generate public URL directly
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filePath}`;

        return {
          id: filePath,
          url: publicUrl,
          originalName: file.name,
          filename: file.name,
          mimetype: file.metadata?.mimetype || 'application/octet-stream',
          size: file.metadata?.size || 0,
          uploadedAt: file.created_at || new Date().toISOString()
        };
      }) || [];

      console.log(`✅ Listed ${files.length} files via direct API (FAST!) for page:`, pageId);
      return files;

    } catch (error) {
      console.error('❌ Error listing files via direct API:', error);
      return [];
    }
  },

  // Hämta fil-URL (för privata filer)
  getFileUrl: async (filePath: string, expiresIn: number = 3600): Promise<string | null> => {
    try {
      console.log('🚀 Creating signed URL via direct storage API:', filePath);

      const endpoint = `object/sign/${STORAGE_BUCKET}/${filePath}`;
      const data = await directStorageCall('POST', endpoint, { expiresIn });

      console.log('✅ Created signed URL via direct API (FAST!):', filePath);
      return data.signedUrl;

    } catch (error) {
      console.error('❌ Error creating signed URL via direct API:', error);
      return null;
    }
  },

  // Kontrollera om bucket existerar, annars skapa den
  ensureBucketExists: async (): Promise<boolean> => {
    try {
      console.log('🚀 Checking bucket existence via direct storage API...');

      // Lista buckets för att se om vår bucket finns
      const buckets = await directStorageCall('GET', 'bucket');

      const bucketExists = buckets?.some((bucket: any) => bucket.name === STORAGE_BUCKET);

      if (!bucketExists) {
        console.log(`🔨 Creating storage bucket via direct API: ${STORAGE_BUCKET}`);
        
        // Skapa bucket om den inte finns
        await directStorageCall('POST', 'bucket', {
          id: STORAGE_BUCKET,
          name: STORAGE_BUCKET,
          public: true,
          allowed_mime_types: ['image/*', 'application/pdf', 'text/*'],
          file_size_limit: 10485760 // 10MB
        });

        console.log(`✅ Storage bucket created via direct API (FAST!): ${STORAGE_BUCKET}`);
      } else {
        console.log(`✅ Storage bucket exists: ${STORAGE_BUCKET}`);
      }

      return true;

    } catch (error) {
      console.error('❌ Error ensuring bucket exists via direct API:', error);
      return false;
    }
  }
};

export default supabaseStorage; 