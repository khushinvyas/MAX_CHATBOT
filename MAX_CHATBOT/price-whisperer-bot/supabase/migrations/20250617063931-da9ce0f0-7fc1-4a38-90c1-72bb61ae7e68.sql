
-- Create a storage bucket for price list files
INSERT INTO storage.buckets (id, name, public)
VALUES ('price-lists', 'price-lists', true);

-- Create RLS policies for the price-lists bucket
CREATE POLICY "Admin can view all files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'price-lists');

CREATE POLICY "Admin can upload files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'price-lists');

CREATE POLICY "Admin can delete files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'price-lists');

CREATE POLICY "Admin can update files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'price-lists');
