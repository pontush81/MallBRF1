import supabaseClient from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_BUCKET = 'page-files';

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
      console.log('Uploading file to Supabase Storage:', file.name);

      // Generera säkert filnamn
      const safeFilename = generateSafeFilename(file.name);
      const filePath = pageId ? `pages/${pageId}/${safeFilename}` : `general/${safeFilename}`;

      // Ladda upp filen
      const { data, error } = await supabaseClient.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading file:', error);
        throw new Error(`Kunde inte ladda upp filen: ${error.message}`);
      }

      // Hämta den publika URL:en
      const { data: urlData } = supabaseClient.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const uploadedFile: UploadedFile = {
        id: data.path, // Använd storage-path som ID
        url: urlData.publicUrl,
        originalName: file.name,
        filename: safeFilename,
        mimetype: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };

      console.log('File uploaded successfully:', uploadedFile);
      return uploadedFile;

    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  },

  // Ta bort fil från Supabase Storage
  deleteFile: async (filePath: string): Promise<boolean> => {
    try {
      console.log('Deleting file from Supabase Storage:', filePath);

      const { error } = await supabaseClient.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file:', error);
        return false;
      }

      console.log('File deleted successfully:', filePath);
      return true;

    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  },

  // Lista filer för en specifik sida
  listFiles: async (pageId: string): Promise<UploadedFile[]> => {
    try {
      const { data, error } = await supabaseClient.storage
        .from(STORAGE_BUCKET)
        .list(`pages/${pageId}`, {
          limit: 100,
          offset: 0
        });

      if (error) {
        console.error('Error listing files:', error);
        return [];
      }

      const files: UploadedFile[] = data?.map(file => {
        const filePath = `pages/${pageId}/${file.name}`;
        const { data: urlData } = supabaseClient.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);

        return {
          id: filePath,
          url: urlData.publicUrl,
          originalName: file.name,
          filename: file.name,
          mimetype: file.metadata?.mimetype || 'application/octet-stream',
          size: file.metadata?.size || 0,
          uploadedAt: file.created_at || new Date().toISOString()
        };
      }) || [];

      return files;

    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  },

  // Hämta fil-URL (för privata filer)
  getFileUrl: async (filePath: string, expiresIn: number = 3600): Promise<string | null> => {
    try {
      const { data, error } = await supabaseClient.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;

    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  },

  // Kontrollera om bucket existerar, annars skapa den
  ensureBucketExists: async (): Promise<boolean> => {
    try {
      // Lista buckets för att se om vår bucket finns
      const { data: buckets, error: listError } = await supabaseClient.storage.listBuckets();

      if (listError) {
        console.error('Error listing buckets:', listError);
        return false;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);

      if (!bucketExists) {
        console.log(`Creating storage bucket: ${STORAGE_BUCKET}`);
        
        // Skapa bucket om den inte finns
        const { error: createError } = await supabaseClient.storage.createBucket(STORAGE_BUCKET, {
          public: true,
          allowedMimeTypes: ['image/*', 'application/pdf', 'text/*'],
          fileSizeLimit: 10485760 // 10MB
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          return false;
        }

        console.log(`Storage bucket created: ${STORAGE_BUCKET}`);
      }

      return true;

    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      return false;
    }
  }
};

export default supabaseStorage; 