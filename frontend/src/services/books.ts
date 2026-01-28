import { api } from './api';
import type { Book, BookListResponse, CreateBookRequest, Category, Review, CreateReviewRequest } from '@/types';

export const booksService = {
  async getBooks(params?: {
    q?: string;
    category_id?: number;
    page?: number;
    limit?: number;
  }): Promise<BookListResponse> {
    const response = await api.get<BookListResponse>('/books', { params });
    return response.data;
  },

  async getBookById(id: number): Promise<Book> {
    const response = await api.get<Book>(`/books/${id}`);
    return response.data;
  },

  async createBook(formData: FormData): Promise<Book> {
    const response = await api.post<Book>('/admin/books', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  async getBookReviews(bookId: number): Promise<{ items: Review[] }> {
    const response = await api.get<{ items: Review[] }>(`/books/${bookId}/reviews`);
    return response.data;
  },

  async createReview(bookId: number, review: CreateReviewRequest): Promise<Review> {
    const response = await api.post<Review>(`/books/${bookId}/reviews`, review);
    return response.data;
  },

  async getBookReadUrl(bookId: number): Promise<{ url: string }> {
    const response = await api.get<{ url: string }>(`/books/${bookId}/read`);
    return response.data;
  },
};

export const adminService = {
  async createCategory(name: string): Promise<Category> {
    const response = await api.post<Category>('/admin/categories', { name });
    return response.data;
  },

  async createUser(userData: {
    dni: string;
    full_name: string;
    password: string;
    role: string;
  }): Promise<User> {
    const response = await api.post<User>('/admin/users', userData);
    return response.data;
  },
};