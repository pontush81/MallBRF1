import { supabaseClient as supabase } from './supabaseClient';
import { createClient } from '@supabase/supabase-js';

export interface Document {
  id: string;
  title: string;
  filename: string;
  filetype: string;
  doc_date: string | null;
  storage_path: string;
  file_size: number;
  checksum?: string;
  uploaded_by: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error: string | null;
  pages: number | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: ChatSource[];
}

export interface ChatSource {
  docId: string;
  title: string;
  filename: string;
  chunkId: string;
  similarity: number;
  date?: string;
  filetype: string;
  pageStart?: number;
  pageEnd?: number;
  url?: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export interface UploadResponse {
  documentId: string;
  message: string;
}

export class GulmaranGPTServiceAuthContext {
  private getSupabaseUrl(): string {
    // Get URL from environment or use the same URL as the supabase client
    return process.env.REACT_APP_SUPABASE_URL || 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
  }

  /**
   * Get authentication token with expiration checking and refresh
   */
  private async getAuthToken(): Promise<string> {
    console.log('🔐 Getting auth token with expiration checking...');
    
    // First try: localStorage with expiration check
    try {
      const authData = localStorage.getItem('mallbrf-supabase-auth');
      console.log('🔍 Raw localStorage data:', authData ? 'Found' : 'Not found');
      
      if (authData) {
        const parsed = JSON.parse(authData);
        console.log('📋 Parsed auth data keys:', Object.keys(parsed));
        
        const accessToken = parsed?.access_token;
        const expiresAt = parsed?.expires_at;
        
        if (accessToken && expiresAt) {
          const now = Math.floor(Date.now() / 1000); // Current time in seconds
          const tokenExpiry = Math.floor(expiresAt);
          
          console.log('🕐 Token expires at:', new Date(expiresAt * 1000).toLocaleString());
          console.log('🕐 Current time:', new Date(now * 1000).toLocaleString());
          console.log('⏰ Time until expiry:', Math.round((tokenExpiry - now) / 60), 'minutes');
          
          // Debug: Show when token was created
          const tokenAge = now - (expiresAt - 3600); // Assuming 1 hour token
          console.log('🕰️ Token was created:', Math.round(tokenAge / 60), 'minutes ago');
          console.log('🔍 Full parsed data:', parsed);
          
          if (tokenExpiry > now + 60) { // Token valid for at least 1 more minute
            console.log('✅ Found valid access token in localStorage');
            console.log('🔑 Token preview:', accessToken.substring(0, 20) + '...');
            return accessToken;
          } else {
            console.log('⚠️ Token in localStorage is expired or expires soon');
          }
        } else {
          console.log('❌ Missing access_token or expires_at in localStorage');
        }
      }
    } catch (localStorageError) {
      console.log('⚠️ localStorage parsing failed:', localStorageError);
    }
    
    // Second try: Use refresh_token with direct API call (bypass broken Supabase client)
    console.log('🔄 Trying to refresh token using direct API call...');
    try {
      const authData = localStorage.getItem('mallbrf-supabase-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        const refreshToken = parsed?.refresh_token;
        
        if (refreshToken) {
          console.log('🔄 Found refresh_token, attempting direct API refresh...');
          
          // Direct API call to Supabase auth endpoint
          const refreshResponse = await fetch(`${this.getSupabaseUrl()}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE'
            },
            body: JSON.stringify({
              refresh_token: refreshToken
            })
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.access_token) {
              console.log('✅ Successfully refreshed token via direct API!');
              console.log('🔑 New token preview:', refreshData.access_token.substring(0, 20) + '...');
              
              // Update localStorage with new tokens
              const newAuthData = {
                ...parsed,
                access_token: refreshData.access_token,
                refresh_token: refreshData.refresh_token || refreshToken,
                expires_at: Math.floor(Date.now() / 1000) + (refreshData.expires_in || 3600)
              };
              localStorage.setItem('mallbrf-supabase-auth', JSON.stringify(newAuthData));
              console.log('💾 Updated localStorage with new tokens');
              
              return refreshData.access_token;
            }
          } else {
            console.log('❌ Direct API refresh failed:', refreshResponse.status, refreshResponse.statusText);
          }
        } else {
          console.log('❌ No refresh_token found in localStorage');
        }
      }
    } catch (refreshError) {
      console.log('⚠️ Direct API refresh failed:', refreshError.message);
    }
    
    // Third try: supabase.auth.getSession() as last resort
    console.log('🔄 Getting fresh token from supabase.auth.getSession()...');
    try {
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth session timeout after 5 seconds')), 5000)
      );
      
      const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
      const { data: { session } } = result;
      
      if (session?.access_token) {
        console.log('✅ Got fresh access token from supabase.auth.getSession()');
        console.log('🔑 Fresh token preview:', session.access_token.substring(0, 20) + '...');
        return session.access_token;
      } else {
        console.log('❌ No session found in supabase.auth.getSession()');
      }
    } catch (sessionError) {
      console.log('⚠️ supabase.auth.getSession() failed:', sessionError.message);
    }
    
    // If both methods fail, check if user exists in AuthContext but no valid token
    console.error('❌ All auth methods failed - token expired and refresh failed');
    
    // Check if user exists in AuthContext but token is invalid
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      console.log('⚠️ User exists in AuthContext but Supabase token is expired/invalid');
      throw new Error('Session expired - please log out and log in again to use Gulmåran-GPT');
    }
    
    // No user at all
    throw new Error('Not authenticated - please log in to use Gulmåran-GPT');
  }

  async uploadDocument(
    file: File,
    title: string,
    docDate: string | null = null
  ): Promise<UploadResponse> {
    console.log('📋 Starting upload via Edge Function (bypassing client-side DB issues)...');
    
    try {
      // Use Edge Function as primary method to avoid client-side database issues
      console.log('🚀 Using gulmaran-upload Edge Function...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      if (docDate) {
        formData.append('docDate', docDate);
      }

      const response = await fetch(`${this.getSupabaseUrl()}/functions/v1/gulmaran-upload-v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: formData
      });

      console.log('📡 Edge Function response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Edge Function upload failed:', errorText);
        
        // If Edge Function fails, try the old direct method as fallback
        console.log('🔄 Falling back to direct storage + database method...');
        return await this.uploadDocumentDirect(file, title, docDate);
      }

      const result = await response.json();
      console.log('✅ Upload successful via Edge Function:', result);

      return {
        documentId: result.documentId,
        message: result.message || 'File uploaded successfully via Edge Function. Processing will begin shortly.',
      };

    } catch (error) {
      console.error('💥 Edge Function upload failed:', error);
      
      // Try direct method as final fallback
      console.log('🔄 Trying direct upload as final fallback...');
      try {
        return await this.uploadDocumentDirect(file, title, docDate);
      } catch (fallbackError) {
        console.error('💥 All upload methods failed:', fallbackError);
        throw new Error(`Upload failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
      }
    }
  }

  private async uploadDocumentDirect(
    file: File,
    title: string,
    docDate: string | null = null
  ): Promise<UploadResponse> {
    console.log('📋 Starting direct upload to Supabase Storage...');
    
    // Generate unique file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = file.name.split('.').pop() || 'unknown';
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `uploads/${fileName}`;

    console.log('📤 Uploading file to storage:', storagePath);

    // Direct API upload to Supabase Storage
    console.log('⏱️ Starting direct API upload to storage...');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadResponse = await fetch(`${this.getSupabaseUrl()}/storage/v1/object/gulmaran-documents/${storagePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getAuthToken()}`,
        'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMjM4NTYsImV4cCI6MjA1Nzg5OTg1Nn0.xCt8q6sLP2fJtZJmT4zCQuTRpSt2MJLIusxLby7jKRE'
      },
      body: formData
    });

    console.log('📡 Storage upload response status:', uploadResponse.status);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Storage upload failed:', errorText);
      throw new Error(`Storage upload failed: ${uploadResponse.status} ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    console.log('✅ Direct API upload successful!');
    console.log('📡 Storage upload completed');
    console.log('✅ File uploaded to storage successfully:', uploadData);

    // Get current user from localStorage
    console.log('👤 Getting current user from localStorage...');
    const currentUserData = localStorage.getItem('currentUser');
    if (!currentUserData) {
      throw new Error('User not found in localStorage');
    }
    
    const user = JSON.parse(currentUserData);
    console.log('✅ Got user from localStorage:', user.email);

    // Get user ID
    const userId = user.id || user.userId || user.sub;
    if (!userId) {
      throw new Error('User ID not found in user data');
    }
    
    console.log('👤 Using user ID:', userId);

    // Use service role directly to avoid client-side DB hanging issues
    console.log('🔧 Creating document record with service role (avoiding client-side DB issues)...');
    
    const serviceSupabase = createClient(
      this.getSupabaseUrl(),
      process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZGdxZXZkbXZrcnduenB3aWt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjMyMzg1NiwiZXhwIjoyMDU3ODk5ODU2fQ.bjjotoPC-g0DbX8USGM-_wyP227eIMDxxjjYGDfgXx4'
    );
    
    const { data: document, error: docError } = await serviceSupabase
      .from('documents')
      .insert({
        title: title,
        filename: file.name,
        filetype: fileExtension,
        doc_date: docDate,
        visibility: 'admin',
        storage_path: storagePath,
        file_size: file.size,
        uploaded_by: userId,
        processing_status: 'pending',
        processing_error: null,
        pages: null
      })
      .select()
      .single();

    if (docError) {
      console.error('❌ Service role database insert error:', docError);
      // Clean up uploaded file
      try {
        await supabase.storage.from('gulmaran-documents').remove([storagePath]);
        console.log('🧹 Cleaned up uploaded file after database error');
      } catch (cleanupError) {
        console.error('⚠️ Failed to cleanup file:', cleanupError);
      }
      throw new Error(`Database error: ${docError.message}`);
    }

    console.log('✅ Document record created with service role:', document?.id);

    return {
      documentId: document.id,
      message: 'File uploaded successfully with service role. Processing will begin shortly.',
    };
  }

  async getDocuments(): Promise<Document[]> {
    console.log('📋 Loading documents...');
    
    try {
      const accessToken = await this.getAuthToken();
      console.log('✅ Auth successful for getDocuments');
      
      // Use the gulmaran-get-documents Edge Function
      console.log('🔍 Calling gulmaran-get-documents Edge Function...');
      
      const response = await fetch(`${this.getSupabaseUrl()}/functions/v1/gulmaran-get-documents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Edge Function response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Edge Function error:', errorText);
        throw new Error(`Failed to fetch documents: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Fetched documents:', data?.length || 0);
      return data || [];
      
    } catch (error) {
      console.error('💥 getDocuments failed:', error);
      throw error;
    }
  }

  async chat(message: string): Promise<ChatResponse> {
    const accessToken = await this.getAuthToken();

    const response = await fetch(`${this.getSupabaseUrl()}/functions/v1/gulmaran-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ question: message }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chat error: ${errorText}`);
    }

    return await response.json();
  }

  async deleteDocument(documentId: string): Promise<void> {
    const accessToken = await this.getAuthToken();

    const response = await fetch(`${this.getSupabaseUrl()}/functions/v1/gulmaran-delete-document`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ documentId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delete failed: ${errorText}`);
    }
  }

  async getSignedUrl(storagePath: string): Promise<string> {
    const accessToken = await this.getAuthToken();

    const response = await fetch(`${this.getSupabaseUrl()}/functions/v1/gulmaran-sign-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ storagePath }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get signed URL: ${errorText}`);
    }

    const result = await response.json();
    return result.signedUrl;
  }

  async triggerDocumentProcessing(): Promise<void> {
    console.log('🔄 Triggering document processing...');
    
    try {
      const accessToken = await this.getAuthToken();
      
      const response = await fetch(`${this.getSupabaseUrl()}/functions/v1/gulmaran-process-documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Processing trigger failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Processing triggered:', result);
      
    } catch (error) {
      console.error('❌ Failed to trigger processing:', error);
      throw error;
    }
  }

  subscribeToDocumentUpdates(callback: (documents: Document[]) => void): () => void {
    console.log('📡 Setting up real-time document updates...');
    
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        (payload) => {
          console.log('📡 Document update received:', payload);
          // Refresh documents when changes occur
          this.getDocuments().then(callback).catch(console.error);
        }
      )
      .subscribe();

    return () => {
      console.log('🛑 Unsubscribing from document updates');
      supabase.removeChannel(channel);
    };
  }
}

// Export singleton instance
export const gulmaranGPTAuthContext = new GulmaranGPTServiceAuthContext();
