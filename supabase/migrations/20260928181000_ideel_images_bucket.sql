-- Ideel-like: logos bucket in the shared project. Being a public bucket, files are served by public URL
-- without any policy; the select policy only lets a user list/manage their own folder (no public listing).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ideel-images', 'ideel-images', true, 1048576, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "ideel_images_select_own_folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ideel-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ideel_images_insert_own_folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ideel-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ideel_images_update_own_folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'ideel-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'ideel-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ideel_images_delete_own_folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ideel-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
