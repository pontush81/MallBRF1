import { supabaseClient as supabase } from './supabaseClient';

export interface Document {
  id: string;
  title: string;
  filename: string;
  filetype: string;
  doc_date: string | null;
  storage_path: string;
  file_size: number;
  checksum?: string; // Optional since it might not be available immediately
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
  date: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  url: string;
  filetype: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export interface UploadResponse {
  documentId: string;
  message: string;
}

class GulmaranGPTServiceSimple {
  private getSupabaseUrl() {
    return process.env.REACT_APP_SUPABASE_URL || 'https://qhdgqevdmvkrwnzpwikz.supabase.co';
  }

  private async getAuthToken(): Promise<string> {
    // Try Supabase session first with timeout
    try {
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getSession timeout after 3 seconds')), 3000)
      );
      
      const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
      const { data: { session }, error } = result;
      
      if (session?.access_token && !error) {
        console.log('✅ Got token from Supabase session');
        return session.access_token;
      }
      
    } catch (error) {
      console.log('⚠️ Supabase session failed:', error.message);
    }
    
    // Fallback: Check localStorage like your app does
    console.log('🔍 Checking localStorage for auth tokens...');
    try {
      const authData = localStorage.getItem('mallbrf-supabase-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.access_token) {
          console.log('✅ Found access token in localStorage');
          return parsed.access_token;
        }
      }
    } catch (e) {
      console.log('❌ Failed to parse localStorage auth data');
    }
    
    // Final fallback: Check if user exists in AuthContext but no token
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      console.log('⚠️ User exists in AuthContext but no Supabase token - need to re-authenticate');
      throw new Error('Session expired - please log out and log in again to use Gulmåran-GPT');
    }
    
    throw new Error('Not authenticated - please log in again');
  }

  async uploadDocument(file: File, title?: string, docDate?: string): Promise<UploadResponse> {
    try {
      console.log('📋 Creating FormData...');
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
      if (docDate) formData.append('docDate', docDate);

      console.log('🔐 Getting auth token...');
      const accessToken = await this.getAuthToken();

      console.log('✅ Found valid session, uploading...');
      const response = await fetch(`${this.getSupabaseUrl()}/functions/v1/gulmaran-upload-v2`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Upload failed:', error);
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('✅ Upload successful:', result);
      return result;
      
    } catch (error) {
      console.error('💥 Upload error:', error);
      
      // If auth error, show helpful message
      if (error.message.includes('Not authenticated') || error.message.includes('Session expired')) {
        console.log('🔄 Auth error detected...');
        if (error.message.includes('log out and log in again')) {
          alert('För att använda Gulmåran-GPT behöver du logga ut och logga in igen.\n\nDetta skapar en ny Supabase-session som krävs för filuppladdning.');
          setTimeout(() => window.location.href = '/login', 2000);
        } else {
          window.location.href = '/login';
        }
      }
      
      throw error;
    }
  }

  async getDocuments(): Promise<Document[]> {
    console.log('📋 Loading documents...');
    
    try {
      const accessToken = await this.getAuthToken();
      console.log('✅ Auth successful for getDocuments');
      
      // Use the gulmaran-get-documents Edge Function instead of direct DB access
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
      const error = await response.json();
      throw new Error(error.error || 'Chat request failed');
    }

    return await response.json();
  }

  async deleteDocument(documentId: string): Promise<void> {
    // Simple auth check - Supabase RLS will handle the rest
    await this.getAuthToken();

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  subscribeToDocumentUpdates(callback: (document: Document) => void) {
    const subscription = supabase
      .channel('documents-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'documents' },
        (payload) => {
          if (payload.new) {
            callback(payload.new as Document);
          }
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(subscription);
      }
    };
  }

  async getSignedUrl(documentId: string): Promise<string> {
    const accessToken = await this.getAuthToken();

    const response = await fetch(`${this.getSupabaseUrl()}/functions/v1/gulmaran-sign-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ documentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get signed URL');
    }

    const result = await response.json();
    return result.signedUrl;
  }
}

export const gulmaranGPTSimple = new GulmaranGPTServiceSimple();
