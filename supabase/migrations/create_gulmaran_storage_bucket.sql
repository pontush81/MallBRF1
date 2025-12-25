-- Create storage bucket for Gulmåran-GPT documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gulmaran-documents',
  'gulmaran-documents', 
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the storage bucket
CREATE POLICY "Admin users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'gulmaran-documents' 
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'admin' AND isactive = true
  )
);

CREATE POLICY "Admin users can view documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'gulmaran-documents'
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'admin' AND isactive = true
  )
);

CREATE POLICY "Admin users can delete documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'gulmaran-documents'
  AND auth.uid()::text IN (
    SELECT id FROM public.users WHERE role = 'admin' AND isactive = true
  )
);

-- Allow authenticated users to access via signed URLs
CREATE POLICY "Authenticated users can access via signed URLs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'gulmaran-documents'
  AND auth.role() = 'authenticated'
);

