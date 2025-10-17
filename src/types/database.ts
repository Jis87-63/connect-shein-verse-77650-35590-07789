// Temporary type definitions for database tables
export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  external_url: string | null;
  image_url: string | null;
  document_url: string | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
}

export interface SupportMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}
