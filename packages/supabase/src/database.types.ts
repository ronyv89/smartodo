// Auto-generated Supabase database types (manually maintained until `supabase gen types` is wired)
// Mirrors the schema defined in supabase/migrations/
// Note: Relationships are omitted (empty) since we use explicit foreign-key queries

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          preferences: Json;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string | null;
          preferences?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          preferences?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          settings: Json;
          plan_tier: 'community' | 'pro';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
          settings?: Json;
          plan_tier?: 'community' | 'pro';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          owner_id?: string;
          settings?: Json;
          plan_tier?: 'community' | 'pro';
          created_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: 'admin' | 'member' | 'viewer';
          joined_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: 'admin' | 'member' | 'viewer';
          joined_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: 'admin' | 'member' | 'viewer';
          joined_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          color: string;
          view_default: 'list' | 'board';
          sort_order: number;
          archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          color?: string;
          view_default?: 'list' | 'board';
          sort_order?: number;
          archived?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          description?: string | null;
          color?: string;
          view_default?: 'list' | 'board';
          sort_order?: number;
          archived?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          parent_id: string | null;
          assignee_id: string | null;
          title: string;
          description: string | null;
          status: 'todo' | 'in_progress' | 'done' | 'cancelled';
          priority: 'p1' | 'p2' | 'p3' | 'p4';
          due_date: string | null;
          sort_order: number;
          custom_fields: Json;
          ai_metadata: Json;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          parent_id?: string | null;
          assignee_id?: string | null;
          title: string;
          description?: string | null;
          status?: 'todo' | 'in_progress' | 'done' | 'cancelled';
          priority?: 'p1' | 'p2' | 'p3' | 'p4';
          due_date?: string | null;
          sort_order?: number;
          custom_fields?: Json;
          ai_metadata?: Json;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          parent_id?: string | null;
          assignee_id?: string | null;
          title?: string;
          description?: string | null;
          status?: 'todo' | 'in_progress' | 'done' | 'cancelled';
          priority?: 'p1' | 'p2' | 'p3' | 'p4';
          due_date?: string | null;
          sort_order?: number;
          custom_fields?: Json;
          ai_metadata?: Json;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      labels: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          color: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          color?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          color?: string;
        };
        Relationships: [];
      };
      task_labels: {
        Row: {
          task_id: string;
          label_id: string;
        };
        Insert: {
          task_id: string;
          label_id: string;
        };
        Update: {
          task_id?: string;
          label_id?: string;
        };
        Relationships: [];
      };
      task_comments: {
        Row: {
          id: string;
          task_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          author_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          author_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          task_id: string;
          actor_id: string;
          action: string;
          diff: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          actor_id: string;
          action: string;
          diff?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          actor_id?: string;
          action?: string;
          diff?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      task_attachments: {
        Row: {
          id: string;
          task_id: string;
          uploader_id: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          uploader_id: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          uploader_id?: string;
          file_name?: string;
          file_size?: number;
          mime_type?: string;
          storage_path?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
