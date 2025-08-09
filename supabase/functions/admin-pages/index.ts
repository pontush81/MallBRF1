import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface UpdatePageRequest {
  id: string;
  pageData: {
    title?: string;
    content?: string;
    ispublished?: boolean;
    show?: boolean;
    files?: string;
    slug?: string;
  };
  userEmail?: string;
  userRole?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service key for admin operations (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const method = req.method;

    // Route: GET /admin-pages (get all pages)
    if (method === 'GET') {
      console.log('📖 Admin: Fetching all pages');
      
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('title', { ascending: true });

      if (error) {
        console.error('❌ Error fetching pages:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch pages' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ pages: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route: PUT /admin-pages (update page)
    if (method === 'PUT') {
      const requestBody: UpdatePageRequest = await req.json();
      console.log('📝 Admin: Updating page:', requestBody.id);
      console.log('👤 User:', requestBody.userEmail, 'Role:', requestBody.userRole);

      // Basic admin check (could be enhanced with better validation)
      if (!requestBody.userEmail || requestBody.userRole !== 'admin') {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Prepare update data with updatedat timestamp
      const updateData = {
        ...requestBody.pageData,
        updatedat: new Date().toISOString()
      };

      console.log('📝 Update data:', updateData);

      // Update the page using service role (bypasses RLS)
      const { data, error } = await supabase
        .from('pages')
        .update(updateData)
        .eq('id', requestBody.id)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error updating page:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to update page',
          details: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!data) {
        return new Response(JSON.stringify({ error: 'Page not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ Page updated successfully:', data.title);
      return new Response(JSON.stringify({ page: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route: POST /admin-pages (create page)
    if (method === 'POST') {
      const requestBody: Omit<UpdatePageRequest, 'id'> & { pageData: UpdatePageRequest['pageData'] & { createdat?: string } } = await req.json();
      console.log('➕ Admin: Creating new page');
      console.log('👤 User:', requestBody.userEmail, 'Role:', requestBody.userRole);

      // Basic admin check
      if (!requestBody.userEmail || requestBody.userRole !== 'admin') {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Prepare create data with timestamps
      const createData = {
        ...requestBody.pageData,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      };

      console.log('➕ Create data:', createData);

      // Create the page using service role (bypasses RLS)
      const { data, error } = await supabase
        .from('pages')
        .insert(createData)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error creating page:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to create page',
          details: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ Page created successfully:', data.title);
      return new Response(JSON.stringify({ page: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route: DELETE /admin-pages (delete page with ID in request body)
    if (method === 'DELETE') {
      const requestBody = await req.json();
      const pageId = requestBody.id;
      
      if (!pageId) {
        return new Response(JSON.stringify({ error: 'Page ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('🗑️ Admin: Deleting page:', pageId);
      console.log('👤 User:', requestBody.userEmail, 'Role:', requestBody.userRole);

      // Basic admin check
      if (!requestBody.userEmail || requestBody.userRole !== 'admin') {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Delete the page using service role (bypasses RLS)
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId);

      if (error) {
        console.error('❌ Error deleting page:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to delete page',
          details: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ Page deleted successfully');
      return new Response(JSON.stringify({ message: 'Page deleted successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Unsupported method
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Admin pages function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 