-- Create storage buckets for avatars and project covers
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', false),
  ('project-covers', 'project-covers', false);

-- Storage policies for avatars bucket
CREATE POLICY "Users can view their own avatar" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for project-covers bucket
CREATE POLICY "Project owners can view project covers" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-covers' 
    AND EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id::text = (storage.foldername(name))[1] 
      AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Project owners can upload project covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-covers' 
    AND EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id::text = (storage.foldername(name))[1] 
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update project covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'project-covers' 
    AND EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id::text = (storage.foldername(name))[1] 
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete project covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-covers' 
    AND EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id::text = (storage.foldername(name))[1] 
      AND p.owner_id = auth.uid()
    )
  );