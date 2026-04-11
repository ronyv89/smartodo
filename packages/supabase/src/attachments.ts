import { supabase } from './client';
import type { Database } from './database.types';

export type TaskAttachment = Database['public']['Tables']['task_attachments']['Row'];

const BUCKET = 'task-attachments';

export interface AttachmentResult<T = void> {
  data: T | null;
  error: Error | null;
}

/** List all attachments for a task. */
export async function listAttachments(taskId: string): Promise<AttachmentResult<TaskAttachment[]>> {
  const { data, error } = await supabase
    .from('task_attachments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  return { data, error };
}

/**
 * Upload a file to Supabase Storage and record metadata in task_attachments.
 * Returns the created attachment row.
 */
export async function uploadAttachment(
  taskId: string,
  uploaderId: string,
  file: File,
): Promise<AttachmentResult<TaskAttachment>> {
  const ext = file.name.split('.').pop() ?? '';
  const storagePath = `${taskId}/${String(Date.now())}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError !== null) {
    return { data: null, error: uploadError };
  }

  const { data, error } = await supabase
    .from('task_attachments')
    .insert({
      task_id: taskId,
      uploader_id: uploaderId,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || (ext.length > 0 ? `application/${ext}` : 'application/octet-stream'),
      storage_path: storagePath,
    })
    .select()
    .single();

  return { data, error };
}

/** Delete an attachment from Storage and the database. */
export async function deleteAttachment(attachment: TaskAttachment): Promise<AttachmentResult> {
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([attachment.storage_path]);

  if (storageError !== null) {
    return { data: null, error: storageError };
  }

  const { error } = await supabase.from('task_attachments').delete().eq('id', attachment.id);

  return { data: null, error };
}

/** Get a short-lived signed URL for downloading an attachment. */
export async function getAttachmentUrl(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<AttachmentResult<string>> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  return { data: data?.signedUrl ?? null, error };
}
