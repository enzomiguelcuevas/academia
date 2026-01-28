export const API_BASE_URL = 'http://localhost:3000/api';

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'access_token',
  USER: 'user',
  THEME: 'theme',
} as const;

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  BOOKS: '/books',
  BOOK_DETAIL: '/books/:id',
  ADMIN: '/admin',
  ADMIN_BOOKS: '/admin/books',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_USERS: '/admin/users',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

export const ROLES = {
  ADMIN: 'ADMIN',
  STUDENT: 'STUDENT',
} as const;