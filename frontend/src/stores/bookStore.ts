import { create } from 'zustand';
import type { Book, Category, BookListResponse } from '@/types';
import { booksService } from '@/services/books';

interface BookState {
  books: Book[];
  categories: Category[];
  currentBook: Book | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  searchQuery: string;
  selectedCategory: number | null;
  
  fetchBooks: (params?: {
    q?: string;
    category_id?: number;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchBookById: (id: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createBook: (formData: FormData) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: number | null) => void;
  clearError: () => void;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  categories: [],
  currentBook: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
  searchQuery: '',
  selectedCategory: null,

  fetchBooks: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await booksService.getBooks(params);
      set({
        books: response.items,
        pagination: {
          page: response.page,
          limit: response.limit,
          total: response.total,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch books',
        isLoading: false,
      });
    }
  },

  fetchBookById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const book = await booksService.getBookById(id);
      set({ currentBook: book, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch book',
        isLoading: false,
      });
    }
  },

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const categories = await booksService.getCategories();
      set({ categories, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
        isLoading: false,
      });
    }
  },

  createBook: async (formData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const book = await booksService.createBook(formData);
      const { books } = get();
      set({
        books: [book, ...books],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create book',
        isLoading: false,
      });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setSelectedCategory: (categoryId: number | null) => {
    set({ selectedCategory: categoryId });
  },

  clearError: () => {
    set({ error: null });
  },
}));