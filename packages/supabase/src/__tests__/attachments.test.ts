import {
  listAttachments,
  uploadAttachment,
  deleteAttachment,
  getAttachmentUrl,
} from '../attachments';

// Mock the Supabase client
jest.mock('../client', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

import { supabase } from '../client';

/* eslint-disable jest/unbound-method */
const mockFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;
const mockStorageFrom = supabase.storage.from as jest.MockedFunction<typeof supabase.storage.from>;
/* eslint-enable jest/unbound-method */

const MOCK_ATTACHMENT = {
  id: 'att-1',
  task_id: 'task-1',
  uploader_id: 'user-1',
  file_name: 'spec.pdf',
  file_size: 2048,
  mime_type: 'application/pdf',
  storage_path: 'task-1/1234567890-spec.pdf',
  created_at: '2026-04-11T10:00:00Z',
};

describe('listAttachments', () => {
  it('returns attachments for a task', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [MOCK_ATTACHMENT], error: null }),
    };
    mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>);

    const { data, error } = await listAttachments('task-1');
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]?.file_name).toBe('spec.pdf');
  });

  it('returns empty array when no attachments', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>);

    const { data } = await listAttachments('task-1');
    expect(data).toHaveLength(0);
  });
});

describe('uploadAttachment', () => {
  it('uploads file and inserts metadata row', async () => {
    const mockStorageChain = {
      upload: jest.fn().mockResolvedValue({ error: null }),
    };
    mockStorageFrom.mockReturnValue(
      mockStorageChain as unknown as ReturnType<typeof supabase.storage.from>,
    );

    const dbChain = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: MOCK_ATTACHMENT, error: null }),
    };
    mockFrom.mockReturnValue(dbChain as unknown as ReturnType<typeof supabase.from>);

    const file = new File(['hello'], 'spec.pdf', { type: 'application/pdf' });
    const { data, error } = await uploadAttachment('task-1', 'user-1', file);

    expect(error).toBeNull();
    expect(data?.file_name).toBe('spec.pdf');
    expect(mockStorageChain.upload).toHaveBeenCalledTimes(1);
  });

  it('returns error when storage upload fails', async () => {
    const storageError = new Error('Storage quota exceeded');
    const mockStorageChain = {
      upload: jest.fn().mockResolvedValue({ error: storageError }),
    };
    mockStorageFrom.mockReturnValue(
      mockStorageChain as unknown as ReturnType<typeof supabase.storage.from>,
    );

    const file = new File(['hello'], 'large.zip', { type: 'application/zip' });
    const { data, error } = await uploadAttachment('task-1', 'user-1', file);

    expect(data).toBeNull();
    expect(error?.message).toBe('Storage quota exceeded');
  });
});

describe('deleteAttachment', () => {
  it('removes from storage and database', async () => {
    const mockStorageChain = {
      remove: jest.fn().mockResolvedValue({ error: null }),
    };
    mockStorageFrom.mockReturnValue(
      mockStorageChain as unknown as ReturnType<typeof supabase.storage.from>,
    );

    const dbChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(dbChain as unknown as ReturnType<typeof supabase.from>);

    const { error } = await deleteAttachment(MOCK_ATTACHMENT);
    expect(error).toBeNull();
    expect(mockStorageChain.remove).toHaveBeenCalledWith([MOCK_ATTACHMENT.storage_path]);
  });
});

describe('getAttachmentUrl', () => {
  it('returns a signed URL', async () => {
    const mockStorageChain = {
      createSignedUrl: jest
        .fn()
        .mockResolvedValue({ data: { signedUrl: 'https://example.com/signed' }, error: null }),
    };
    mockStorageFrom.mockReturnValue(
      mockStorageChain as unknown as ReturnType<typeof supabase.storage.from>,
    );

    const { data, error } = await getAttachmentUrl('task-1/file.pdf');
    expect(error).toBeNull();
    expect(data).toBe('https://example.com/signed');
  });
});
