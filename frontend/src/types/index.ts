export type Role = 'ADMIN' | 'STUDENT';

export interface User {
  id: number;
  dni: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
}

export interface LoginRequest {
  dni: string;
  password: string;
}

export interface RegisterRequest {
  dni: string;
  full_name: string;
  password: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  cover_url?: string;
  is_downloadable: boolean;
  category_id: number;
  category?: Category;
  created_at: string;
  updated_at: string;
}

export interface BookListResponse {
  items: Book[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateBookRequest {
  title: string;
  author: string;
  description?: string;
  category_id: number;
  cover_url?: string;
  is_downloadable?: boolean;
  file: File;
}

export interface Review {
  id: number;
  user_id: number;
  book_id: number;
  enrollment_id?: number;
  parent_id?: number;
  rating?: number;
  comment: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  replies?: Review[];
}

export interface CreateReviewRequest {
  parent_id?: number;
  rating?: number;
  comment: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
}